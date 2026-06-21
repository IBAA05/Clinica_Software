from __future__ import annotations

import uuid
from datetime import date, datetime, time, timedelta
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.appointment import Appointment
from app.models.enums import AppointmentStatus
from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.doctor_repository import DoctorRepository
from app.repositories.patient_repository import PatientRepository
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentStatusUpdate,
    AppointmentUpdate,
)


def _end_time(start: time, duration: int) -> time:
    base = datetime.combine(date.today(), start) + timedelta(minutes=duration)
    return base.time()


class AppointmentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AppointmentRepository(db)
        self.patients = PatientRepository(db)
        self.doctors = DoctorRepository(db)

    async def get(self, appt_id: uuid.UUID) -> Appointment:
        appt = await self.repo.get_by_id(appt_id)
        if appt is None:
            raise NotFoundError("Appointment not found")
        return appt

    async def list(self, *, offset: int, limit: int, **filters):
        items = await self.repo.list(offset=offset, limit=limit, **filters)
        total = await self.repo.count(**filters)
        return items, total

    async def _assert_no_conflict(
        self, on_date: date, start: time, duration: int, exclude_id: Optional[uuid.UUID] = None
    ) -> None:
        end = _end_time(start, duration)
        conflicts = await self.repo.find_conflicts(on_date, start, end, exclude_id=exclude_id)
        if conflicts:
            raise ConflictError("This time slot is already booked")

    async def create(self, data: AppointmentCreate, created_by: uuid.UUID) -> Appointment:
        patient = await self.patients.get_by_id(data.patient_id)
        if patient is None:
            raise NotFoundError("Patient not found")
        await self._assert_no_conflict(data.appointment_date, data.appointment_time, data.duration_minutes)
        appt = Appointment(**data.model_dump(), status=AppointmentStatus.scheduled, created_by=created_by)
        appt = await self.repo.add(appt)
        return await self.get(appt.id)

    async def update(self, appt_id: uuid.UUID, data: AppointmentUpdate) -> Appointment:
        appt = await self.get(appt_id)
        payload = data.model_dump(exclude_unset=True)
        new_date = payload.get("appointment_date", appt.appointment_date)
        new_time = payload.get("appointment_time", appt.appointment_time)
        new_duration = payload.get("duration_minutes", appt.duration_minutes)
        if any(k in payload for k in ("appointment_date", "appointment_time", "duration_minutes")):
            await self._assert_no_conflict(new_date, new_time, new_duration, exclude_id=appt.id)
        for field, value in payload.items():
            setattr(appt, field, value)
        await self.db.flush()
        return await self.get(appt.id)

    async def update_status(self, appt_id: uuid.UUID, data: AppointmentStatusUpdate) -> Appointment:
        appt = await self.get(appt_id)
        appt.status = data.status
        if data.status == AppointmentStatus.cancelled and data.cancelled_reason:
            appt.cancelled_reason = data.cancelled_reason
        await self.db.flush()
        return await self.get(appt.id)

    async def cancel(self, appt_id: uuid.UUID, reason: Optional[str] = None) -> Appointment:
        appt = await self.get(appt_id)
        appt.status = AppointmentStatus.cancelled
        appt.cancelled_reason = reason or appt.cancelled_reason
        await self.db.flush()
        return await self.get(appt.id)

    async def today(self):
        return await self.repo.for_date(date.today())

    async def upcoming(self, days: int = 7):
        start = date.today()
        return await self.repo.between(start, start + timedelta(days=days))

    async def calendar(self, year: int, month: int):
        start = date(year, month, 1)
        end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
        end = end - timedelta(days=1)
        appts = await self.repo.between(start, end)
        grouped: dict[date, list] = {}
        for appt in appts:
            grouped.setdefault(appt.appointment_date, []).append(appt)
        return grouped

    async def available_slots(self, on_date: date) -> List[dict]:
        doctor = await self.doctors.get_single()
        if doctor is None:
            raise NotFoundError("Doctor profile not configured")
        weekday = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][on_date.weekday()]
        day_cfg = doctor.schedule.get(weekday, {})
        if not day_cfg.get("active"):
            return []
        slot_minutes = doctor.slot_duration_minutes or 30
        existing = await self.repo.for_date(on_date)
        booked = [
            (a.appointment_time, _end_time(a.appointment_time, a.duration_minutes))
            for a in existing
            if a.status not in (AppointmentStatus.cancelled, AppointmentStatus.no_show)
        ]

        def to_min(t: time) -> int:
            return t.hour * 60 + t.minute

        def parse(s: str) -> Optional[int]:
            if not s:
                return None
            h, m = s.split(":")
            return int(h) * 60 + int(m)

        windows = []
        for a, b in (("morning_start", "morning_end"), ("afternoon_start", "afternoon_end")):
            start_m, end_m = parse(day_cfg.get(a)), parse(day_cfg.get(b))
            if start_m is not None and end_m is not None and end_m > start_m:
                windows.append((start_m, end_m))

        slots = []
        for win_start, win_end in windows:
            cur = win_start
            while cur + slot_minutes <= win_end:
                s_time = time(cur // 60, cur % 60)
                e_time = time((cur + slot_minutes) // 60, (cur + slot_minutes) % 60)
                overlap = any(to_min(bs) < (cur + slot_minutes) and to_min(be) > cur for bs, be in booked)
                slots.append({
                    "start": s_time.strftime("%H:%M"),
                    "end": e_time.strftime("%H:%M"),
                    "available": not overlap,
                })
                cur += slot_minutes
        return slots
