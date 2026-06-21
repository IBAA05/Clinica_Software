from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import InvoiceStatus, PaymentMethod, ServiceType
from app.schemas.appointment import PatientMini


class InvoiceItemBase(BaseModel):
    service_type: ServiceType = ServiceType.consultation
    description: Optional[str] = None
    quantity: int = 1
    unit_price: Decimal = Decimal("0.00")


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItemOut(InvoiceItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    invoice_id: uuid.UUID
    total: Decimal


class InvoiceCreate(BaseModel):
    patient_id: uuid.UUID
    appointment_id: Optional[uuid.UUID] = None
    discount: Decimal = Decimal("0.00")
    tax_rate: Decimal = Decimal("0.00")
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    payment_method: Optional[PaymentMethod] = None
    notes: Optional[str] = None
    items: List[InvoiceItemCreate] = Field(default_factory=list)


class InvoiceUpdate(BaseModel):
    discount: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    payment_method: Optional[PaymentMethod] = None
    notes: Optional[str] = None
    items: Optional[List[InvoiceItemCreate]] = None


class PayRequest(BaseModel):
    amount_paid: Decimal
    payment_method: PaymentMethod
    paid_date: Optional[date] = None


class InvoiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    invoice_ref: str
    patient_id: uuid.UUID
    appointment_id: Optional[uuid.UUID] = None
    subtotal: Decimal
    discount: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    total: Decimal
    amount_paid: Decimal
    balance: Decimal
    payment_method: Optional[PaymentMethod] = None
    status: InvoiceStatus
    issue_date: date
    due_date: date
    paid_date: Optional[date] = None
    notes: Optional[str] = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    items: List[InvoiceItemOut] = Field(default_factory=list)
    patient: Optional[PatientMini] = None


class InvoiceStats(BaseModel):
    total_revenue: Decimal
    collected: Decimal
    pending: Decimal
    overdue: Decimal
