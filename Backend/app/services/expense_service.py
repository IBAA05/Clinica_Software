from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.expense import Expense
from app.repositories.expense_repository import ExpenseRepository
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


class ExpenseService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ExpenseRepository(db)

    async def get(self, expense_id: uuid.UUID) -> Expense:
        expense = await self.repo.get_by_id(expense_id)
        if expense is None:
            raise NotFoundError("Expense not found")
        return expense

    async def list(self, *, offset: int, limit: int, **filters):
        items = await self.repo.list(offset=offset, limit=limit, **filters)
        total = await self.repo.count(**filters)
        totals = await self.repo.totals()
        return items, total, totals

    async def list_all(self, **filters):
        return await self.repo.list_all(**filters)

    async def create(self, data: ExpenseCreate, created_by: uuid.UUID) -> Expense:
        expense = Expense(**data.model_dump(), created_by=created_by)
        return await self.repo.add(expense)

    async def update(self, expense_id: uuid.UUID, data: ExpenseUpdate) -> Expense:
        expense = await self.get(expense_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(expense, field, value)
        await self.db.flush()
        await self.db.refresh(expense)
        return expense

    async def delete(self, expense_id: uuid.UUID) -> None:
        expense = await self.get(expense_id)
        expense.is_deleted = True
        await self.db.flush()
