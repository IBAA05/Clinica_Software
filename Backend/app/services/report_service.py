from __future__ import annotations

import calendar
from collections import Counter
from datetime import date, timedelta
from decimal import Decimal
from typing import Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment
from app.models.enums import AppointmentStatus
from app.models.expense import Expense
from app.models.invoice import Invoice
from app.models.invoice_item import InvoiceItem
from app.models.patient import Patient
from app.models.visit import Visit

_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def resolve_period(
    period: str, start_date: Optional[date] = None, end_date: Optional[date] = None
) -> Tuple[date, date]:
    today = date.today()
    if period == "this_month":
        return today.replace(day=1), today
    if period == "last_3_months":
        return today - timedelta(days=90), today
    if period == "this_year":
        return today.replace(month=1, day=1), today
    if period == "custom" and start_date and end_date:
        return start_date, end_date
    return today.replace(day=1), today


class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _revenue(self, start: date, end: date) -> Decimal:
        val = await self.db.scalar(
            select(func.coalesce(func.sum(Invoice.total), 0)).where(
                Invoice.is_deleted.is_(False), Invoice.issue_date >= start, Invoice.issue_date <= end
            )
        )
        return Decimal(val or 0)

    async def _collected(self, start: date, end: date) -> Decimal:
        val = await self.db.scalar(
            select(func.coalesce(func.sum(Invoice.amount_paid), 0)).where(
                Invoice.is_deleted.is_(False), Invoice.issue_date >= start, Invoice.issue_date <= end
            )
        )
        return Decimal(val or 0)

    async def _pending(self, start: date, end: date) -> Decimal:
        val = await self.db.scalar(
            select(func.coalesce(func.sum(Invoice.balance), 0)).where(
                Invoice.is_deleted.is_(False), Invoice.issue_date >= start, Invoice.issue_date <= end
            )
        )
        return Decimal(val or 0)

    async def _expenses(self, start: date, end: date) -> Decimal:
        val = await self.db.scalar(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(
                Expense.is_deleted.is_(False), Expense.date >= start, Expense.date <= end
            )
        )
        return Decimal(val or 0)

    @staticmethod
    def _pct(curr: Decimal, prev: Decimal) -> float:
        if prev == 0:
            return 100.0 if curr > 0 else 0.0
        return round(float((curr - prev) / prev * 100), 2)

    async def financial_overview(self, period: str, start_date=None, end_date=None) -> dict:
        start, end = resolve_period(period, start_date, end_date)
        span = (end - start) or timedelta(days=1)
        prev_end = start - timedelta(days=1)
        prev_start = prev_end - span
        revenue = await self._revenue(start, end)
        collected = await self._collected(start, end)
        pending = await self._pending(start, end)
        expenses = await self._expenses(start, end)
        p_revenue = await self._revenue(prev_start, prev_end)
        p_expenses = await self._expenses(prev_start, prev_end)
        net = revenue - expenses
        p_net = p_revenue - p_expenses
        return {
            "total_revenue": revenue,
            "total_collected": collected,
            "total_pending": pending,
            "total_expenses": expenses,
            "net_income": net,
            "vs_previous_period": {
                "revenue_change_pct": self._pct(revenue, p_revenue),
                "expense_change_pct": self._pct(expenses, p_expenses),
                "income_change_pct": self._pct(net, p_net),
            },
        }

    async def monthly_trend(self, year: int) -> list:
        result = []
        for month in range(1, 13):
            start = date(year, month, 1)
            last_day = calendar.monthrange(year, month)[1]
            end = date(year, month, last_day)
            revenue = await self._revenue(start, end)
            expenses = await self._expenses(start, end)
            result.append({
                "month": start.strftime("%b"),
                "revenue": revenue,
                "expenses": expenses,
                "net_income": revenue - expenses,
            })
        return result

    async def revenue_by_service(self, period: str, start_date=None, end_date=None) -> list:
        start, end = resolve_period(period, start_date, end_date)
        rows = await self.db.execute(
            select(InvoiceItem.service_type, func.coalesce(func.sum(InvoiceItem.total), 0))
            .join(Invoice, InvoiceItem.invoice_id == Invoice.id)
            .where(Invoice.is_deleted.is_(False), Invoice.issue_date >= start, Invoice.issue_date <= end)
            .group_by(InvoiceItem.service_type)
        )
        data = [{"service_type": r[0].value, "amount": Decimal(r[1] or 0)} for r in rows.all()]
        total = sum((d["amount"] for d in data), Decimal("0"))
        for d in data:
            d["percentage"] = round(float(d["amount"] / total * 100), 2) if total else 0.0
        return data

    async def appointments_summary(self, period: str, start_date=None, end_date=None) -> dict:
        start, end = resolve_period(period, start_date, end_date)
        rows = await self.db.execute(
            select(Appointment).where(
                Appointment.appointment_date >= start, Appointment.appointment_date <= end
            )
        )
        appts = rows.scalars().all()
        total = len(appts)
        completed = sum(1 for a in appts if a.status == AppointmentStatus.completed)
        cancelled = sum(1 for a in appts if a.status == AppointmentStatus.cancelled)
        no_show = sum(1 for a in appts if a.status == AppointmentStatus.no_show)
        by_type: Counter = Counter(a.type.value for a in appts)
        by_month: dict = {}
        for a in appts:
            key = a.appointment_date.strftime("%Y-%m")
            entry = by_month.setdefault(key, {"month": key, "total": 0, "completed": 0, "cancelled": 0})
            entry["total"] += 1
            if a.status == AppointmentStatus.completed:
                entry["completed"] += 1
            if a.status == AppointmentStatus.cancelled:
                entry["cancelled"] += 1
        return {
            "total": total,
            "completed": completed,
            "cancelled": cancelled,
            "no_show": no_show,
            "completion_rate_pct": round(completed / total * 100, 2) if total else 0.0,
            "no_show_rate_pct": round(no_show / total * 100, 2) if total else 0.0,
            "by_type": dict(by_type),
            "by_month": sorted(by_month.values(), key=lambda x: x["month"]),
        }

    async def busiest_slots(self, period: str, start_date=None, end_date=None) -> dict:
        start, end = resolve_period(period, start_date, end_date)
        rows = await self.db.execute(
            select(Appointment.appointment_date, Appointment.appointment_time).where(
                Appointment.appointment_date >= start, Appointment.appointment_date <= end
            )
        )
        days: Counter = Counter()
        hours: Counter = Counter()
        for d, t in rows.all():
            days[_WEEKDAYS[d.weekday()]] += 1
            hours[t.hour] += 1
        return {
            "busiest_day_of_week": [{"day": d, "count": c} for d, c in days.most_common()],
            "busiest_time_slots": [{"hour": f"{h:02d}:00", "count": c} for h, c in sorted(hours.items())],
        }

    async def patient_demographics(self, period: str, start_date=None, end_date=None) -> dict:
        start, end = resolve_period(period, start_date, end_date)
        rows = await self.db.execute(select(Patient).where(Patient.is_deleted.is_(False)))
        patients = rows.scalars().all()
        total_new = sum(1 for p in patients if start <= p.created_at.date() <= end)
        total_active = sum(1 for p in patients if p.status.value == "active")
        by_gender = Counter(p.gender.value for p in patients)
        by_blood = Counter(p.blood_type.value for p in patients if p.blood_type)
        age_groups = {"0-12": 0, "13-25": 0, "26-40": 0, "41-60": 0, "60+": 0}
        for p in patients:
            a = p.age
            if a <= 12:
                age_groups["0-12"] += 1
            elif a <= 25:
                age_groups["13-25"] += 1
            elif a <= 40:
                age_groups["26-40"] += 1
            elif a <= 60:
                age_groups["41-60"] += 1
            else:
                age_groups["60+"] += 1
        insured = sum(1 for p in patients if p.insurance_provider)
        return {
            "total_new": total_new,
            "total_active": total_active,
            "by_gender": {"male": by_gender.get("male", 0), "female": by_gender.get("female", 0), "other": by_gender.get("other", 0)},
            "by_age_group": age_groups,
            "by_blood_type": dict(by_blood),
            "insurance_vs_selfpay": {"insured": insured, "self_pay": len(patients) - insured},
        }

    async def top_diagnoses(self, period: str, limit: int = 5, start_date=None, end_date=None) -> list:
        start, end = resolve_period(period, start_date, end_date)
        rows = await self.db.execute(
            select(
                Visit.diagnosis_code,
                func.max(Visit.diagnosis_description),
                func.count().label("cnt"),
            )
            .where(
                Visit.is_deleted.is_(False),
                Visit.diagnosis_code.is_not(None),
                Visit.visit_date >= start,
                Visit.visit_date <= end,
            )
            .group_by(Visit.diagnosis_code)
            .order_by(func.count().desc())
            .limit(limit)
        )
        return [
            {"diagnosis_code": r[0], "description": r[1], "count": int(r[2])} for r in rows.all()
        ]
