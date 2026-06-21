import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { AlertTriangle, Phone, Pencil, CalendarPlus, Receipt, ArrowLeft } from "lucide-react"
import { getPatient, getPatientVisits, getPatientAppointments, getPatientInvoices } from "@/api/patients"
import { useAuthStore } from "@/stores/authStore"
import { Card, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Avatar } from "@/components/ui/Avatar"
import { Badge, BloodTypeBadge, AppointmentStatusBadge, InvoiceStatusBadge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { Skeleton } from "@/components/ui/Skeleton"
import { PatientFormDrawer } from "@/components/PatientFormDrawer"
import { formatDate, calcAge, formatCurrency } from "@/lib/utils"

const TABS = ["Overview", "Visits", "Appointments", "Prescriptions", "Billing", "Documents"] as const
type Tab = (typeof TABS)[number]

export default function PatientProfile() {
  const { id = "" } = useParams()
  const [tab, setTab] = useState<Tab>("Overview")
  const [editOpen, setEditOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const isDoctor = user?.role === "doctor"

  const { data: patient, isLoading } = useQuery({ queryKey: ["patient", id], queryFn: () => getPatient(id) })

  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (!patient) return <EmptyState title="Patient not found" />

  const allergies = patient.allergies ?? []
  const conditions = patient.chronic_conditions ?? []

  return (
    <div className="space-y-5">
      <Link to="/patients" className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to Patients
      </Link>

      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <Avatar name={patient.full_name} size={80} />
            <div>
              <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">{patient.full_name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge className="bg-gray-100 text-gray-600">{calcAge(patient.date_of_birth)} yrs</Badge>
                <Badge className="bg-gray-100 capitalize text-gray-600">{patient.gender}</Badge>
                <BloodTypeBadge type={patient.blood_type} />
                {patient.insurance_provider ? (
                  <Badge className="bg-brand-100 text-brand-700">{patient.insurance_provider}</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-500">Self-Pay</Badge>
                )}
              </div>
              {patient.emergency_contact_name && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-secondary">
                  <Phone className="h-3.5 w-3.5" /> {patient.emergency_contact_name} · {patient.emergency_contact_phone}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Edit</Button>
            <Link to="/appointments"><Button variant="secondary"><CalendarPlus className="h-4 w-4" /> Appointment</Button></Link>
            <Link to="/billing"><Button><Receipt className="h-4 w-4" /> Invoice</Button></Link>
          </div>
        </div>
      </Card>

      {/* Allergy banner */}
      {allergies.length > 0 && (
        <motion.div
          initial={bannerInit}
          animate={bannerAnim}
          className="flex items-center gap-2 rounded-lg border-l-4 border-red-500 bg-red-50 px-4 py-3 text-red-700"
        >
          <AlertTriangle className="h-5 w-5" />
          <span className="font-semibold">Allergies:</span> {allergies.join(", ")}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="sticky top-16 z-10 flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tabClass(tab === t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Personal Info" />
            <dl className="space-y-2 p-4 text-sm">
              <Row label="Date of Birth" value={formatDate(patient.date_of_birth)} />
              <Row label="National ID" value={patient.national_id} />
              <Row label="Phone" value={patient.phone} />
              <Row label="Email" value={patient.email ?? "—"} />
              <Row label="Address" value={patient.address ?? "—"} />
            </dl>
          </Card>
          <Card>
            <CardHeader title="Medical Info" />
            <div className="space-y-3 p-4 text-sm">
              <Row label="Blood Type" value={patient.blood_type ?? "Unknown"} />
              <div>
                <p className="text-ink-muted">Allergies</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {allergies.length ? allergies.map((a) => <Badge key={a} className="bg-red-50 text-red-600">{a}</Badge>) : <span className="text-ink-secondary">None recorded</span>}
                </div>
              </div>
              <div>
                <p className="text-ink-muted">Chronic Conditions</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {conditions.length ? conditions.map((c) => <Badge key={c} className="bg-amber-100 text-amber-700">{c}</Badge>) : <span className="text-ink-secondary">None recorded</span>}
                </div>
              </div>
              {patient.notes && <Row label="Notes" value={patient.notes} />}
            </div>
          </Card>
        </div>
      )}

      {tab === "Visits" && <VisitsTab id={id} isDoctor={isDoctor} />}
      {tab === "Appointments" && <AppointmentsTab id={id} />}
      {tab === "Prescriptions" && (isDoctor ? <PrescriptionsTab id={id} /> : <RestrictedCard />)}
      {tab === "Billing" && <BillingTab id={id} />}
      {tab === "Documents" && (
        <Card className="p-6">
          <EmptyState title="No documents" description="Upload patient files to keep everything in one place." actionLabel="Upload Document" />
        </Card>
      )}

      <PatientFormDrawer open={editOpen} onClose={() => setEditOpen(false)} patient={patient} />
    </div>
  )
}

function VisitsTab({ id, isDoctor }: { id: string; isDoctor: boolean }) {
  if (!isDoctor) return <RestrictedCard />
  const { data } = useQuery({ queryKey: ["patient", id, "visits"], queryFn: () => getPatientVisits(id) })
  const visits = data ?? []
  return (
    <Card className="p-4">
      {visits.length === 0 ? (
        <EmptyState title="No visit records" />
      ) : (
        <ol className="space-y-3">
          {visits.map((v: any) => (
            <li key={v.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-700">
              <Badge className="bg-brand-100 text-brand-700">{formatDate(v.visit_date)}</Badge>
              <div className="flex-1">
                <p className="font-medium">{v.diagnosis_summary ?? "Visit"}</p>
                <p className="text-sm text-ink-secondary line-clamp-1">{v.symptoms}</p>
              </div>
              <Link to={`/visits/${v.id}`} className="text-sm font-medium text-brand-600 hover:underline">View Full Record</Link>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}

function AppointmentsTab({ id }: { id: string }) {
  const { data } = useQuery({ queryKey: ["patient", id, "appts"], queryFn: () => getPatientAppointments(id) })
  const appts = data ?? []
  const upcoming = appts.filter((a: any) => new Date(a.appointment_date) >= new Date())
  const past = appts.filter((a: any) => new Date(a.appointment_date) < new Date())
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader title="Upcoming" />
        <ApptList items={upcoming} empty="No upcoming appointments" />
      </Card>
      <Card>
        <CardHeader title="Past" />
        <ApptList items={past} empty="No past appointments" />
      </Card>
    </div>
  )
}

function ApptList({ items, empty }: { items: any[]; empty: string }) {
  if (!items.length) return <div className="p-4"><EmptyState title={empty} /></div>
  return (
    <ul className="divide-y divide-gray-50 p-2 dark:divide-gray-700">
      {items.map((a) => (
        <li key={a.id} className="flex items-center justify-between px-2 py-2.5 text-sm">
          <span>{formatDate(a.appointment_date)} · {a.appointment_time}</span>
          <span className="flex items-center gap-2"><span className="capitalize text-ink-secondary">{a.type}</span><AppointmentStatusBadge status={a.status} /></span>
        </li>
      ))}
    </ul>
  )
}

function PrescriptionsTab({ id }: { id: string }) {
  const { data } = useQuery({ queryKey: ["patient", id, "visits"], queryFn: () => getPatientVisits(id) })
  const visits = (data ?? []).filter((v: any) => (v.prescriptions ?? []).length > 0)
  return (
    <Card className="p-4">
      {visits.length === 0 ? <EmptyState title="No prescriptions" /> : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-ink-muted"><th className="pb-2">Date</th><th className="pb-2">Medications</th><th className="pb-2">Visit</th></tr></thead>
          <tbody>
            {visits.map((v: any) => (
              <tr key={v.id} className="border-t border-gray-50 dark:border-gray-700">
                <td className="py-2">{formatDate(v.visit_date)}</td>
                <td className="py-2">{(v.prescriptions ?? []).length} medications</td>
                <td className="py-2"><Link to={`/visits/${v.id}`} className="text-brand-600 hover:underline">Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

function BillingTab({ id }: { id: string }) {
  const { data } = useQuery({ queryKey: ["patient", id, "invoices"], queryFn: () => getPatientInvoices(id) })
  const invoices = data ?? []
  const billed = invoices.reduce((s: number, i: any) => s + Number(i.total ?? 0), 0)
  const paid = invoices.reduce((s: number, i: any) => s + Number(i.amount_paid ?? 0), 0)
  const balance = billed - paid
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SummaryBox label="Total Billed" value={formatCurrency(billed)} />
        <SummaryBox label="Total Paid" value={formatCurrency(paid)} />
        <SummaryBox label="Balance" value={formatCurrency(balance)} danger={balance > 0} />
      </div>
      <Card className="p-4">
        {invoices.length === 0 ? <EmptyState title="No invoices" /> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-ink-muted"><th className="pb-2">Ref</th><th className="pb-2">Date</th><th className="pb-2">Total</th><th className="pb-2">Status</th></tr></thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="border-t border-gray-50 dark:border-gray-700">
                  <td className="py-2 font-medium">{inv.invoice_ref}</td>
                  <td className="py-2">{formatDate(inv.issue_date)}</td>
                  <td className="py-2 tabular">{formatCurrency(inv.total)}</td>
                  <td className="py-2"><InvoiceStatusBadge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

function SummaryBox({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-ink-secondary">{label}</p>
      <p className={`mt-1 font-heading text-xl font-bold tabular ${danger ? "text-red-600" : ""}`}>{value}</p>
    </Card>
  )
}

function RestrictedCard() {
  return (
    <Card className="p-8">
      <EmptyState title="Access Restricted" description="Clinical records are available to doctors only." />
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-gray-800 dark:text-gray-200">{value}</dd>
    </div>
  )
}

function tabClass(active: boolean) {
  return active
    ? "whitespace-nowrap rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white"
    : "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-brand-50"
}

const bannerInit = { opacity: 0, x: -8 }
const bannerAnim = { opacity: 1, x: 0 }
