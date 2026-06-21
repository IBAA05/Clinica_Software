import { cn } from "@/lib/utils"
import type { AppointmentStatus, InvoiceStatus, BloodType, AppointmentType } from "@/types"

export function Badge({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      style={style}
    >
      {children}
    </span>
  )
}

const APPT_STATUS: Record<AppointmentStatus, { bg: string; color: string; label: string }> = {
  scheduled: { bg: "#DBEAFE", color: "#1D4ED8", label: "Scheduled" },
  confirmed: { bg: "#D1FAE5", color: "#065F46", label: "Confirmed" },
  checked_in: { bg: "#FEF3C7", color: "#92400E", label: "Checked In" },
  in_progress: { bg: "#ECFDF5", color: "#059669", label: "In Progress" },
  completed: { bg: "#F3F4F6", color: "#374151", label: "Completed" },
  cancelled: { bg: "#FEE2E2", color: "#B91C1C", label: "Cancelled" },
  no_show: { bg: "#1F2937", color: "#9CA3AF", label: "No Show" },
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const s = APPT_STATUS[status] ?? APPT_STATUS.scheduled
  const style = { backgroundColor: s.bg, color: s.color }
  return <Badge style={style}>{s.label}</Badge>
}

const TYPE_COLORS: Record<AppointmentType, string> = {
  consultation: "bg-brand-100 text-brand-700",
  followup: "bg-amber-100 text-amber-700",
  procedure: "bg-purple-100 text-purple-700",
  checkup: "bg-blue-100 text-blue-700",
  emergency: "bg-red-100 text-red-700",
}

export function TypeBadge({ type }: { type: AppointmentType }) {
  return <Badge className={cn("capitalize", TYPE_COLORS[type])}>{type}</Badge>
}

const INVOICE_STATUS: Record<InvoiceStatus, string> = {
  paid: "bg-brand-100 text-brand-700",
  pending: "bg-amber-100 text-amber-700",
  partial: "bg-blue-100 text-blue-700",
  overdue: "bg-red-100 text-red-700",
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge className={cn("capitalize", INVOICE_STATUS[status])}>{status}</Badge>
}

export function BloodTypeBadge({ type }: { type?: BloodType | null }) {
  if (!type) return null
  return <Badge className="bg-red-50 text-red-600 border border-red-200">{type}</Badge>
}

export function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge className="bg-brand-100 text-brand-700">Active</Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-500">Inactive</Badge>
  )
}
