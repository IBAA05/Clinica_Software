from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field
from dateutil.relativedelta import relativedelta

from app.models.enums import BloodType, Gender, PatientStatus


class PatientBase(BaseModel):
    full_name: str
    date_of_birth: date
    gender: Gender
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    blood_type: Optional[BloodType] = None
    national_id: str
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_number: Optional[str] = None
    allergies: List[str] = Field(default_factory=list)
    chronic_conditions: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    status: PatientStatus = PatientStatus.active


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    blood_type: Optional[BloodType] = None
    national_id: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_number: Optional[str] = None
    allergies: Optional[List[str]] = None
    chronic_conditions: Optional[List[str]] = None
    notes: Optional[str] = None
    status: Optional[PatientStatus] = None


class PatientOut(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def age(self) -> int:
        return relativedelta(date.today(), self.date_of_birth).years

    @computed_field
    @property
    def has_insurance(self) -> bool:
        return bool(self.insurance_provider)


class PatientStats(BaseModel):
    total: int
    active: int
    new_this_month: int
    with_insurance: int


class NotifyRequest(BaseModel):
    subject: str
    body: str
