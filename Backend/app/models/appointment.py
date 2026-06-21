from __future__ import annotations

import uuid
from datetime import date, time
from typing import Optional

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, Integer, Text, Time
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, UUIDMixin
from app.models.enums import AppointmentStatus, AppointmentType


class Appointment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "appointments"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id"), index=True, nullable=False
    )
    appointment_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    appointment_time: Mapped[time] = mapped_column(Time, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    type: Mapped[AppointmentType] = mapped_column(
        SAEnum(AppointmentType, name="appointment_type"),
        default=AppointmentType.consultation,
        nullable=False,
    )
    status: Mapped[AppointmentStatus] = mapped_column(
        SAEnum(AppointmentStatus, name="appointment_status"),
        default=AppointmentStatus.scheduled,
        nullable=False,
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancelled_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    patient: Mapped["Patient"] = relationship(back_populates="appointments")
    visit: Mapped[Optional["Visit"]] = relationship(back_populates="appointment", uselist=False)
