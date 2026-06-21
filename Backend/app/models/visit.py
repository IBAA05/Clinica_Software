from __future__ import annotations

import uuid
from datetime import date
from typing import List, Optional

from sqlalchemy import Boolean, Date, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, UUIDMixin


class Visit(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "visits"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("patients.id"), index=True, nullable=False
    )
    appointment_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("appointments.id"), unique=True, nullable=True
    )
    visit_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    symptoms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    clinical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    diagnosis_code: Mapped[Optional[str]] = mapped_column(String(20), index=True, nullable=True)
    diagnosis_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lab_requests: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    next_visit_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    next_visit_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    patient: Mapped["Patient"] = relationship(back_populates="visits")
    appointment: Mapped[Optional["Appointment"]] = relationship(back_populates="visit")
    prescriptions: Mapped[List["Prescription"]] = relationship(
        back_populates="visit", cascade="all, delete-orphan"
    )
