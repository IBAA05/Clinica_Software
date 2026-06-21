from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Dict, Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import ExpenseCategory


class ExpenseBase(BaseModel):
    category: ExpenseCategory = ExpenseCategory.other
    description: Optional[str] = None
    amount: Decimal
    date: date
    receipt_ref: Optional[str] = None
    notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    category: Optional[ExpenseCategory] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    date: Optional[date] = None
    receipt_ref: Optional[str] = None
    notes: Optional[str] = None


class ExpenseOut(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime


class ExpenseTotals(BaseModel):
    total_this_month: Decimal
    total_this_year: Decimal
    by_category: Dict[str, Decimal]
