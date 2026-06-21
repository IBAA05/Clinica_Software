from __future__ import annotations

import uuid
from datetime import date
from typing import Optional, Sequence

from sqlalchemy import String, and_, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import Gender, PatientStatus
from app.models.patient import Patient


class PatientRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _base(self):
        return select(Patient).where(Patient.is_deleted.is_(False))

    async def get_by_id(self, patient_id: uuid.UUID, include_deleted: bool = False) -> Optional[Patient]:
        patient = await self.db.get(Patient, patient_id)
        if patient is None:
            return None
        if patient.is_deleted and not include_deleted:
            return None
        return patient

    async def get_by_phone(self, phone: str) -> Optional[Patient]:
        res = await self.db.execute(select(Patient).where(Patient.phone == phone))
        return res.scalar_one_or_none()

    async def get_by_national_id(self, national_id: str) -> Optional[Patient]:
        res = await self.db.execute(select(Patient).where(Patient.national_id == national_id))
        return res.scalar_one_or_none()

    def _apply_filters(
        self,
        stmt,
        *,
        search: Optional[str] = None,
        gender: Optional[Gender] = None,
        blood_type: Optional[str] = None,
        age_min: Optional[int] = None,
        age_max: Optional[int] = None,
        status: Optional[PatientStatus] = None,
        has_insurance: Optional[bool] = None,
    ):
        if search:
            like = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Patient.full_name.ilike(like),
                    Patient.phone.ilike(like),
                    Patient.national_id.ilike(like),
                )
            )
        if gender:
            stmt = stmt.where(Patient.gender == gender)
        if blood_type:
            stmt = stmt.where(cast(Patient.blood_type, String) == blood_type)
        if status:
            stmt = stmt.where(Patient.status == status)
        if has_insurance is not None:
            if has_insurance:
                stmt = stmt.where(Patient.insurance_provider.is_not(None))
            else:
                stmt = stmt.where(Patient.insurance_provider.is_(None))
        # Age filters via date_of_birth boundaries
        today = date.today()
        if age_min is not None:
            max_dob = date(today.year - age_min, today.month, today.day)
            stmt = stmt.where(Patient.date_of_birth <= max_dob)
        if age_max is not None:
            min_dob = date(today.year - age_max - 1, today.month, today.day)
            stmt = stmt.where(Patient.date_of_birth > min_dob)
        return stmt

    async def list(self, *, offset: int, limit: int, **filters) -> Sequence[Patient]:
        stmt = self._apply_filters(self._base(), **filters)
        stmt = stmt.order_by(Patient.created_at.desc()).offset(offset).limit(limit)
        res = await self.db.execute(stmt)
        return res.scalars().all()

    async def count(self, **filters) -> int:
        stmt = self._apply_filters(self._base(), **filters)
        res = await self.db.execute(select(func.count()).select_from(stmt.subquery()))
        return int(res.scalar_one())

    async def stats(self) -> dict:
        total = await self.db.scalar(
            select(func.count()).select_from(Patient).where(Patient.is_deleted.is_(False))
        )
        active = await self.db.scalar(
            select(func.count()).select_from(Patient).where(
                and_(Patient.is_deleted.is_(False), Patient.status == PatientStatus.active)
            )
        )
        with_insurance = await self.db.scalar(
            select(func.count()).select_from(Patient).where(
                and_(Patient.is_deleted.is_(False), Patient.insurance_provider.is_not(None))
            )
        )
        month_start = date.today().replace(day=1)
        new_this_month = await self.db.scalar(
            select(func.count()).select_from(Patient).where(
                and_(Patient.is_deleted.is_(False), func.date(Patient.created_at) >= month_start)
            )
        )
        return {
            "total": int(total or 0),
            "active": int(active or 0),
            "new_this_month": int(new_this_month or 0),
            "with_insurance": int(with_insurance or 0),
        }

    async def add(self, patient: Patient) -> Patient:
        self.db.add(patient)
        await self.db.flush()
        await self.db.refresh(patient)
        return patient
