import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { createColumnHelper } from "@tanstack/react-table"
import { Plus, CalendarDays, List, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { listAppointments, getToday, updateAppointmentStatus } from "@/api/appointments"
import { STALE } from "@/lib/queryClient"
import { Card, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge, AppointmentStatusBadge, TypeBadge } from "@/components/ui/Badge"
import { DataTable } from "@/components/ui/DataTable"
import { EmptyState } from "@/components/ui/EmptyState"
import { AppointmentModal } from "@/components/AppointmentModal"
import { AppointmentDrawer } from "@/components/AppointmentDrawer"
import { cn, formatDate } from "@/lib/utils"
import type { Appointment, AppointmentStatus } from "@/types"

const col = createColumnHelper<Appointment>()
const STATUS_OPTS: AppointmentStatus[] = ["scheduled", "confirmed", "checked_in", "in_progress", "completed", "cancelled", "no_show"]

export default function Appointments() {
  const qc = useQueryClient()
  const [view, setView] = useState<"calendar" | "list">("calendar")
  const [calMode, setCalMode] = useState<"month" | "week" | "day">("month")
  const [cursor, setCursor] = useState(new Date())
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [preset, setPreset] = useState<{ date?: string; time?: string }>({})
  const [selected, setSelected] = useState<Appointment | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", { search, statusFilter }],
    queryFn: () => listAppointments({ patient_name: search, status: statusFilter }),
    staleTime: 30000,
  })
  const today = useQuery({ queryKey: ["appointments", "today"], queryFn: getToday, staleTime: STALE.today })
  const appts = data?.items ?? []

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => updateAppointmentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  })

  function openNew(date?: string, time?: string) {
    setPreset({ date, time })
    setModalOpen(true)
  }

  const columns = useMemo(
    () => [
      col.accessor("patient_name", { header: "Patient", cell: (c) => <span className="font-medium">{c.getValue()}</span> }),
      col.accessor("appointment_date", { header: "Date", cell: (c) => formatDate(c.getValue()) }),
      col.accessor("appointment_time", { header: "Time" }),
      col.accessor("type", { header: "Type", cell: (c) => <TypeBadge type={c.getValue()} /> }),
      col.accessor("duration", { header: "Duration", cell: (c) => `${c.getValue()} min` }),
      col.accessor("status", {
        header: "Status",
        cell: (c) => (
          <select
            value={c.getValue()}
            onChange={(e) => statusMut.mutate({ id: c.row.original.id, status: e.target.value as AppointmentStatus })}
            className="rounded-md border border-gray-200 bg-transparent px-1.5 py-1 text-xs dark:border-gray-700"
          >
            {STATUS_OPTS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        ),
      }),
      col.display({ id: "actions", header: "", cell: (c) => <Button variant="ghost" onClick={() => setSelected(c.row.original)}>View</Button> }),
    ],
    [statusMut]
  )

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search patient..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {STATUS_OPTS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
            <button onClick={() => setView("calendar")} className={tabBtn(view === "calendar")}><CalendarDays className="h-4 w-4" /></button>
            <button onClick={() => setView("list")} className={tabBtn(view === "list")}><List className="h-4 w-4" /></button>
          </div>
          <Button onClick={() => openNew()}><Plus className="h-4 w-4" /> New Appointment</Button>
        </div>
      </Card>

      {view === "list" ? (
        <Card className="p-2">
          <DataTable columns={columns} data={appts} loading={isLoading} emptyTitle="No appointments" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
          <Card className="xl:col-span-3">
            <CardHeader
              title={format(cursor, calMode === "day" ? "dd MMM yyyy" : "MMMM yyyy")}
              action={
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-gray-200 p-0.5 text-xs dark:border-gray-700">
                    {(["month", "week", "day"] as const).map((m) => (
                      <button key={m} onClick={() => setCalMode(m)} className={cn("rounded px-2 py-1 capitalize", calMode === m ? "bg-brand-100 text-brand-700" : "text-gray-400")}>{m}</button>
                    ))}
                  </div>
                  <button onClick={() => setCursor(calMode === "month" ? subMonths(cursor, 1) : addDays(cursor, calMode === "week" ? -7 : -1))} className="rounded-lg border border-gray-200 p-1.5 dark:border-gray-700"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => setCursor(calMode === "month" ? addMonths(cursor, 1) : addDays(cursor, calMode === "week" ? 7 : 1))} className="rounded-lg border border-gray-200 p-1.5 dark:border-gray-700"><ChevronRight className="h-4 w-4" /></button>
                </div>
              }
            />
            <div className="p-4">
              {calMode === "month" && <MonthGrid cursor={cursor} appts={appts} onPick={(d) => { setCursor(d); setCalMode("day") }} />}
              {calMode === "week" && <WeekGrid cursor={cursor} appts={appts} onSelect={setSelected} onSlot={openNew} />}
              {calMode === "day" && <DayView cursor={cursor} appts={appts} onSelect={setSelected} />}
            </div>
          </Card>

          {/* Today panel */}
          <Card>
            <CardHeader title={`Today · ${format(new Date(), "dd MMM")}`} />
            <div className="space-y-2 p-4">
              <TodayProgress items={today.data ?? []} />
              {(today.data ?? []).length === 0 ? (
                <EmptyState title="Nothing today" />
              ) : (
                (today.data ?? []).map((a) => (
                  <button key={a.id} onClick={() => setSelected(a)} className="flex w-full items-center gap-2 rounded-lg border border-gray-100 p-2 text-left hover:bg-brand-50 dark:border-gray-700">
                    <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs font-semibold text-brand-700 tabular">{a.appointment_time}</span>
                    <span className="flex-1 truncate text-sm">{a.patient_name}</span>
                    <AppointmentStatusBadge status={a.status} />
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      <AppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} presetDate={preset.date} presetTime={preset.time} />
      <AppointmentDrawer appointment={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function TodayProgress({ items }: { items: Appointment[] }) {
  const total = items.length
  const done = items.filter((a) => a.status === "completed").length
  const pct = total ? Math.round((done / total) * 100) : 0
  const barStyle = { width: `${pct}%` }
  return (
    <div className="mb-2">
      <p className="mb-1 text-xs text-ink-secondary">{done} of {total} completed</p>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={barStyle} />
      </div>
    </div>
  )
}

function MonthGrid({ cursor, appts, onPick }: { cursor: Date; appts: Appointment[]; onPick: (d: Date) => void }) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })
  const counts = (d: Date) => appts.filter((a) => isSameDay(new Date(a.appointment_date), d)).length
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-ink-muted">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const n = counts(d)
          const isToday = isSameDay(d, new Date())
          return (
            <button
              key={d.toISOString()}
              onClick={() => onPick(d)}
              className={cn(
                "flex min-h-[72px] flex-col rounded-lg border border-gray-100 p-1.5 text-left transition-colors hover:border-brand-300 dark:border-gray-700",
                !isSameMonth(d, cursor) && "opacity-40",
                isToday && "border-brand-400 bg-brand-50"
              )}
            >
              <span className="text-xs font-medium">{format(d, "d")}</span>
              {n > 0 && <span className="mt-auto inline-flex w-fit rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">{n} appt</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function WeekGrid({ cursor, appts, onSelect, onSlot }: { cursor: Date; appts: Appointment[]; onSelect: (a: Appointment) => void; onSlot: (date?: string, time?: string) => void }) {
  const start = startOfWeek(cursor, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const hours = Array.from({ length: 13 }, (_, i) => 8 + i)
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[760px]" style={weekCols}>
        <div />
        {days.map((d) => <div key={d.toISOString()} className="pb-2 text-center text-xs font-semibold">{format(d, "EEE dd")}</div>)}
        {hours.map((h) => (
          <div key={h} className="contents">
            <div className="border-t border-gray-100 py-3 pr-2 text-right text-[11px] text-ink-muted dark:border-gray-700">{String(h).padStart(2, "0")}:00</div>
            {days.map((d) => {
              const slotAppts = appts.filter((a) => isSameDay(new Date(a.appointment_date), d) && Number((a.appointment_time ?? "").split(":")[0]) === h)
              return (
                <div key={d.toISOString() + h} onClick={() => onSlot(format(d, "yyyy-MM-dd"), `${String(h).padStart(2, "0")}:00`)} className="min-h-[44px] cursor-pointer border-t border-gray-100 p-0.5 hover:bg-brand-50 dark:border-gray-700">
                  {slotAppts.map((a) => (
                    <button key={a.id} onClick={(e) => { e.stopPropagation(); onSelect(a) }} className="mb-0.5 block w-full truncate rounded bg-brand-100 px-1 py-0.5 text-left text-[10px] font-medium text-brand-800">
                      {a.appointment_time} {a.patient_name}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function DayView({ cursor, appts, onSelect }: { cursor: Date; appts: Appointment[]; onSelect: (a: Appointment) => void }) {
  const dayAppts = appts.filter((a) => isSameDay(new Date(a.appointment_date), cursor)).sort((a, b) => (a.appointment_time ?? "").localeCompare(b.appointment_time ?? ""))
  if (!dayAppts.length) return <EmptyState title="No appointments" description={format(cursor, "dd MMM yyyy")} />
  return (
    <ol className="space-y-2">
      {dayAppts.map((a) => (
        <li key={a.id}>
          <button onClick={() => onSelect(a)} className="flex w-full items-center gap-3 rounded-lg border border-gray-100 p-3 text-left hover:bg-brand-50 dark:border-gray-700">
            <span className="rounded-md bg-brand-50 px-2 py-1 text-sm font-semibold text-brand-700 tabular">{a.appointment_time}</span>
            <div className="flex-1">
              <p className="font-medium">{a.patient_name}</p>
              <p className="text-xs text-ink-secondary">{a.duration} min · <span className="capitalize">{a.type}</span></p>
            </div>
            <AppointmentStatusBadge status={a.status} />
          </button>
        </li>
      ))}
    </ol>
  )
}

const weekCols = { gridTemplateColumns: "60px repeat(7, 1fr)" }
function tabBtn(active: boolean) {
  return active ? "rounded-md bg-brand-100 p-1.5 text-brand-700" : "rounded-md p-1.5 text-gray-400"
}
