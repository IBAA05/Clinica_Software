from __future__ import annotations

import uuid
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.enums import InvoiceStatus
from app.models.invoice import Invoice
from app.models.invoice_item import InvoiceItem
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.patient_repository import PatientRepository
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, PayRequest

TWO = Decimal("0.01")


def _q(value: Decimal) -> Decimal:
    return Decimal(value).quantize(TWO)


class InvoiceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = InvoiceRepository(db)
        self.patients = PatientRepository(db)

    async def get(self, invoice_id: uuid.UUID) -> Invoice:
        invoice = await self.repo.get_by_id(invoice_id)
        if invoice is None:
            raise NotFoundError("Invoice not found")
        return invoice

    async def list(self, *, offset: int, limit: int, **filters):
        items = await self.repo.list(offset=offset, limit=limit, **filters)
        total = await self.repo.count(**filters)
        stats = await self.repo.stats(**filters)
        return items, total, stats

    @staticmethod
    def _recompute(invoice: Invoice) -> None:
        subtotal = sum((_q(i.total) for i in invoice.items), Decimal("0.00"))
        invoice.subtotal = _q(subtotal)
        invoice.tax_amount = _q(subtotal * (invoice.tax_rate / Decimal("100")))
        invoice.total = _q(invoice.subtotal - invoice.discount + invoice.tax_amount)
        invoice.balance = _q(invoice.total - invoice.amount_paid)
        if invoice.balance <= 0:
            invoice.status = InvoiceStatus.paid
        elif invoice.amount_paid > 0:
            invoice.status = InvoiceStatus.partial
        elif invoice.due_date < date.today():
            invoice.status = InvoiceStatus.overdue
        else:
            invoice.status = InvoiceStatus.pending

    async def _generate_ref(self) -> str:
        year = date.today().year
        seq = await self.repo.next_sequence(year)
        return f"CLN-INV-{year}-{seq:05d}"

    async def create(self, data: InvoiceCreate, created_by: uuid.UUID) -> Invoice:
        if await self.patients.get_by_id(data.patient_id) is None:
            raise NotFoundError("Patient not found")
        issue = data.issue_date or date.today()
        due = data.due_date or (issue + timedelta(days=30))
        invoice = Invoice(
            invoice_ref=await self._generate_ref(),
            patient_id=data.patient_id,
            appointment_id=data.appointment_id,
            discount=_q(data.discount),
            tax_rate=data.tax_rate,
            amount_paid=Decimal("0.00"),
            payment_method=data.payment_method,
            issue_date=issue,
            due_date=due,
            notes=data.notes,
            created_by=created_by,
        )
        for item in data.items:
            line_total = _q(Decimal(item.unit_price) * item.quantity)
            invoice.items.append(
                InvoiceItem(
                    service_type=item.service_type,
                    description=item.description,
                    quantity=item.quantity,
                    unit_price=_q(item.unit_price),
                    total=line_total,
                )
            )
        self._recompute(invoice)
        invoice = await self.repo.add(invoice)
        return await self.get(invoice.id)

    async def update(self, invoice_id: uuid.UUID, data: InvoiceUpdate) -> Invoice:
        invoice = await self.get(invoice_id)
        payload = data.model_dump(exclude_unset=True)
        if "items" in payload and payload["items"] is not None:
            invoice.items.clear()
            await self.db.flush()
            for item in data.items or []:
                line_total = _q(Decimal(item.unit_price) * item.quantity)
                invoice.items.append(
                    InvoiceItem(
                        service_type=item.service_type,
                        description=item.description,
                        quantity=item.quantity,
                        unit_price=_q(item.unit_price),
                        total=line_total,
                    )
                )
        for field in ("discount", "tax_rate", "issue_date", "due_date", "payment_method", "notes"):
            if field in payload:
                setattr(invoice, field, payload[field])
        self._recompute(invoice)
        await self.db.flush()
        return await self.get(invoice.id)

    async def pay(self, invoice_id: uuid.UUID, data: PayRequest) -> Invoice:
        invoice = await self.get(invoice_id)
        invoice.amount_paid = _q(invoice.amount_paid + Decimal(data.amount_paid))
        invoice.payment_method = data.payment_method
        invoice.paid_date = data.paid_date or date.today()
        self._recompute(invoice)
        await self.db.flush()
        return await self.get(invoice.id)

    async def soft_delete(self, invoice_id: uuid.UUID) -> None:
        invoice = await self.get(invoice_id)
        invoice.is_deleted = True
        await self.db.flush()

    async def overdue(self):
        return await self.repo.overdue()
