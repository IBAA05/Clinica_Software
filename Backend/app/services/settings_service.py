from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.service import Service
from app.models.settings import ClinicSettings
from app.models.user import User
from app.repositories.settings_repository import SettingsRepository
from app.repositories.user_repository import UserRepository
from app.schemas.settings import (
    ClinicSettingsUpdate,
    ServiceCreate,
    ServiceUpdate,
)
from app.schemas.user import StaffUpdate, UserCreate


class SettingsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = SettingsRepository(db)
        self.users = UserRepository(db)

    async def get(self) -> ClinicSettings:
        settings = await self.repo.get_settings()
        if settings is None:
            settings = await self.repo.add_settings(ClinicSettings())
        return settings

    async def update(self, data: ClinicSettingsUpdate) -> ClinicSettings:
        settings = await self.get()
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(settings, field, value)
        await self.db.flush()
        await self.db.refresh(settings)
        return settings

    # ── Services ─────────────────────────────────────
    async def list_services(self):
        return await self.repo.list_services()

    async def create_service(self, data: ServiceCreate) -> Service:
        return await self.repo.add_service(Service(**data.model_dump()))

    async def update_service(self, service_id: uuid.UUID, data: ServiceUpdate) -> Service:
        service = await self.repo.get_service(service_id)
        if service is None:
            raise NotFoundError("Service not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(service, field, value)
        await self.db.flush()
        await self.db.refresh(service)
        return service

    # ── Staff management ────────────────────────────────
    async def list_staff(self):
        return await self.users.list_all()

    async def create_staff(self, data: UserCreate) -> User:
        if await self.users.get_by_username(data.username):
            raise ConflictError("Username already taken")
        if await self.users.get_by_email(data.email):
            raise ConflictError("Email already in use")
        user = User(
            username=data.username,
            full_name=data.full_name,
            email=data.email,
            hashed_password=hash_password(data.password),
            role=UserRole.receptionist,
            avatar_url=data.avatar_url,
            is_active=True,
        )
        return await self.users.add(user)

    async def update_staff(self, user_id: uuid.UUID, data: StaffUpdate) -> User:
        user = await self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundError("Staff user not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def deactivate_staff(self, user_id: uuid.UUID) -> None:
        user = await self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundError("Staff user not found")
        user.is_active = False
        await self.db.flush()
