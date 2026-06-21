import jsPDF from "jspdf"
import { formatCurrency, formatDate } from "./utils"

const BRAND = "#10B981"

interface ClinicInfo {
  name: string
  address?: string
  phone?: string
  email?: string
}

interface PrescriptionData {
  clinic: ClinicInfo
  patient: { name: string; dob?: string; age?: number }
  doctor: { name: string; specialty?: string; registration_no?: string; signature?: string | null }
  date: string
  medications: { name: string; dosage: string; frequency: string; duration: string; instructions?: string }[]
}

export function generatePrescriptionPdf(data: PrescriptionData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const W = doc.internal.pageSize.getWidth()
  let y = 48

  doc.setFillColor(BRAND)
  doc.rect(0, 0, W, 8, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.text(data.clinic.name, 48, y)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(120)
  y += 16
  if (data.clinic.address) doc.text(data.clinic.address, 48, y), (y += 12)
  const contact = [data.clinic.phone, data.clinic.email].filter(Boolean).join("  ·  ")
  if (contact) doc.text(contact, 48, y), (y += 12)

  doc.setDrawColor(220)
  doc.line(48, y + 6, W - 48, y + 6)
  y += 28

  doc.setTextColor(20)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("Prescription ℞", 48, y)
  y += 20

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Patient: ${data.patient.name}`, 48, y)
  doc.text(`Date: ${formatDate(data.date)}`, W - 200, y)
  y += 14
  if (data.patient.dob) {
    doc.text(`DOB: ${formatDate(data.patient.dob)}`, 48, y)
    y += 14
  }
  y += 8

  // medication table header
  doc.setFont("helvetica", "bold")
  doc.setFillColor("#D1FAE5")
  doc.rect(48, y - 10, W - 96, 18, "F")
  doc.setFontSize(9)
  doc.text("Medication", 54, y + 2)
  doc.text("Dosage", 220, y + 2)
  doc.text("Frequency", 300, y + 2)
  doc.text("Duration", 400, y + 2)
  y += 22

  doc.setFont("helvetica", "normal")
  data.medications.forEach((m) => {
    doc.text(m.name, 54, y)
    doc.text(m.dosage, 220, y)
    doc.text(m.frequency, 300, y)
    doc.text(m.duration, 400, y)
    y += 14
    if (m.instructions) {
      doc.setTextColor(120)
      doc.setFontSize(8)
      doc.text(`↳ ${m.instructions}`, 60, y)
      doc.setFontSize(9)
      doc.setTextColor(20)
      y += 14
    }
  })

  y += 40
  if (data.doctor.signature) {
    try {
      doc.addImage(data.doctor.signature, "PNG", W - 200, y - 30, 120, 40)
    } catch {
      /* ignore invalid image */
    }
  }
  doc.setDrawColor(180)
  doc.line(W - 220, y + 16, W - 60, y + 16)
  doc.setFontSize(9)
  doc.text(`Dr. ${data.doctor.name}`, W - 220, y + 30)
  if (data.doctor.specialty) doc.text(data.doctor.specialty, W - 220, y + 42)
  if (data.doctor.registration_no) doc.text(`Reg: ${data.doctor.registration_no}`, W - 220, y + 54)

  doc.save(`prescription-${data.patient.name.replace(/\s+/g, "-")}.pdf`)
}

interface InvoiceData {
  clinic: ClinicInfo
  invoice_ref: string
  issue_date: string
  due_date?: string
  status: string
  patient: { name: string; phone?: string }
  services: { description: string; qty: number; unit_price: number; total: number }[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paid: number
  balance: number
}

export function generateInvoicePdf(data: InvoiceData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const W = doc.internal.pageSize.getWidth()
  let y = 48

  doc.setFillColor(BRAND)
  doc.rect(0, 0, W, 8, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.text(data.clinic.name, 48, y)
  doc.setFontSize(16)
  doc.setTextColor(120)
  doc.text("INVOICE", W - 130, y)
  doc.setTextColor(20)
  y += 24

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(`Ref: ${data.invoice_ref}`, W - 200, y)
  y += 12
  doc.text(`Issued: ${formatDate(data.issue_date)}`, W - 200, y)
  y += 20

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Bill To:", 48, y)
  doc.setFont("helvetica", "normal")
  doc.text(data.patient.name, 48, y + 14)
  y += 44

  doc.setFont("helvetica", "bold")
  doc.setFillColor("#D1FAE5")
  doc.rect(48, y - 12, W - 96, 18, "F")
  doc.setFontSize(9)
  doc.text("Description", 54, y)
  doc.text("Qty", 320, y)
  doc.text("Unit", 380, y)
  doc.text("Total", W - 100, y)
  y += 20

  doc.setFont("helvetica", "normal")
  data.services.forEach((s) => {
    doc.text(s.description, 54, y)
    doc.text(String(s.qty), 320, y)
    doc.text(formatCurrency(s.unit_price), 380, y)
    doc.text(formatCurrency(s.total), W - 100, y)
    y += 16
  })

  y += 10
  const lx = W - 220
  const vx = W - 60
  const row = (label: string, val: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal")
    doc.text(label, lx, y)
    doc.text(val, vx, y, { align: "right" })
    y += 16
  }
  row("Subtotal", formatCurrency(data.subtotal))
  row("Discount", "-" + formatCurrency(data.discount))
  row("Tax", formatCurrency(data.tax))
  doc.setDrawColor(200)
  doc.line(lx, y - 6, vx, y - 6)
  doc.setTextColor(BRAND)
  row("TOTAL", formatCurrency(data.total), true)
  doc.setTextColor(20)
  row("Paid", formatCurrency(data.paid))
  row("Balance", formatCurrency(data.balance), true)

  if (data.status === "paid") {
    doc.setTextColor(BRAND)
    doc.setFontSize(40)
    doc.setFont("helvetica", "bold")
    doc.text("PAID", 120, 300, { angle: 18 })
    doc.setTextColor(20)
  }

  doc.save(`invoice-${data.invoice_ref}.pdf`)
}
