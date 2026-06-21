from __future__ import annotations

from collections import Counter
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.enums import AppointmentStatus
from app.repositories.doctor_repository import DoctorRepository
from app.schemas.doctor import DoctorProfileUpdate, FeesUpdate, ScheduleUpdate

_WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


class DoctorService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = DoctorRepository(db)

    async def get_profile(self) -> Doctor:
        doctor = await self.repo.get_single()
        if doctor is None:
            raise NotFoundError("Doctor profile not configured")
        return doctor

    async def update_profile(self, data: DoctorProfileUpdate) -> Doctor:
        doctor = await self.get_profile()
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(doctor, field, value)
        await self.db.flush()
        await self.db.refresh(doctor)
        return doctor

    async def update_schedule(self, data: ScheduleUpdate) -> Doctor:
        doctor = await self.get_profile()
        doctor.schedule = {k: v.model_dump() for k, v in data.schedule.items()}
        if data.slot_duration_minutes is not None:
            doctor.slot_duration_minutes = data.slot_duration_minutes
        if data.max_daily_appointments is not None:
            doctor.max_daily_appointments = data.max_daily_appointments
        await self.db.flush()
        await self.db.refresh(doctor)
        return doctor

    async def update_fees(self, data: FeesUpdate) -> Doctor:
        doctor = await self.get_profile()
        doctor.consultation_fee = data.consultation_fee
        doctor.followup_fee = data.followup_fee
        await self.db.flush()
        await self.db.refresh(doctor)
        return doctor

    async def stats(self) -> dict:
        today = date.today()
        month_start = today.replace(day=1)
        total_seen = await self.db.scalar(
            select(func.count(func.distinct(Appointment.patient_id))).where(
                Appointment.status == AppointmentStatus.completed
            )
        )
        appts_month = await self.db.scalar(
            select(func.count()).select_from(Appointment).where(
                Appointment.appointment_date >= month_start
            )
        )
        rows = await self.db.execute(select(Appointment.appointment_date, Appointment.appointment_time))
        records = rows.all()
        day_counter: Counter = Counter()
        slot_counter: Counter = Counter()
        distinct_days = set()
        for d, t in records:
            day_counter[_WEEKDAYS[d.weekday()]] += 1
            slot_counter[f"{t.hour:02d}:00"] += 1
            distinct_days.add(d)
        avg_daily = round(len(records) / len(distinct_days), 2) if distinct_days else 0.0
        busiest_day = day_counter.most_common(1)[0][0] if day_counter else None
        busiest_slot = slot_counter.most_common(1)[0][0] if slot_counter else None
        return {
            "total_patients_seen": int(total_seen or 0),
            "appointments_this_month": int(appts_month or 0),
            "avg_daily_appointments": avg_daily,
            "busiest_day": busiest_day,
            "busiest_slot": busiest_slot,
        }
