from __future__ import annotations

from decimal import Decimal
from typing import List, Optional

from sqlalchemy import Enum as SAEnum, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin, UUIDMixin


class ClinicSettings(UUIDMixin, TimestampMixin, Base):
    """Singleton row holding clinic-wide settings."""

    __tablename__ = "clinic_settings"

    clinic_name: Mapped[str] = mapped_column(String(255), default="Private Clinic", nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tax_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="USD", nullable=False)
    appointment_reminder_hours: Mapped[List[int]] = mapped_column(JSONB, default=lambda: [1, 24], nullable=False)
    smtp_host: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    smtp_port: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    smtp_user: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    smtp_password: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    smtp_from: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
