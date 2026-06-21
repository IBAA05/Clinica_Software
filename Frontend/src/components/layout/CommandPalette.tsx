import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Search, Users, CalendarDays, Receipt } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { useDebounce } from "@/hooks/useDebounce"
import { listPatients } from "@/api/patients"
import { listAppointments } from "@/api/appointments"
import { listInvoices } from "@/api/invoices"
import { formatDate } from "@/lib/utils"

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("")
  const term = useDebounce(q, 300)
  const navigate = useNavigate()
  const enabled = open && term.length >= 1

  const patients = useQuery({
    queryKey: ["cmd", "patients", term],
    queryFn: () => listPatients({ search: term, limit: 5 }),
    enabled,
  })
  const appts = useQuery({
    queryKey: ["cmd", "appts", term],
    queryFn: () => listAppointments({ patient_name: term, limit: 5 }),
    enabled,
  })
  const invoices = useQuery({
    queryKey: ["cmd", "invoices", term],
    queryFn: () => listInvoices({ patient_name: term, limit: 5 }),
    enabled,
  })

  useEffect(() => {
    if (!open) setQ("")
  }, [open])

  function go(path: string) {
    onClose()
    navigate(path)
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-xl">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-700">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search patients, appointments, invoices..."
          className="w-full bg-transparent text-sm outline-none"
        />
        <kbd className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-ink-muted">ESC</kbd>
      </div>
      <div className="max-h-80 overflow-y-auto py-2">
        {term.length < 1 && <p className="px-2 py-6 text-center text-sm text-ink-muted">Type to search across the clinic.</p>}
        <Group icon={<Users className="h-4 w-4" />} title="Patients">
          {(patients.data?.patients ?? []).map((p) => (
            <Item key={p.id} onClick={() => go(`/patients/${p.id}`)} title={p.full_name} subtitle={p.phone} />
          ))}
        </Group>
        <Group icon={<CalendarDays className="h-4 w-4" />} title="Appointments">
          {(appts.data?.items ?? []).map((a) => (
            <Item
              key={a.id}
              onClick={() => go("/appointments")}
              title={a.patient_name ?? "Appointment"}
              subtitle={`${formatDate(a.appointment_date)} · ${a.type}`}
            />
          ))}
        </Group>
        <Group icon={<Receipt className="h-4 w-4" />} title="Invoices">
          {(invoices.data?.invoices ?? []).map((inv) => (
            <Item
              key={inv.id}
              onClick={() => go("/billing")}
              title={inv.invoice_ref}
              subtitle={inv.patient_name}
            />
          ))}
        </Group>
      </div>
    </Modal>
  )
}

function Group({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const arr = Array.isArray(children) ? children : [children]
  const hasItems = arr.some(Boolean) && arr.flat().filter(Boolean).length > 0
  if (!hasItems) return null
  return (
    <div className="mb-2">
      <p className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        {icon}
        {title}
      </p>
      {children}
    </div>
  )
}

function Item({ onClick, title, subtitle }: { onClick: () => void; title: string; subtitle?: string }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left hover:bg-brand-50 dark:hover:bg-gray-700"
    >
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</span>
      {subtitle && <span className="text-xs text-ink-secondary">{subtitle}</span>}
    </button>
  )
}
