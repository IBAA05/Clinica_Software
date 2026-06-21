from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import DbSession, require_doctor
from app.schemas.doctor import (
    DoctorOut,
    DoctorProfileUpdate,
    DoctorStats,
    FeesUpdate,
    ScheduleUpdate,
)
from app.services.doctor_service import DoctorService
from app.utils.response import success

router = APIRouter(prefix="/doctor", tags=["Doctor"])


@router.get("/profile")
async def get_profile(db: DbSession):
    doctor = await DoctorService(db).get_profile()
    return success(DoctorOut.model_validate(doctor))


@router.put("/profile", dependencies=[Depends(require_doctor)])
async def update_profile(payload: DoctorProfileUpdate, db: DbSession):
    doctor = await DoctorService(db).update_profile(payload)
    await db.commit()
    return success(DoctorOut.model_validate(doctor), message="Profile updated")


@router.put("/schedule", dependencies=[Depends(require_doctor)])
async def update_schedule(payload: ScheduleUpdate, db: DbSession):
    doctor = await DoctorService(db).update_schedule(payload)
    await db.commit()
    return success(DoctorOut.model_validate(doctor), message="Schedule updated")


@router.put("/fees", dependencies=[Depends(require_doctor)])
async def update_fees(payload: FeesUpdate, db: DbSession):
    doctor = await DoctorService(db).update_fees(payload)
    await db.commit()
    return success(DoctorOut.model_validate(doctor), message="Fees updated")


@router.get("/stats")
async def doctor_stats(db: DbSession):
    stats = await DoctorService(db).stats()
    return success(DoctorStats(**stats))
