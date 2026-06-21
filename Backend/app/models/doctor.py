from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Optional

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, UUIDMixin

DEFAULT_DAY = {
    "active": True,
    "morning_start": "08:00",
    "morning_end": "12:00",
    "afternoon_start": "14:00",
    "afternoon_end": "18:00",
}


def default_schedule() -> dict:
    days = ["monday", "tuesday", "wednesday", "thursday", "friday"]
    weekend = ["saturday", "sunday"]
    sched = {d: dict(DEFAULT_DAY) for d in days}
    for d in weekend:
        inactive = dict(DEFAULT_DAY)
        inactive["active"] = False
        sched[d] = inactive
    return sched


class Doctor(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "doctors"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    specialty: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    qualification: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    registration_number: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    signature_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    consultation_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    followup_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    schedule: Mapped[dict] = mapped_column(JSONB, default=default_schedule, nullable=False)
    slot_duration_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    max_daily_appointments: Mapped[int] = mapped_column(Integer, default=20, nullable=False)

    user: Mapped["User"] = relationship(back_populates="doctor_profile")
