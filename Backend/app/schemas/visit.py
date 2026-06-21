from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class PrescriptionBase(BaseModel):
    medication_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None


class PrescriptionCreate(PrescriptionBase):
    pass


class PrescriptionUpdate(BaseModel):
    medication_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None
    is_printed: Optional[bool] = None


class PrescriptionOut(PrescriptionBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    visit_id: uuid.UUID
    patient_id: uuid.UUID
    is_printed: bool
    printed_at: Optional[datetime] = None
    created_at: datetime


class VisitBase(BaseModel):
    patient_id: uuid.UUID
    appointment_id: Optional[uuid.UUID] = None
    visit_date: date
    symptoms: Optional[str] = None
    clinical_notes: Optional[str] = None
    diagnosis_code: Optional[str] = None
    diagnosis_description: Optional[str] = None
    lab_requests: List[str] = Field(default_factory=list)
    next_visit_date: Optional[date] = None
    next_visit_notes: Optional[str] = None


class VisitCreate(VisitBase):
    pass


class VisitUpdate(BaseModel):
    visit_date: Optional[date] = None
    symptoms: Optional[str] = None
    clinical_notes: Optional[str] = None
    diagnosis_code: Optional[str] = None
    diagnosis_description: Optional[str] = None
    lab_requests: Optional[List[str]] = None
    next_visit_date: Optional[date] = None
    next_visit_notes: Optional[str] = None


class VisitOut(VisitBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    prescriptions: List[PrescriptionOut] = Field(default_factory=list)


class VisitListItem(BaseModel):
    """Non-clinical view for receptionists: date + patient only."""
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    patient_id: uuid.UUID
    visit_date: date
    created_at: datetime
