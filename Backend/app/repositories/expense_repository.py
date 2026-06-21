from __future__ import annotations

import uuid
from datetime import date
from typing import Optional, Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ExpenseCategory
from app.models.expense import Expense


class ExpenseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _base(self):
        return select(Expense).where(Expense.is_deleted.is_(False))

    async def get_by_id(self, expense_id: uuid.UUID) -> Optional[Expense]:
        expense = await self.db.get(Expense, expense_id)
        if expense is None or expense.is_deleted:
            return None
        return expense

    def _filtered(
        self,
        *,
        category: Optional[ExpenseCategory] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        search: Optional[str] = None,
    ):
        stmt = self._base()
        if category:
            stmt = stmt.where(Expense.category == category)
        if date_from:
            stmt = stmt.where(Expense.date >= date_from)
        if date_to:
            stmt = stmt.where(Expense.date <= date_to)
        if search:
            like = f"%{search}%"
            stmt = stmt.where(or_(Expense.description.ilike(like), Expense.notes.ilike(like)))
        return stmt

    async def list(self, *, offset: int, limit: int, **filters) -> Sequence[Expense]:
        stmt = self._filtered(**filters).order_by(Expense.date.desc()).offset(offset).limit(limit)
        res = await self.db.execute(stmt)
        return res.scalars().all()

    async def list_all(self, **filters) -> Sequence[Expense]:
        stmt = self._filtered(**filters).order_by(Expense.date.desc())
        res = await self.db.execute(stmt)
        return res.scalars().all()

    async def count(self, **filters) -> int:
        stmt = self._filtered(**filters)
        res = await self.db.execute(select(func.count()).select_from(stmt.subquery()))
        return int(res.scalar_one())

    async def totals(self) -> dict:
        today = date.today()
        month_start = today.replace(day=1)
        year_start = today.replace(month=1, day=1)
        total_month = await self.db.scalar(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(
                Expense.is_deleted.is_(False), Expense.date >= month_start
            )
        )
        total_year = await self.db.scalar(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(
                Expense.is_deleted.is_(False), Expense.date >= year_start
            )
        )
        rows = await self.db.execute(
            select(Expense.category, func.coalesce(func.sum(Expense.amount), 0))
            .where(Expense.is_deleted.is_(False), Expense.date >= year_start)
            .group_by(Expense.category)
        )
        by_category = {row[0].value: row[1] for row in rows.all()}
        return {
            "total_this_month": total_month or 0,
            "total_this_year": total_year or 0,
            "by_category": by_category,
        }

    async def add(self, expense: Expense) -> Expense:
        self.db.add(expense)
        await self.db.flush()
        await self.db.refresh(expense)
        return expense
