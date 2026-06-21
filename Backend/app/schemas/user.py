from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    avatar_url: str | None = None


class UserCreate(UserBase):
    username: str
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.receptionist


class UserUpdateMe(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    avatar_url: str | None = None


class StaffUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    is_active: bool | None = None


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login: datetime | None = None
