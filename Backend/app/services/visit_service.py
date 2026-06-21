from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.prescription import Prescription
from app.models.visit import Visit
from app.repositories.patient_repository import PatientRepository
from app.repositories.visit_repository import VisitRepository
from app.schemas.visit import (
    PrescriptionCreate,
    PrescriptionUpdate,
    VisitCreate,
    VisitUpdate,
)


class VisitService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = VisitRepository(db)
        self.patients = PatientRepository(db)

    async def get(self, visit_id: uuid.UUID) -> Visit:
        visit = await self.repo.get_by_id(visit_id)
        if visit is None:
            raise NotFoundError("Visit not found")
        return visit

    async def list(self, *, offset: int, limit: int, **filters):
        items = await self.repo.list(offset=offset, limit=limit, **filters)
        total = await self.repo.count(**filters)
        return items, total

    async def create(self, data: VisitCreate, created_by: uuid.UUID) -> Visit:
        if await self.patients.get_by_id(data.patient_id) is None:
            raise NotFoundError("Patient not found")
        visit = Visit(**data.model_dump(), created_by=created_by)
        visit = await self.repo.add(visit)
        return await self.get(visit.id)

    async def update(self, visit_id: uuid.UUID, data: VisitUpdate) -> Visit:
        visit = await self.get(visit_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(visit, field, value)
        await self.db.flush()
        return await self.get(visit.id)

    async def soft_delete(self, visit_id: uuid.UUID) -> None:
        visit = await self.get(visit_id)
        visit.is_deleted = True
        await self.db.flush()

    # ── Prescriptions ─────────────────────────────────────
    async def list_prescriptions(self, visit_id: uuid.UUID):
        await self.get(visit_id)
        return await self.repo.prescriptions_for_visit(visit_id)

    async def add_prescription(self, visit_id: uuid.UUID, data: PrescriptionCreate) -> Prescription:
        visit = await self.get(visit_id)
        rx = Prescription(visit_id=visit.id, patient_id=visit.patient_id, **data.model_dump())
        return await self.repo.add_prescription(rx)

    async def update_prescription(
        self, visit_id: uuid.UUID, pid: uuid.UUID, data: PrescriptionUpdate
    ) -> Prescription:
        rx = await self.repo.get_prescription(pid)
        if rx is None or rx.visit_id != visit_id:
            raise NotFoundError("Prescription not found")
        payload = data.model_dump(exclude_unset=True)
        if payload.get("is_printed") and not rx.is_printed:
            rx.printed_at = datetime.now(timezone.utc)
        for field, value in payload.items():
            setattr(rx, field, value)
        await self.db.flush()
        await self.db.refresh(rx)
        return rx

    async def delete_prescription(self, visit_id: uuid.UUID, pid: uuid.UUID) -> None:
        rx = await self.repo.get_prescription(pid)
        if rx is None or rx.visit_id != visit_id:
            raise NotFoundError("Prescription not found")
        await self.repo.delete_prescription(rx)

    async def mark_printed(self, visit_id: uuid.UUID) -> None:
        for rx in await self.repo.prescriptions_for_visit(visit_id):
            rx.is_printed = True
            rx.printed_at = datetime.now(timezone.utc)
        await self.db.flush()
