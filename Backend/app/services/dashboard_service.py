from __future__ import annotations

import calendar
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.appointment import Appointment
from app.models.enums import AppointmentStatus, InvoiceStatus, UserRole
from app.models.invoice import Invoice
from app.models.patient import Patient
from app.models.visit import Visit
from app.services.report_service import ReportService


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def stats(self, role: UserRole) -> dict:
        today = date.today()
        month_start = today.replace(day=1)
        total_patients = await self.db.scalar(
            select(func.count()).select_from(Patient).where(Patient.is_deleted.is_(False))
        )
        appts_today = await self.db.scalar(
            select(func.count()).select_from(Appointment).where(Appointment.appointment_date == today)
        )
        pending_invoices = await self.db.scalar(
            select(func.count()).select_from(Invoice).where(
                Invoice.is_deleted.is_(False), Invoice.balance > 0
            )
        )
        monthly_revenue = None
        if role == UserRole.doctor:
            monthly_revenue = await self.db.scalar(
                select(func.coalesce(func.sum(Invoice.total), 0)).where(
                    Invoice.is_deleted.is_(False), Invoice.issue_date >= month_start
                )
            )
            monthly_revenue = Decimal(monthly_revenue or 0)
        return {
            "total_patients": int(total_patients or 0),
            "appointments_today": int(appts_today or 0),
            "monthly_revenue": monthly_revenue,
            "pending_invoices_count": int(pending_invoices or 0),
        }

    async def today_schedule(self) -> list:
        rows = await self.db.execute(
            select(Appointment)
            .options(selectinload(Appointment.patient))
            .where(Appointment.appointment_date == date.today())
            .order_by(Appointment.appointment_time)
        )
        result = []
        for a in rows.scalars().all():
            result.append({
                "id": str(a.id),
                "time": a.appointment_time.strftime("%H:%M"),
                "patient_name": a.patient.full_name if a.patient else None,
                "type": a.type.value,
                "status": a.status.value,
                "duration": a.duration_minutes,
            })
        return result

    async def appointment_trend(self) -> list:
        return await self._monthly_appt_counts()

    async def _monthly_appt_counts(self) -> list:
        today = date.today()
        result = []
        for i in range(11, -1, -1):
            month = today.month - i
            year = today.year
            while month <= 0:
                month += 12
                year -= 1
            start = date(year, month, 1)
            end = date(year, month, calendar.monthrange(year, month)[1])
            rows = await self.db.execute(
                select(Appointment.status).where(
                    Appointment.appointment_date >= start, Appointment.appointment_date <= end
                )
            )
            statuses = [r[0] for r in rows.all()]
            result.append({
                "month": start.strftime("%b %Y"),
                "total": len(statuses),
                "completed": sum(1 for s in statuses if s == AppointmentStatus.completed),
                "cancelled": sum(1 for s in statuses if s == AppointmentStatus.cancelled),
            })
        return result

    async def patient_trend(self) -> list:
        today = date.today()
        result = []
        for i in range(11, -1, -1):
            month = today.month - i
            year = today.year
            while month <= 0:
                month += 12
                year -= 1
            start = date(year, month, 1)
            end = date(year, month, calendar.monthrange(year, month)[1])
            count = await self.db.scalar(
                select(func.count()).select_from(Patient).where(
                    Patient.is_deleted.is_(False),
                    func.date(Patient.created_at) >= start,
                    func.date(Patient.created_at) <= end,
                )
            )
            result.append({"month": start.strftime("%b %Y"), "count": int(count or 0)})
        return result

    async def revenue_by_service(self) -> list:
        return await ReportService(self.db).revenue_by_service("this_month")

    async def recent_records(self) -> list:
        rows = await self.db.execute(
            select(Visit)
            .options(selectinload(Visit.patient))
            .where(Visit.is_deleted.is_(False))
            .order_by(Visit.visit_date.desc())
            .limit(5)
        )
        result = []
        for v in rows.scalars().all():
            result.append({
                "patient_name": v.patient.full_name if v.patient else None,
                "date": v.visit_date.isoformat(),
                "diagnosis_summary": v.diagnosis_description or v.diagnosis_code or "-",
            })
        return result

    async def quick_stats(self) -> dict:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        week_revenue = await self.db.scalar(
            select(func.coalesce(func.sum(Invoice.total), 0)).where(
                Invoice.is_deleted.is_(False), Invoice.issue_date >= week_start
            )
        )
        month_revenue = await self.db.scalar(
            select(func.coalesce(func.sum(Invoice.total), 0)).where(
                Invoice.is_deleted.is_(False), Invoice.issue_date >= month_start
            )
        )
        overdue_count = await self.db.scalar(
            select(func.count()).select_from(Invoice).where(
                Invoice.is_deleted.is_(False), Invoice.balance > 0, Invoice.due_date < today
            )
        )
        overdue_amount = await self.db.scalar(
            select(func.coalesce(func.sum(Invoice.balance), 0)).where(
                Invoice.is_deleted.is_(False), Invoice.balance > 0, Invoice.due_date < today
            )
        )
        return {
            "this_week_revenue": Decimal(week_revenue or 0),
            "this_month_revenue": Decimal(month_revenue or 0),
            "overdue_invoices_count": int(overdue_count or 0),
            "overdue_invoices_amount": Decimal(overdue_amount or 0),
        }
