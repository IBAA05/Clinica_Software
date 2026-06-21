from __future__ import annotations

import uuid
from datetime import date
from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import InvoiceStatus, PaymentMethod
from app.models.invoice import Invoice
from app.models.patient import Patient


class InvoiceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _base(self):
        return select(Invoice).where(Invoice.is_deleted.is_(False))

    async def get_by_id(self, invoice_id: uuid.UUID) -> Optional[Invoice]:
        stmt = (
            self._base()
            .where(Invoice.id == invoice_id)
            .options(selectinload(Invoice.items), selectinload(Invoice.patient))
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    def _filtered(
        self,
        *,
        status: Optional[InvoiceStatus] = None,
        payment_method: Optional[PaymentMethod] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        patient_id: Optional[uuid.UUID] = None,
        patient_name: Optional[str] = None,
    ):
        stmt = self._base().join(Patient, Invoice.patient_id == Patient.id)
        if status:
            stmt = stmt.where(Invoice.status == status)
        if payment_method:
            stmt = stmt.where(Invoice.payment_method == payment_method)
        if date_from:
            stmt = stmt.where(Invoice.issue_date >= date_from)
        if date_to:
            stmt = stmt.where(Invoice.issue_date <= date_to)
        if patient_id:
            stmt = stmt.where(Invoice.patient_id == patient_id)
        if patient_name:
            stmt = stmt.where(Patient.full_name.ilike(f"%{patient_name}%"))
        return stmt

    async def list(self, *, offset: int, limit: int, **filters) -> Sequence[Invoice]:
        stmt = (
            self._filtered(**filters)
            .options(selectinload(Invoice.items), selectinload(Invoice.patient))
            .order_by(Invoice.issue_date.desc())
            .offset(offset)
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        return res.scalars().all()

    async def count(self, **filters) -> int:
        stmt = self._filtered(**filters)
        res = await self.db.execute(select(func.count()).select_from(stmt.subquery()))
        return int(res.scalar_one())

    async def for_patient(self, patient_id: uuid.UUID) -> Sequence[Invoice]:
        stmt = (
            self._base()
            .where(Invoice.patient_id == patient_id)
            .options(selectinload(Invoice.items))
            .order_by(Invoice.issue_date.desc())
        )
        res = await self.db.execute(stmt)
        return res.scalars().all()

    async def overdue(self) -> Sequence[Invoice]:
        today = date.today()
        stmt = (
            self._base()
            .where(Invoice.balance > 0, Invoice.due_date < today)
            .options(selectinload(Invoice.patient))
            .order_by(Invoice.due_date)
        )
        res = await self.db.execute(stmt)
        return res.scalars().all()

    async def next_sequence(self, year: int) -> int:
        prefix = f"CLN-INV-{year}-"
        res = await self.db.execute(
            select(func.count()).select_from(Invoice).where(Invoice.invoice_ref.like(f"{prefix}%"))
        )
        return int(res.scalar_one() or 0) + 1

    async def stats(self, **filters) -> dict:
        stmt = self._filtered(**filters).subquery()
        total_revenue = await self.db.scalar(select(func.coalesce(func.sum(stmt.c.total), 0)))
        collected = await self.db.scalar(select(func.coalesce(func.sum(stmt.c.amount_paid), 0)))
        pending = await self.db.scalar(select(func.coalesce(func.sum(stmt.c.balance), 0)))
        today = date.today()
        overdue = await self.db.scalar(
            select(func.coalesce(func.sum(stmt.c.balance), 0)).where(stmt.c.due_date < today)
        )
        return {
            "total_revenue": total_revenue or 0,
            "collected": collected or 0,
            "pending": pending or 0,
            "overdue": overdue or 0,
        }

    async def add(self, invoice: Invoice) -> Invoice:
        self.db.add(invoice)
        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice
