from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.patient import Patient
from app.repositories.patient_repository import PatientRepository
from app.schemas.patient import PatientCreate, PatientUpdate


class PatientService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PatientRepository(db)

    async def get(self, patient_id: uuid.UUID) -> Patient:
        patient = await self.repo.get_by_id(patient_id)
        if patient is None:
            raise NotFoundError("Patient not found")
        return patient

    async def list(self, *, offset: int, limit: int, **filters):
        items = await self.repo.list(offset=offset, limit=limit, **filters)
        total = await self.repo.count(**filters)
        stats = await self.repo.stats()
        return items, total, stats

    async def create(self, data: PatientCreate) -> Patient:
        if await self.repo.get_by_phone(data.phone):
            raise ConflictError("A patient with this phone already exists")
        if await self.repo.get_by_national_id(data.national_id):
            raise ConflictError("A patient with this national ID already exists")
        patient = Patient(**data.model_dump())
        return await self.repo.add(patient)

    async def update(self, patient_id: uuid.UUID, data: PatientUpdate) -> Patient:
        patient = await self.get(patient_id)
        payload = data.model_dump(exclude_unset=True)
        if "phone" in payload and payload["phone"] != patient.phone:
            existing = await self.repo.get_by_phone(payload["phone"])
            if existing and existing.id != patient.id:
                raise ConflictError("Phone already in use")
        if "national_id" in payload and payload["national_id"] != patient.national_id:
            existing = await self.repo.get_by_national_id(payload["national_id"])
            if existing and existing.id != patient.id:
                raise ConflictError("National ID already in use")
        for field, value in payload.items():
            setattr(patient, field, value)
        await self.db.flush()
        await self.db.refresh(patient)
        return patient

    async def soft_delete(self, patient_id: uuid.UUID) -> None:
        patient = await self.get(patient_id)
        patient.is_deleted = True
        await self.db.flush()
