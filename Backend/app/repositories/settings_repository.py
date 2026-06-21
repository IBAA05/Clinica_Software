from __future__ import annotations

import uuid
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service import Service
from app.models.settings import ClinicSettings


class SettingsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_settings(self) -> Optional[ClinicSettings]:
        res = await self.db.execute(select(ClinicSettings).limit(1))
        return res.scalar_one_or_none()

    async def add_settings(self, settings: ClinicSettings) -> ClinicSettings:
        self.db.add(settings)
        await self.db.flush()
        await self.db.refresh(settings)
        return settings

    # ── Services ─────────────────────────────────────────
    async def list_services(self) -> Sequence[Service]:
        res = await self.db.execute(select(Service).order_by(Service.name))
        return res.scalars().all()

    async def get_service(self, service_id: uuid.UUID) -> Optional[Service]:
        return await self.db.get(Service, service_id)

    async def add_service(self, service: Service) -> Service:
        self.db.add(service)
        await self.db.flush()
        await self.db.refresh(service)
        return service
