from __future__ import annotations

import uuid
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import ServiceType


class ClinicSettingsUpdate(BaseModel):
    clinic_name: Optional[str] = None
    logo_url: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    tax_rate: Optional[Decimal] = None
    currency: Optional[str] = None
    appointment_reminder_hours: Optional[List[int]] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: Optional[str] = None


class ClinicSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    clinic_name: str
    logo_url: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    tax_rate: Decimal
    currency: str
    appointment_reminder_hours: List[int]
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_from: Optional[str] = None
    # smtp_password intentionally omitted from output


class ServiceBase(BaseModel):
    name: str
    service_type: ServiceType
    default_price: Decimal
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    service_type: Optional[ServiceType] = None
    default_price: Optional[Decimal] = None
    is_active: Optional[bool] = None


class ServiceOut(ServiceBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
