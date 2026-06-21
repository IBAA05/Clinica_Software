from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status

from app.core.dependencies import CurrentUser, DbSession, require_staff
from app.models.enums import Gender, PatientStatus, RelatedEntity
from app.schemas.appointment import AppointmentOut
from app.schemas.document import DocumentCreate, DocumentOut
from app.schemas.invoice import InvoiceOut
from app.schemas.patient import (
    NotifyRequest,
    PatientCreate,
    PatientOut,
    PatientStats,
    PatientUpdate,
)
from app.schemas.visit import PrescriptionOut, VisitOut
from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.visit_repository import VisitRepository
from app.models.document import Document
from app.services.notification_service import send_and_log_email
from app.services.patient_service import PatientService
from app.utils.pagination import PageParams, pagination_params
from app.utils.response import make_pagination, success

router = APIRouter(prefix="/patients", tags=["Patients"], dependencies=[Depends(require_staff)])


@router.get("")
async def list_patients(
    db: DbSession,
    page_params: PageParams = Depends(pagination_params),
    search: Optional[str] = None,
    gender: Optional[Gender] = None,
    blood_type: Optional[str] = None,
    age_min: Optional[int] = None,
    age_max: Optional[int] = None,
    status_filter: Optional[PatientStatus] = Query(None, alias="status"),
    has_insurance: Optional[bool] = None,
):
    items, total, stats = await PatientService(db).list(
        offset=page_params.offset,
        limit=page_params.limit,
        search=search,
        gender=gender,
        blood_type=blood_type,
        age_min=age_min,
        age_max=age_max,
        status=status_filter,
        has_insurance=has_insurance,
    )
    data = {
        "patients": [PatientOut.model_validate(p) for p in items],
        "stats": PatientStats(**stats),
    }
    return success(data, pagination=make_pagination(page_params.page, page_params.limit, total))


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_patient(payload: PatientCreate, db: DbSession):
    patient = await PatientService(db).create(payload)
    await db.commit()
    return success(PatientOut.model_validate(patient), message="Patient created")


@router.get("/{patient_id}")
async def get_patient(patient_id: uuid.UUID, db: DbSession):
    patient = await PatientService(db).get(patient_id)
    return success(PatientOut.model_validate(patient))


@router.put("/{patient_id}")
async def update_patient(patient_id: uuid.UUID, payload: PatientUpdate, db: DbSession):
    patient = await PatientService(db).update(patient_id, payload)
    await db.commit()
    return success(PatientOut.model_validate(patient), message="Patient updated")


@router.delete("/{patient_id}")
async def delete_patient(patient_id: uuid.UUID, db: DbSession):
    await PatientService(db).soft_delete(patient_id)
    await db.commit()
    return success(None, message="Patient deleted")


@router.get("/{patient_id}/visits")
async def patient_visits(patient_id: uuid.UUID, db: DbSession):
    await PatientService(db).get(patient_id)
    visits = await VisitRepository(db).for_patient(patient_id)
    return success([VisitOut.model_validate(v) for v in visits])


@router.get("/{patient_id}/appointments")
async def patient_appointments(patient_id: uuid.UUID, db: DbSession):
    await PatientService(db).get(patient_id)
    appts = await AppointmentRepository(db).list(offset=0, limit=500, patient_id=patient_id)
    today = date.today()
    upcoming = sorted(
        [a for a in appts if a.appointment_date >= today],
        key=lambda a: (a.appointment_date, a.appointment_time),
    )
    past = sorted(
        [a for a in appts if a.appointment_date < today],
        key=lambda a: (a.appointment_date, a.appointment_time),
        reverse=True,
    )
    ordered = upcoming + past
    return success([AppointmentOut.model_validate(a) for a in ordered])


@router.get("/{patient_id}/prescriptions")
async def patient_prescriptions(patient_id: uuid.UUID, db: DbSession):
    await PatientService(db).get(patient_id)
    items = await VisitRepository(db).prescriptions_for_patient(patient_id)
    return success([PrescriptionOut.model_validate(p) for p in items])


@router.get("/{patient_id}/invoices")
async def patient_invoices(patient_id: uuid.UUID, db: DbSession):
    await PatientService(db).get(patient_id)
    invoices = await InvoiceRepository(db).for_patient(patient_id)
    total_paid = sum((i.amount_paid for i in invoices), 0)
    balance = sum((i.balance for i in invoices), 0)
    data = {
        "invoices": [InvoiceOut.model_validate(i) for i in invoices],
        "total_paid": total_paid,
        "balance": balance,
    }
    return success(data)


@router.get("/{patient_id}/documents")
async def list_documents(patient_id: uuid.UUID, db: DbSession):
    await PatientService(db).get(patient_id)
    docs = await DocumentRepository(db).for_patient(patient_id)
    return success([DocumentOut.model_validate(d) for d in docs])


@router.post("/{patient_id}/documents", status_code=status.HTTP_201_CREATED)
async def upload_document(
    patient_id: uuid.UUID, payload: DocumentCreate, current_user: CurrentUser, db: DbSession
):
    await PatientService(db).get(patient_id)
    doc = Document(patient_id=patient_id, uploaded_by=current_user.id, **payload.model_dump())
    saved = await DocumentRepository(db).add(doc)
    await db.commit()
    return success(DocumentOut.model_validate(saved), message="Document uploaded")


@router.delete("/{patient_id}/documents/{doc_id}")
async def delete_document(patient_id: uuid.UUID, doc_id: uuid.UUID, db: DbSession):
    repo = DocumentRepository(db)
    doc = await repo.get_by_id(doc_id)
    if doc and doc.patient_id == patient_id:
        doc.is_deleted = True
        await db.commit()
    return success(None, message="Document removed")


@router.post("/{patient_id}/notify")
async def notify_patient(
    patient_id: uuid.UUID, payload: NotifyRequest, background: BackgroundTasks, db: DbSession
):
    patient = await PatientService(db).get(patient_id)
    if patient.email:
        background.add_task(
            send_and_log_email,
            db,
            patient.email,
            payload.subject,
            payload.body,
            related_entity=None,
            related_id=patient_id,
        )
    return success(None, message="Notification queued")
