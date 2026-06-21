from __future__ import annotations

from decimal import Decimal

from sqlalchemy import Boolean, Enum as SAEnum, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin, UUIDMixin
from app.models.enums import ServiceType


class Service(UUIDMixin, TimestampMixin, Base):
    """Preset billable service with a default price."""

    __tablename__ = "services"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    service_type: Mapped[ServiceType] = mapped_column(
        SAEnum(ServiceType, name="service_type"), nullable=False
    )
    default_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
