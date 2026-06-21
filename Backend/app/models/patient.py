from __future__ import annotations

from datetime import date
from typing import List, Optional

from dateutil.relativedelta import relativedelta
from sqlalchemy import Boolean, Date, Enum as SAEnum, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, UUIDMixin
from app.models.enums import BloodType, Gender, PatientStatus


class Patient(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "patients"

    full_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[Gender] = mapped_column(SAEnum(Gender, name="gender"), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    blood_type: Mapped[Optional[BloodType]] = mapped_column(
        SAEnum(BloodType, name="blood_type"), nullable=True
    )
    national_id: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    emergency_contact_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    insurance_provider: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    insurance_number: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    allergies: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    chronic_conditions: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[PatientStatus] = mapped_column(
        SAEnum(PatientStatus, name="patient_status"),
        default=PatientStatus.active,
        nullable=False,
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    appointments: Mapped[List["Appointment"]] = relationship(back_populates="patient")
    visits: Mapped[List["Visit"]] = relationship(back_populates="patient")
    invoices: Mapped[List["Invoice"]] = relationship(back_populates="patient")
    documents: Mapped[List["Document"]] = relationship(back_populates="patient")

    @property
    def age(self) -> int:
        today = date.today()
        return relativedelta(today, self.date_of_birth).years

    @property
    def has_insurance(self) -> bool:
        return bool(self.insurance_provider)
