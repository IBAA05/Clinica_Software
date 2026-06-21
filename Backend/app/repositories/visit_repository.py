from __future__ import annotations

import uuid
from datetime import date
from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.prescription import Prescription
from app.models.visit import Visit


class VisitRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _base(self):
        return select(Visit).where(Visit.is_deleted.is_(False))

    async def get_by_id(self, visit_id: uuid.UUID, with_prescriptions: bool = True) -> Optional[Visit]:
        stmt = self._base().where(Visit.id == visit_id)
        if with_prescriptions:
            stmt = stmt.options(selectinload(Visit.prescriptions))
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    def _filtered(
        self,
        *,
        patient_id: Optional[uuid.UUID] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        diagnosis_code: Optional[str] = None,
    ):
        stmt = self._base()
        if patient_id:
            stmt = stmt.where(Visit.patient_id == patient_id)
        if date_from:
            stmt = stmt.where(Visit.visit_date >= date_from)
        if date_to:
            stmt = stmt.where(Visit.visit_date <= date_to)
        if diagnosis_code:
            stmt = stmt.where(Visit.diagnosis_code == diagnosis_code)
        return stmt

    async def list(self, *, offset: int, limit: int, **filters) -> Sequence[Visit]:
        stmt = (
            self._filtered(**filters)
            .options(selectinload(Visit.prescriptions))
            .order_by(Visit.visit_date.desc())
            .offset(offset)
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        return res.scalars().all()

    async def count(self, **filters) -> int:
        stmt = self._filtered(**filters)
        res = await self.db.execute(select(func.count()).select_from(stmt.subquery()))
        return int(res.scalar_one())

    async def for_patient(self, patient_id: uuid.UUID) -> Sequence[Visit]:
        stmt = (
            self._base()
            .where(Visit.patient_id == patient_id)
            .options(selectinload(Visit.prescriptions))
            .order_by(Visit.visit_date.desc())
        )
        res = await self.db.execute(stmt)
        return res.scalars().all()

    async def add(self, visit: Visit) -> Visit:
        self.db.add(visit)
        await self.db.flush()
        await self.db.refresh(visit)
        return visit

    # ── Prescriptions ─────────────────────────────────────
    async def get_prescription(self, pid: uuid.UUID) -> Optional[Prescription]:
        return await self.db.get(Prescription, pid)

    async def prescriptions_for_visit(self, visit_id: uuid.UUID) -> Sequence[Prescription]:
        res = await self.db.execute(
            select(Prescription).where(Prescription.visit_id == visit_id).order_by(Prescription.created_at)
        )
        return res.scalars().all()

    async def prescriptions_for_patient(self, patient_id: uuid.UUID) -> Sequence[Prescription]:
        res = await self.db.execute(
            select(Prescription)
            .where(Prescription.patient_id == patient_id)
            .order_by(Prescription.created_at.desc())
        )
        return res.scalars().all()

    async def add_prescription(self, rx: Prescription) -> Prescription:
        self.db.add(rx)
        await self.db.flush()
        await self.db.refresh(rx)
        return rx

    async def delete_prescription(self, rx: Prescription) -> None:
        await self.db.delete(rx)
        await self.db.flush()
