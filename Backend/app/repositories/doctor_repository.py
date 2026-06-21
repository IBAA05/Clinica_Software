from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.doctor import Doctor


class DoctorRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_single(self) -> Optional[Doctor]:
        """Return the single (primary) doctor profile."""
        res = await self.db.execute(select(Doctor).order_by(Doctor.created_at).limit(1))
        return res.scalar_one_or_none()

    async def add(self, doctor: Doctor) -> Doctor:
        self.db.add(doctor)
        await self.db.flush()
        await self.db.refresh(doctor)
        return doctor
