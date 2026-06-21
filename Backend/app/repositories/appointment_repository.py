from __future__ import annotations

import uuid
from datetime import date, datetime, time, timedelta
from typing import Optional, Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.appointment import Appointment
from app.models.enums import AppointmentStatus, AppointmentType
from app.models.patient import Patient

_ACTIVE = [
    AppointmentStatus.scheduled,
    AppointmentStatus.confirmed,
    AppointmentStatus.checked_in,
    AppointmentStatus.in_progress,
]


class AppointmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, appt_id: uuid.UUID, with_patient: bool = True) -> Optional[Appointment]:
        stmt = select(Appointment).where(Appointment.id == appt_id)
        if with_patient:
            stmt = stmt.options(selectinload(Appointment.patient))
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    def _filtered(
        self,
        *,
        status: Optional[AppointmentStatus] = None,
        type_: Optional[AppointmentType] = None,
        on_date: Optional[date] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        patient_id: Optional[uuid.UUID] = None,
        patient_name: Optional[str] = None,
    ):
        stmt = select(Appointment).join(Patient, Appointment.patient_id == Patient.id)
        if status:
            stmt = stmt.where(Appointment.status == status)
        if type_:
            stmt = stmt.where(Appointment.type == type_)
        if on_date:
            stmt = stmt.where(Appointment.appointment_date == on_date)
        if date_from:
            stmt = stmt.where(Appointment.appointment_date >= date_from)
        if date_to:
            stmt = stmt.where(Appointment.appointment_date <= date_to)
        if patient_id:
            stmt = stmt.where(Appointment.patient_id == patient_id)
        if patient_name:
            stmt = stmt.where(Patient.full_name.ilike(f"%{patient_name}%"))
        return stmt

    async def list(self, *, offset: int, limit: int, **filters) -> Sequence[Appointment]:
        stmt = (
            self._filtered(**filters)
            .options(selectinload(Appointment.patient))
            .order_by(Appointment.appointment_date.desc(), Appointment.appointment_time.desc())
            .offset(offset)
            .limit(limit)
        )
        res = await self.db.execute(stmt)
        return res.scalars().all()

    async def count(self, **filters) -> int:
        stmt = self._filtered(**filters)
        res = await self.db.execute(select(func.count()).select_from(stmt.subquery()))
        return int(res.scalar_one())

    async def for_date(self, on_date: date) -> Sequence[Appointment]:
        stmt = (
            select(Appointment)
            .options(selectinload(Appointment.patient))
            .where(Appointment.appointment_date == on_date)
            .order_by(Appointment.appointment_time)
        )
        res = await self.db.execute(stmt)
        return res.scalars().all()

    async def between(self, start: date, end: date) -> Sequence[Appointment]:
        stmt = (
            select(Appointment)
            .options(selectinload(Appointment.patient))
            .where(Appointment.appointment_date >= start, Appointment.appointment_date <= end)
            .order_by(Appointment.appointment_date, Appointment.appointment_time)
        )
        res = await self.db.execute(stmt)
        return res.scalars().all()

    async def find_conflicts(
        self,
        on_date: date,
        new_start: time,
        new_end: time,
        exclude_id: Optional[uuid.UUID] = None,
    ) -> Sequence[Appointment]:
        """Return active appointments on the same date that overlap the window."""
        stmt = select(Appointment).where(
            Appointment.appointment_date == on_date,
            Appointment.status.in_(_ACTIVE),
        )
        if exclude_id:
            stmt = stmt.where(Appointment.id != exclude_id)
        res = await self.db.execute(stmt)
        candidates = res.scalars().all()

        def to_minutes(t: time) -> int:
            return t.hour * 60 + t.minute

        ns, ne = to_minutes(new_start), to_minutes(new_end)
        conflicts = []
        for appt in candidates:
            es = to_minutes(appt.appointment_time)
            ee = es + appt.duration_minutes
            # overlap: new_start < existing_end AND new_end > existing_start
            if ns < ee and ne > es:
                conflicts.append(appt)
        return conflicts

    async def add(self, appt: Appointment) -> Appointment:
        self.db.add(appt)
        await self.db.flush()
        await self.db.refresh(appt)
        return appt
