from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DaySchedule(BaseModel):
    active: bool = True
    morning_start: Optional[str] = "08:00"
    morning_end: Optional[str] = "12:00"
    afternoon_start: Optional[str] = "14:00"
    afternoon_end: Optional[str] = "18:00"


class DoctorBase(BaseModel):
    full_name: str
    specialty: Optional[str] = None
    qualification: Optional[str] = None
    registration_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    signature_url: Optional[str] = None


class DoctorProfileUpdate(DoctorBase):
    full_name: Optional[str] = None


class DoctorOut(DoctorBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    consultation_fee: Decimal
    followup_fee: Decimal
    schedule: dict
    slot_duration_minutes: int
    max_daily_appointments: int


class ScheduleUpdate(BaseModel):
    schedule: dict[str, DaySchedule]
    slot_duration_minutes: Optional[int] = None
    max_daily_appointments: Optional[int] = None


class FeesUpdate(BaseModel):
    consultation_fee: Decimal
    followup_fee: Decimal


class DoctorStats(BaseModel):
    total_patients_seen: int
    appointments_this_month: int
    avg_daily_appointments: float
    busiest_day: Optional[str] = None
    busiest_slot: Optional[str] = None
