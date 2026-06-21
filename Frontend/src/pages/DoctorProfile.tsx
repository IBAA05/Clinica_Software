import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { Phone, Mail, Upload } from "lucide-react"
import { doctorApi } from "@/api/misc"
import { Card, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Avatar } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"
import { apiMessage } from "@/lib/axios"

const TABS = ["Schedule", "Fees", "Signature"] as const
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DURATIONS = [15, 30, 45, 60]

export default function DoctorProfile() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<(typeof TABS)[number]>("Schedule")
  const { data: doctor, isLoading } = useQuery({ queryKey: ["doctor", "me"], queryFn: doctorApi.profile })

  if (isLoading) return <Skeleton className="h-96 w-full" />
  const d = doctor ?? ({} as any)

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="p-6 text-center lg:col-span-1">
        <div className="flex flex-col items-center">
          <Avatar name={d.name ?? "Doctor"} src={d.avatar_url} size={120} />
          <Button variant="ghost" className="mt-2"><Upload className="h-4 w-4" /> Upload Photo</Button>
          <h2 className="mt-2 font-heading text-xl font-bold">{d.name}</h2>
          <p className="text-sm text-ink-secondary">{d.specialty}</p>
          <p className="text-xs text-ink-muted">{d.qualification}</p>
          {d.registration_no && <Badge className="mt-2 bg-brand-100 text-brand-700">Reg: {d.registration_no}</Badge>}
          <div className="mt-4 w-full space-y-1 text-left text-sm text-ink-secondary">
            {d.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {d.phone}</p>}
            {d.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {d.email}</p>}
          </div>
          <div className="mt-4 grid w-full grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center dark:border-gray-700">
            <Stat label="Patients" value={d.stats?.total_patients ?? 0} />
            <Stat label="This Month" value={d.stats?.month_appointments ?? 0} />
            <Stat label="Avg Daily" value={d.stats?.avg_daily ?? 0} />
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <div className="flex gap-1 border-b border-gray-100 p-2 dark:border-gray-700">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("rounded-lg px-4 py-2 text-sm font-medium", tab === t ? "bg-brand-500 text-white" : "text-ink-secondary hover:bg-brand-50")}>{t}</button>
          ))}
        </div>
        <div className="p-5">
          {tab === "Schedule" && <ScheduleTab doctor={d} onSaved={() => qc.invalidateQueries({ queryKey: ["doctor", "me"] })} />}
          {tab === "Fees" && <FeesTab doctor={d} />}
          {tab === "Signature" && <SignatureTab doctor={d} />}
        </div>
      </Card>
    </div>
  )
}

function ScheduleTab({ doctor, onSaved }: { doctor: any; onSaved: () => void }) {
  const [schedule, setSchedule] = useState<any[]>(() => DAYS.map((day) => {
    const existing = (doctor.schedule ?? []).find((s: any) => s.day === day)
    return existing ?? { day, enabled: false, morning_start: "09:00", morning_end: "12:00", afternoon_start: "14:00", afternoon_end: "18:00" }
  }))
  const [slotDuration, setSlotDuration] = useState(doctor.slot_duration ?? 30)
  const [maxDaily, setMaxDaily] = useState(doctor.max_daily ?? 20)

  const save = useMutation({
    mutationFn: () => doctorApi.updateSchedule({ schedule, slot_duration: slotDuration, max_daily: maxDaily }),
    onSuccess: () => { toast.success("Schedule saved"); onSaved() },
    onError: (e) => toast.error(apiMessage(e)),
  })

  function upd(i: number, patch: any) {
    setSchedule((arr) => arr.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {schedule.map((s, i) => (
          <div key={s.day} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 p-2 dark:border-gray-700">
            <label className="flex w-28 items-center gap-2">
              <input type="checkbox" checked={s.enabled} onChange={(e) => upd(i, { enabled: e.target.checked })} className="h-4 w-4 rounded text-brand-500 focus:ring-brand-400" />
              <span className="text-sm font-medium">{s.day}</span>
            </label>
            <input type="time" disabled={!s.enabled} value={s.morning_start} onChange={(e) => upd(i, { morning_start: e.target.value })} className="input w-auto py-1 disabled:opacity-40" />
            <span className="text-ink-muted">–</span>
            <input type="time" disabled={!s.enabled} value={s.morning_end} onChange={(e) => upd(i, { morning_end: e.target.value })} className="input w-auto py-1 disabled:opacity-40" />
            <span className="px-1 text-xs text-ink-muted">PM</span>
            <input type="time" disabled={!s.enabled} value={s.afternoon_start} onChange={(e) => upd(i, { afternoon_start: e.target.value })} className="input w-auto py-1 disabled:opacity-40" />
            <span className="text-ink-muted">–</span>
            <input type="time" disabled={!s.enabled} value={s.afternoon_end} onChange={(e) => upd(i, { afternoon_end: e.target.value })} className="input w-auto py-1 disabled:opacity-40" />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <label className="label">Slot Duration</label>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button key={d} onClick={() => setSlotDuration(d)} className={cn("rounded-lg border px-3 py-1.5 text-sm", slotDuration === d ? "border-brand-500 bg-brand-500 text-white" : "border-gray-200")}>{d}m</button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Max Daily Appointments</label>
          <input type="number" className="input w-32" value={maxDaily} onChange={(e) => setMaxDaily(Number(e.target.value))} />
        </div>
      </div>
      <Button onClick={() => save.mutate()} loading={save.isPending}>Save Schedule</Button>
    </div>
  )
}

function FeesTab({ doctor }: { doctor: any }) {
  const [fees, setFees] = useState<any[]>(doctor.fees ?? [
    { service: "Consultation", price: 0 },
    { service: "Follow-up", price: 0 },
    { service: "Procedure", price: 0 },
  ])
  const save = useMutation({ mutationFn: () => doctorApi.updateFees(fees), onSuccess: () => toast.success("Fees saved"), onError: (e) => toast.error(apiMessage(e)) })
  return (
    <div className="space-y-3">
      {fees.map((f, i) => (
        <div key={i} className="flex items-center gap-3">
          <input className="input flex-1" value={f.service} onChange={(e) => setFees((arr) => arr.map((x, idx) => idx === i ? { ...x, service: e.target.value } : x))} />
          <input type="number" className="input w-40 tabular" value={f.price} onChange={(e) => setFees((arr) => arr.map((x, idx) => idx === i ? { ...x, price: Number(e.target.value) } : x))} />
        </div>
      ))}
      <Button onClick={() => save.mutate()} loading={save.isPending}>Save Fees</Button>
    </div>
  )
}

function SignatureTab({ doctor }: { doctor: any }) {
  const [preview, setPreview] = useState<string | undefined>(doctor.signature_url)
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }
  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-8 text-center hover:border-brand-300">
        <Upload className="mb-2 h-6 w-6 text-ink-muted" />
        <span className="text-sm text-ink-secondary">Upload signature image (PNG recommended)</span>
        <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={onFile} />
      </label>
      {preview && (
        <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-700">
          <p className="mb-2 text-xs text-ink-muted">Preview (as shown on prescription PDF)</p>
          <img src={preview} alt="Signature" className="h-20 object-contain" />
        </div>
      )}
      <Button onClick={() => toast.success("Signature saved")}>Save Signature</Button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-heading text-lg font-bold tabular">{value}</p>
      <p className="text-[11px] text-ink-muted">{label}</p>
    </div>
  )
}
