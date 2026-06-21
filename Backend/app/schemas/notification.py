from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import NotificationStatus, NotificationType, RelatedEntity


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    type: NotificationType
    recipient_email: Optional[str] = None
    subject: str
    body: Optional[str] = None
    status: NotificationStatus
    related_entity: Optional[RelatedEntity] = None
    related_id: Optional[uuid.UUID] = None
    is_read: bool
    sent_at: Optional[datetime] = None
    created_at: datetime
