from __future__ import annotations

import uuid
from typing import Optional, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document


class DocumentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, doc_id: uuid.UUID) -> Optional[Document]:
        doc = await self.db.get(Document, doc_id)
        if doc is None or doc.is_deleted:
            return None
        return doc

    async def for_patient(self, patient_id: uuid.UUID) -> Sequence[Document]:
        res = await self.db.execute(
            select(Document)
            .where(Document.patient_id == patient_id, Document.is_deleted.is_(False))
            .order_by(Document.created_at.desc())
        )
        return res.scalars().all()

    async def add(self, doc: Document) -> Document:
        self.db.add(doc)
        await self.db.flush()
        await self.db.refresh(doc)
        return doc
