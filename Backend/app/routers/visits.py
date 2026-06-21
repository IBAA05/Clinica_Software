from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response, status

from app.core.dependencies import CurrentUser, DbSession, require_doctor, require_staff
from app.schemas.visit import (
    PrescriptionCreate,
    PrescriptionOut,
    PrescriptionUpdate,
    VisitCreate,
    VisitListItem,
    VisitOut,
    VisitUpdate,
)
from app.services.doctor_service import DoctorService
from app.services.patient_service import PatientService
from app.services.settings_service import SettingsService
from app.services.visit_service import VisitService
from app.utils.pagination import PageParams, pagination_params
from app.utils.pdf import generate_prescription_pdf
from app.utils.response import make_pagination, success

router = APIRouter(prefix="/visits", tags=["Visits"])


@router.get("", dependencies=[Depends(require_staff)])
async def list_visits(
    current_user: CurrentUser,
    db: DbSession,
    page_params: PageParams = Depends(pagination_params),
    patient_id: Optional[uuid.UUID] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    diagnosis_code: Optional[str] = None,
):
    items, total = await VisitService(db).list(
        offset=page_params.offset,
        limit=page_params.limit,
        patient_id=patient_id,
        date_from=date_from,
        date_to=date_to,
        diagnosis_code=diagnosis_code,
    )
    # Receptionist: list only, no clinical content
    if current_user.role.value == "doctor":
        data = [VisitOut.model_validate(v) for v in items]
    else:
        data = [VisitListItem.model_validate(v) for v in items]
    return success(data, pagination=make_pagination(page_params.page, page_params.limit, total))


@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_doctor)])
async def create_visit(payload: VisitCreate, current_user: CurrentUser, db: DbSession):
    visit = await VisitService(db).create(payload, current_user.id)
    await db.commit()
    return success(VisitOut.model_validate(visit), message="Visit created")


@router.get("/{visit_id}", dependencies=[Depends(require_doctor)])
async def get_visit(visit_id: uuid.UUID, db: DbSession):
    visit = await VisitService(db).get(visit_id)
    return success(VisitOut.model_validate(visit))


@router.put("/{visit_id}", dependencies=[Depends(require_doctor)])
async def update_visit(visit_id: uuid.UUID, payload: VisitUpdate, db: DbSession):
    visit = await VisitService(db).update(visit_id, payload)
    await db.commit()
    return success(VisitOut.model_validate(visit), message="Visit updated")


@router.delete("/{visit_id}", dependencies=[Depends(require_doctor)])
async def delete_visit(visit_id: uuid.UUID, db: DbSession):
    await VisitService(db).soft_delete(visit_id)
    await db.commit()
    return success(None, message="Visit deleted")


@router.get("/{visit_id}/prescriptions", dependencies=[Depends(require_doctor)])
async def list_prescriptions(visit_id: uuid.UUID, db: DbSession):
    items = await VisitService(db).list_prescriptions(visit_id)
    return success([PrescriptionOut.model_validate(p) for p in items])


@router.post(
    "/{visit_id}/prescriptions",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_doctor)],
)
async def add_prescription(visit_id: uuid.UUID, payload: PrescriptionCreate, db: DbSession):
    rx = await VisitService(db).add_prescription(visit_id, payload)
    await db.commit()
    return success(PrescriptionOut.model_validate(rx), message="Prescription added")


@router.put("/{visit_id}/prescriptions/{pid}", dependencies=[Depends(require_doctor)])
async def update_prescription(
    visit_id: uuid.UUID, pid: uuid.UUID, payload: PrescriptionUpdate, db: DbSession
):
    rx = await VisitService(db).update_prescription(visit_id, pid, payload)
    await db.commit()
    return success(PrescriptionOut.model_validate(rx), message="Prescription updated")


@router.delete("/{visit_id}/prescriptions/{pid}", dependencies=[Depends(require_doctor)])
async def delete_prescription(visit_id: uuid.UUID, pid: uuid.UUID, db: DbSession):
    await VisitService(db).delete_prescription(visit_id, pid)
    await db.commit()
    return success(None, message="Prescription removed")


@router.get("/{visit_id}/prescriptions/pdf", dependencies=[Depends(require_doctor)])
async def prescription_pdf(visit_id: uuid.UUID, db: DbSession):
    visit_service = VisitService(db)
    visit = await visit_service.get(visit_id)
    prescriptions = await visit_service.list_prescriptions(visit_id)
    patient = await PatientService(db).get(visit.patient_id)
    doctor = await DoctorService(db).get_profile()
    clinic = await SettingsService(db).get()
    pdf_bytes = generate_prescription_pdf(
        clinic={
            "clinic_name": clinic.clinic_name,
            "logo_url": clinic.logo_url,
            "address": clinic.address,
            "phone": clinic.phone,
            "email": clinic.email,
            "website": clinic.website,
        },
        doctor={
            "full_name": doctor.full_name,
            "specialty": doctor.specialty,
            "registration_number": doctor.registration_number,
            "signature_url": doctor.signature_url,
        },
        patient={"full_name": patient.full_name, "age": patient.age},
        prescriptions=[
            {
                "medication_name": p.medication_name,
                "dosage": p.dosage,
                "frequency": p.frequency,
                "duration": p.duration,
                "instructions": p.instructions,
            }
            for p in prescriptions
        ],
        issued_on=visit.visit_date,
    )
    await visit_service.mark_printed(visit_id)
    await db.commit()
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=prescription-{visit_id}.pdf"},
    )
