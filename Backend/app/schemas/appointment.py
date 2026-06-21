from __future__ import annotations

import uuid
from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import AppointmentStatus, AppointmentType


class AppointmentBase(BaseModel):
    patient_id: uuid.UUID
    appointment_date: date
    appointment_time: time
    duration_minutes: int = 30
    type: AppointmentType = AppointmentType.consultation
    reason: Optional[str] = None
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    duration_minutes: Optional[int] = None
    type: Optional[AppointmentType] = None
    status: Optional[AppointmentStatus] = None
    reason: Optional[str] = None
    notes: Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus
    cancelled_reason: Optional[str] = None


class PatientMini(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    full_name: str
    phone: str


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    appointment_date: date
    appointment_time: time
    duration_minutes: int
    type: AppointmentType
    status: AppointmentStatus
    reason: Optional[str] = None
    notes: Optional[str] = None
    cancelled_reason: Optional[str] = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    patient: Optional[PatientMini] = None


class TimeSlot(BaseModel):
    start: str
    end: str
    available: bool


class CalendarDay(BaseModel):
    date: date
    count: int
    appointments: List[AppointmentOut]
