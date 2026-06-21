from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.enums import (
    NotificationStatus,
    NotificationType,
    RelatedEntity,
)
from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository
from app.utils.email import send_email


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NotificationRepository(db)

    async def unread(self):
        return await self.repo.unread()

    async def log(self):
        return await self.repo.log()

    async def mark_read(self, notif_id: uuid.UUID) -> Notification:
        notif = await self.repo.get_by_id(notif_id)
        if notif is None:
            raise NotFoundError("Notification not found")
        notif.is_read = True
        notif.status = NotificationStatus.read
        await self.db.flush()
        await self.db.refresh(notif)
        return notif

    async def create_internal(
        self,
        subject: str,
        body: str,
        related_entity: Optional[RelatedEntity] = None,
        related_id: Optional[uuid.UUID] = None,
    ) -> Notification:
        notif = Notification(
            type=NotificationType.internal,
            subject=subject,
            body=body,
            status=NotificationStatus.unread,
            related_entity=related_entity,
            related_id=related_id,
        )
        return await self.repo.add(notif)

    async def record_email(
        self,
        recipient_email: str,
        subject: str,
        body: str,
        sent: bool,
        related_entity: Optional[RelatedEntity] = None,
        related_id: Optional[uuid.UUID] = None,
    ) -> Notification:
        notif = Notification(
            type=NotificationType.email,
            recipient_email=recipient_email,
            subject=subject,
            body=body,
            status=NotificationStatus.sent if sent else NotificationStatus.failed,
            related_entity=related_entity,
            related_id=related_id,
            sent_at=datetime.now(timezone.utc) if sent else None,
        )
        return await self.repo.add(notif)


async def send_and_log_email(
    db: AsyncSession,
    to: str,
    subject: str,
    body: str,
    *,
    related_entity: Optional[RelatedEntity] = None,
    related_id: Optional[uuid.UUID] = None,
    attachment: Optional[bytes] = None,
    attachment_name: str = "document.pdf",
) -> None:
    """Background-task helper: send an email then persist a notification log row."""
    sent = await send_email(
        to, subject, body, attachment=attachment, attachment_name=attachment_name
    )
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        service = NotificationService(session)
        await service.record_email(
            to, subject, body, sent, related_entity=related_entity, related_id=related_id
        )
        await session.commit()
