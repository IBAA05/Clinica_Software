import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import toast from "react-hot-toast"
import { AlertCircle } from "lucide-react"
import { Drawer } from "@/components/ui/Drawer"
import { Button } from "@/components/ui/Button"
import { Badge, AppointmentStatusBadge, TypeBadge, BloodTypeBadge } from "@/components/ui/Badge"
import { updateAppointmentStatus } from "@/api/appointments"
import { useAuthStore } from "@/stores/authStore"
import { formatDate } from "@/lib/utils"
import { apiMessage } from "@/lib/axios"
import type { Appointment, AppointmentStatus } from "@/types"

const FLOW: Record<string, { label: string; next: AppointmentStatus }[]> = {
  scheduled: [{ label: "Confirm", next: "confirmed" }, { label: "Cancel", next: "cancelled" }],
  confirmed: [{ label: "Check In", next: "checked_in" }, { label: "Cancel", next: "cancelled" }],
  checked_in: [{ label: "Start", next: "in_progress" }],
  in_progress: [{ label: "Complete", next: "completed" }],
}

export function AppointmentDrawer({ appointment, onClose }: { appointment: Appointment | null; onClose: () => void }) {
  const qc = useQueryClient()
  const isDoctor = useAuthStore((s) => s.user?.role === "doctor")
  const mut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => updateAppointmentStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["appointments"] }); toast.success("Status updated") },
    onError: (e) => toast.error(apiMessage(e, "Could not update")),
  })
  const a = appointment
  const actions = a ? FLOW[a.status] ?? [] : []

  return (
    <Drawer open={Boolean(a)} onClose={onClose} title="Appointment Details">
      {a && (
        <div className="space-y-5">
          <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="font-heading text-lg font-bold">{a.patient_name}</p>
              <BloodTypeBadge type={a.patient_blood_type} />
            </div>
            {a.patient_has_allergies && (
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600"><AlertCircle className="h-3.5 w-3.5" /> Has allergies</p>
            )}
          </div>

          <dl className="space-y-2 text-sm">
            <Row label="Date" value={formatDate(a.appointment_date)} />
            <Row label="Time" value={a.appointment_time} />
            <Row label="Duration" value={`${a.duration} min`} />
            <div className="flex items-center justify-between"><dt className="text-ink-muted">Type</dt><dd><TypeBadge type={a.type} /></dd></div>
            <div className="flex items-center justify-between"><dt className="text-ink-muted">Status</dt><dd><AppointmentStatusBadge status={a.status} /></dd></div>
            {a.reason && <Row label="Reason" value={a.reason} />}
          </dl>

          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((act) => (
                <Button key={act.next} variant={act.next === "cancelled" ? "danger" : "primary"} onClick={() => mut.mutate({ id: a.id, status: act.next })} loading={mut.isPending}>
                  {act.label}
                </Button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
            <Link to="/billing"><Button variant="secondary">Generate Invoice</Button></Link>
            <Link to={`/patients/${a.patient_id}`}><Button variant="secondary">View Patient</Button></Link>
            {isDoctor && a.visit_id && <Link to={`/visits/${a.visit_id}`}><Button variant="secondary">Visit Record</Button></Link>}
          </div>
        </div>
      )}
    </Drawer>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
