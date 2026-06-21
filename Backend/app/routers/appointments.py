from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status

from app.core.dependencies import CurrentUser, DbSession, require_staff
from app.models.enums import AppointmentStatus, AppointmentType, RelatedEntity
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentOut,
    AppointmentStatusUpdate,
    AppointmentUpdate,
    CalendarDay,
    TimeSlot,
)
from app.services.appointment_service import AppointmentService
from app.services.notification_service import send_and_log_email
from app.services.patient_service import PatientService
from app.utils.pagination import PageParams, pagination_params
from app.utils.response import make_pagination, success

router = APIRouter(prefix="/appointments", tags=["Appointments"], dependencies=[Depends(require_staff)])


@router.get("")
async def list_appointments(
    db: DbSession,
    page_params: PageParams = Depends(pagination_params),
    status_filter: Optional[AppointmentStatus] = Query(None, alias="status"),
    type_filter: Optional[AppointmentType] = Query(None, alias="type"),
    date_filter: Optional[date] = Query(None, alias="date"),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    patient_id: Optional[uuid.UUID] = None,
    patient_name: Optional[str] = None,
):
    items, total = await AppointmentService(db).list(
        offset=page_params.offset,
        limit=page_params.limit,
        status=status_filter,
        type_=type_filter,
        on_date=date_filter,
        date_from=date_from,
        date_to=date_to,
        patient_id=patient_id,
        patient_name=patient_name,
    )
    return success(
        [AppointmentOut.model_validate(a) for a in items],
        pagination=make_pagination(page_params.page, page_params.limit, total),
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_appointment(
    payload: AppointmentCreate, current_user: CurrentUser, background: BackgroundTasks, db: DbSession
):
    service = AppointmentService(db)
    appt = await service.create(payload, current_user.id)
    await db.commit()
    if appt.patient and appt.patient.email:
        background.add_task(
            send_and_log_email,
            db,
            appt.patient.email,
            "Appointment Confirmation",
            f"Dear {appt.patient.full_name}, your appointment is booked for "
            f"{appt.appointment_date} at {appt.appointment_time}.",
            related_entity=RelatedEntity.appointment,
            related_id=appt.id,
        )
    return success(AppointmentOut.model_validate(appt), message="Appointment created")


@router.get("/today")
async def today(db: DbSession):
    items = await AppointmentService(db).today()
    return success([AppointmentOut.model_validate(a) for a in items])


@router.get("/upcoming")
async def upcoming(db: DbSession):
    items = await AppointmentService(db).upcoming(7)
    return success([AppointmentOut.model_validate(a) for a in items])


@router.get("/calendar")
async def calendar(db: DbSession, year: int, month: int):
    grouped = await AppointmentService(db).calendar(year, month)
    days = [
        CalendarDay(
            date=day,
            count=len(appts),
            appointments=[AppointmentOut.model_validate(a) for a in appts],
        )
        for day, appts in sorted(grouped.items())
    ]
    return success(days)


@router.get("/slots")
async def slots(db: DbSession, date_param: date = Query(..., alias="date")):
    available = await AppointmentService(db).available_slots(date_param)
    return success([TimeSlot(**s) for s in available])


@router.get("/{appt_id}")
async def get_appointment(appt_id: uuid.UUID, db: DbSession):
    appt = await AppointmentService(db).get(appt_id)
    return success(AppointmentOut.model_validate(appt))


@router.put("/{appt_id}")
async def update_appointment(appt_id: uuid.UUID, payload: AppointmentUpdate, db: DbSession):
    appt = await AppointmentService(db).update(appt_id, payload)
    await db.commit()
    return success(AppointmentOut.model_validate(appt), message="Appointment updated")


@router.delete("/{appt_id}")
async def cancel_appointment(appt_id: uuid.UUID, db: DbSession, reason: Optional[str] = None):
    appt = await AppointmentService(db).cancel(appt_id, reason)
    await db.commit()
    return success(AppointmentOut.model_validate(appt), message="Appointment cancelled")


@router.put("/{appt_id}/status")
async def update_status(appt_id: uuid.UUID, payload: AppointmentStatusUpdate, db: DbSession):
    appt = await AppointmentService(db).update_status(appt_id, payload)
    await db.commit()
    return success(AppointmentOut.model_validate(appt), message="Status updated")
