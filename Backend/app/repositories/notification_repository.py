from __future__ import annotations

import uuid
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import NotificationType
from app.models.notification import Notification


class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, notif_id: uuid.UUID) -> Optional[Notification]:
        return await self.db.get(Notification, notif_id)

    async def unread(self) -> Sequence[Notification]:
        res = await self.db.execute(
            select(Notification)
            .where(
                Notification.type == NotificationType.internal,
                Notification.is_read.is_(False),
            )
            .order_by(Notification.created_at.desc())
        )
        return res.scalars().all()

    async def log(self, limit: int = 200) -> Sequence[Notification]:
        res = await self.db.execute(
            select(Notification).order_by(Notification.created_at.desc()).limit(limit)
        )
        return res.scalars().all()

    async def add(self, notif: Notification) -> Notification:
        self.db.add(notif)
        await self.db.flush()
        await self.db.refresh(notif)
        return notif
