"""Prescription + invoice PDF generation using ReportLab."""
from __future__ import annotations

import io
import os
from datetime import date
from typing import Iterable, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.pdfgen import canvas as pdfcanvas

_styles = getSampleStyleSheet()
_title = ParagraphStyle("clinicTitle", parent=_styles["Title"], fontSize=18, spaceAfter=4)
_muted = ParagraphStyle("muted", parent=_styles["Normal"], textColor=colors.grey, fontSize=9)
_h = ParagraphStyle("sectionH", parent=_styles["Heading3"], spaceBefore=10, spaceAfter=4)


def _clinic_header(clinic: dict) -> list:
    elements: list = []
    logo = clinic.get("logo_url")
    if logo and os.path.isfile(logo):
        try:
            elements.append(Image(logo, width=40 * mm, height=20 * mm))
        except Exception:
            pass
    elements.append(Paragraph(clinic.get("clinic_name", "Private Clinic"), _title))
    contact_bits = [
        clinic.get("address"),
        clinic.get("phone"),
        clinic.get("email"),
        clinic.get("website"),
    ]
    contact = "  |  ".join([b for b in contact_bits if b])
    if contact:
        elements.append(Paragraph(contact, _muted))
    elements.append(Spacer(1, 8))
    return elements


def generate_prescription_pdf(
    *,
    clinic: dict,
    doctor: dict,
    patient: dict,
    prescriptions: Iterable[dict],
    issued_on: Optional[date] = None,
) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=18 * mm, bottomMargin=18 * mm)
    elements = _clinic_header(clinic)

    elements.append(Paragraph("PRESCRIPTION", _styles["Heading2"]))
    issued = issued_on or date.today()
    meta = [
        ["Doctor:", doctor.get("full_name", ""), "Date:", issued.isoformat()],
        ["Specialty:", doctor.get("specialty", "") or "-", "Reg. No:", doctor.get("registration_number", "") or "-"],
        ["Patient:", patient.get("full_name", ""), "Age:", str(patient.get("age", ""))],
    ]
    mt = Table(meta, colWidths=[25 * mm, 65 * mm, 25 * mm, 55 * mm])
    mt.setStyle(TableStyle([("FONTSIZE", (0, 0), (-1, -1), 9), ("TEXTCOLOR", (0, 0), (0, -1), colors.grey)]))
    elements.append(mt)
    elements.append(Spacer(1, 8))

    rows = [["#", "Medication", "Dosage", "Frequency", "Duration", "Instructions"]]
    for i, rx in enumerate(prescriptions, start=1):
        rows.append([
            str(i),
            rx.get("medication_name", ""),
            rx.get("dosage", "") or "-",
            rx.get("frequency", "") or "-",
            rx.get("duration", "") or "-",
            rx.get("instructions", "") or "-",
        ])
    table = Table(rows, colWidths=[8 * mm, 40 * mm, 24 * mm, 28 * mm, 24 * mm, 46 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c5282")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7fafc")]),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 24))

    sig = doctor.get("signature_url")
    if sig and os.path.isfile(sig):
        try:
            elements.append(Image(sig, width=40 * mm, height=18 * mm))
        except Exception:
            pass
    elements.append(Paragraph(f"_______________________<br/>{doctor.get('full_name', '')}", _styles["Normal"]))
    doc.build(elements)
    return buf.getvalue()


def _paid_stamp(canvas: pdfcanvas.Canvas, doc) -> None:
    canvas.saveState()
    canvas.translate(150 * mm, 150 * mm)
    canvas.rotate(30)
    canvas.setStrokeColor(colors.HexColor("#38a169"))
    canvas.setFillColor(colors.HexColor("#38a169"))
    canvas.setLineWidth(3)
    canvas.roundRect(-30 * mm, -10 * mm, 60 * mm, 20 * mm, 4 * mm, stroke=1, fill=0)
    canvas.setFont("Helvetica-Bold", 28)
    canvas.drawCentredString(0, -4 * mm, "PAID")
    canvas.restoreState()


def generate_invoice_pdf(
    *,
    clinic: dict,
    patient: dict,
    invoice: dict,
    items: Iterable[dict],
) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=18 * mm, bottomMargin=18 * mm)
    elements = _clinic_header(clinic)

    currency = clinic.get("currency", "USD")
    elements.append(Paragraph(f"INVOICE {invoice.get('invoice_ref', '')}", _styles["Heading2"]))
    meta = [
        ["Bill To:", patient.get("full_name", ""), "Issue date:", str(invoice.get("issue_date", ""))],
        ["Phone:", patient.get("phone", "") or "-", "Due date:", str(invoice.get("due_date", ""))],
        ["Status:", str(invoice.get("status", "")).upper(), "Method:", str(invoice.get("payment_method") or "-")],
    ]
    mt = Table(meta, colWidths=[25 * mm, 65 * mm, 25 * mm, 55 * mm])
    mt.setStyle(TableStyle([("FONTSIZE", (0, 0), (-1, -1), 9), ("TEXTCOLOR", (0, 0), (0, -1), colors.grey)]))
    elements.append(mt)
    elements.append(Spacer(1, 8))

    rows = [["Service", "Description", "Qty", "Unit", "Total"]]
    for it in items:
        rows.append([
            str(it.get("service_type", "")),
            it.get("description", "") or "-",
            str(it.get("quantity", 1)),
            f"{currency} {it.get('unit_price', 0)}",
            f"{currency} {it.get('total', 0)}",
        ])
    table = Table(rows, colWidths=[30 * mm, 60 * mm, 15 * mm, 35 * mm, 35 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c5282")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e0")),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 10))

    totals = [
        ["Subtotal", f"{currency} {invoice.get('subtotal', 0)}"],
        ["Discount", f"- {currency} {invoice.get('discount', 0)}"],
        [f"Tax ({invoice.get('tax_rate', 0)}%)", f"{currency} {invoice.get('tax_amount', 0)}"],
        ["TOTAL", f"{currency} {invoice.get('total', 0)}"],
        ["Paid", f"{currency} {invoice.get('amount_paid', 0)}"],
        ["Balance", f"{currency} {invoice.get('balance', 0)}"],
    ]
    tt = Table(totals, colWidths=[50 * mm, 50 * mm], hAlign="RIGHT")
    tt.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LINEABOVE", (0, 3), (-1, 3), 0.6, colors.black),
        ("FONTNAME", (0, 3), (-1, 3), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
    ]))
    elements.append(tt)

    on_page = None
    if str(invoice.get("status")) == "paid":
        on_page = _paid_stamp
    doc.build(elements, onFirstPage=on_page) if on_page else doc.build(elements)
    return buf.getvalue()
