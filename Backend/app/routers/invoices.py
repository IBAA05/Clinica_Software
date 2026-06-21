from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Response, status

from app.core.dependencies import CurrentUser, DbSession, require_doctor, require_staff
from app.models.enums import InvoiceStatus, PaymentMethod, RelatedEntity
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceOut,
    InvoiceStats,
    InvoiceUpdate,
    PayRequest,
)
from app.schemas.settings import ServiceOut, ServiceUpdate
from app.services.invoice_service import InvoiceService
from app.services.notification_service import send_and_log_email
from app.services.patient_service import PatientService
from app.services.settings_service import SettingsService
from app.utils.pagination import PageParams, pagination_params
from app.utils.pdf import generate_invoice_pdf
from app.utils.response import make_pagination, success

router = APIRouter(prefix="/invoices", tags=["Invoices"], dependencies=[Depends(require_staff)])


async def _invoice_pdf_bytes(db, invoice) -> bytes:
    patient = await PatientService(db).get(invoice.patient_id)
    clinic = await SettingsService(db).get()
    return generate_invoice_pdf(
        clinic={
            "clinic_name": clinic.clinic_name,
            "logo_url": clinic.logo_url,
            "address": clinic.address,
            "phone": clinic.phone,
            "email": clinic.email,
            "website": clinic.website,
            "currency": clinic.currency,
        },
        patient={"full_name": patient.full_name, "phone": patient.phone},
        invoice={
            "invoice_ref": invoice.invoice_ref,
            "issue_date": invoice.issue_date,
            "due_date": invoice.due_date,
            "status": invoice.status.value,
            "payment_method": invoice.payment_method.value if invoice.payment_method else None,
            "subtotal": invoice.subtotal,
            "discount": invoice.discount,
            "tax_rate": invoice.tax_rate,
            "tax_amount": invoice.tax_amount,
            "total": invoice.total,
            "amount_paid": invoice.amount_paid,
            "balance": invoice.balance,
        },
        items=[
            {
                "service_type": it.service_type.value,
                "description": it.description,
                "quantity": it.quantity,
                "unit_price": it.unit_price,
                "total": it.total,
            }
            for it in invoice.items
        ],
    )


@router.get("")
async def list_invoices(
    db: DbSession,
    page_params: PageParams = Depends(pagination_params),
    status_filter: Optional[InvoiceStatus] = Query(None, alias="status"),
    payment_method: Optional[PaymentMethod] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    patient_id: Optional[uuid.UUID] = None,
    patient_name: Optional[str] = None,
):
    items, total, stats = await InvoiceService(db).list(
        offset=page_params.offset,
        limit=page_params.limit,
        status=status_filter,
        payment_method=payment_method,
        date_from=date_from,
        date_to=date_to,
        patient_id=patient_id,
        patient_name=patient_name,
    )
    data = {
        "invoices": [InvoiceOut.model_validate(i) for i in items],
        "stats": InvoiceStats(**stats),
    }
    return success(data, pagination=make_pagination(page_params.page, page_params.limit, total))


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_invoice(payload: InvoiceCreate, current_user: CurrentUser, db: DbSession):
    invoice = await InvoiceService(db).create(payload, current_user.id)
    await db.commit()
    return success(InvoiceOut.model_validate(invoice), message="Invoice created")


@router.get("/overdue")
async def overdue(db: DbSession):
    items = await InvoiceService(db).overdue()
    return success([InvoiceOut.model_validate(i) for i in items])


@router.get("/services")
async def list_services(db: DbSession):
    services = await SettingsService(db).list_services()
    return success([ServiceOut.model_validate(s) for s in services])


@router.put("/services/{service_id}", dependencies=[Depends(require_doctor)])
async def update_service(service_id: uuid.UUID, payload: ServiceUpdate, db: DbSession):
    service = await SettingsService(db).update_service(service_id, payload)
    await db.commit()
    return success(ServiceOut.model_validate(service), message="Service updated")


@router.get("/{invoice_id}")
async def get_invoice(invoice_id: uuid.UUID, db: DbSession):
    invoice = await InvoiceService(db).get(invoice_id)
    return success(InvoiceOut.model_validate(invoice))


@router.put("/{invoice_id}")
async def update_invoice(invoice_id: uuid.UUID, payload: InvoiceUpdate, db: DbSession):
    invoice = await InvoiceService(db).update(invoice_id, payload)
    await db.commit()
    return success(InvoiceOut.model_validate(invoice), message="Invoice updated")


@router.delete("/{invoice_id}")
async def delete_invoice(invoice_id: uuid.UUID, db: DbSession):
    await InvoiceService(db).soft_delete(invoice_id)
    await db.commit()
    return success(None, message="Invoice deleted")


@router.put("/{invoice_id}/pay")
async def pay_invoice(invoice_id: uuid.UUID, payload: PayRequest, db: DbSession):
    invoice = await InvoiceService(db).pay(invoice_id, payload)
    await db.commit()
    return success(InvoiceOut.model_validate(invoice), message="Payment recorded")


@router.get("/{invoice_id}/pdf")
async def invoice_pdf(invoice_id: uuid.UUID, db: DbSession):
    invoice = await InvoiceService(db).get(invoice_id)
    pdf_bytes = await _invoice_pdf_bytes(db, invoice)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={invoice.invoice_ref}.pdf"},
    )


@router.post("/{invoice_id}/send")
async def send_invoice(invoice_id: uuid.UUID, background: BackgroundTasks, db: DbSession):
    invoice = await InvoiceService(db).get(invoice_id)
    patient = await PatientService(db).get(invoice.patient_id)
    pdf_bytes = await _invoice_pdf_bytes(db, invoice)
    if patient.email:
        background.add_task(
            send_and_log_email,
            db,
            patient.email,
            f"Invoice {invoice.invoice_ref}",
            f"Dear {patient.full_name}, please find attached invoice {invoice.invoice_ref}.",
            related_entity=RelatedEntity.invoice,
            related_id=invoice.id,
            attachment=pdf_bytes,
            attachment_name=f"{invoice.invoice_ref}.pdf",
        )
    return success(None, message="Invoice sent")
