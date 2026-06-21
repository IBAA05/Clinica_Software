import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { createColumnHelper } from "@tanstack/react-table"
import { Search, Plus, LayoutGrid, List, Eye, Pencil, CalendarPlus, Receipt, Phone, Mail, Users, UserCheck, UserX, UserPlus, ShieldCheck } from "lucide-react"
import { listPatients } from "@/api/patients"
import { useDebounce } from "@/hooks/useDebounce"
import { STALE } from "@/lib/queryClient"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Avatar } from "@/components/ui/Avatar"
import { Badge, BloodTypeBadge, StatusBadge } from "@/components/ui/Badge"
import { DataTable } from "@/components/ui/DataTable"
import { SkeletonCards } from "@/components/ui/Skeleton"
import { PatientFormDrawer } from "@/components/PatientFormDrawer"
import { formatDate, calcAge } from "@/lib/utils"
import type { Patient } from "@/types"

const col = createColumnHelper<Patient>()

export default function Patients() {
  const [search, setSearch] = useState("")
  const [gender, setGender] = useState("")
  const [bloodType, setBloodType] = useState("")
  const [status, setStatus] = useState("")
  const [view, setView] = useState<"card" | "table">("card")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)
  const navigate = useNavigate()
  const term = useDebounce(search, 300)

  const filters = { search: term, gender, blood_type: bloodType, status }
  const { data, isLoading } = useQuery({
    queryKey: ["patients", filters],
    queryFn: () => listPatients(filters),
    staleTime: STALE.patients,
  })
  const patients = data?.patients ?? []
  const stats = data?.stats

  function openNew() {
    setEditing(null)
    setDrawerOpen(true)
  }
  function openEdit(p: Patient) {
    setEditing(p)
    setDrawerOpen(true)
  }

  const columns = useMemo(
    () => [
      col.accessor("full_name", {
        header: "Name",
        cell: (c) => (
          <div className="flex items-center gap-2">
            <Avatar name={c.getValue()} size={32} />
            <span className="font-medium">{c.getValue()}</span>
          </div>
        ),
      }),
      col.accessor("date_of_birth", { header: "Age", cell: (c) => `${calcAge(c.getValue())} yrs` }),
      col.accessor("gender", { header: "Gender", cell: (c) => <span className="capitalize">{c.getValue()}</span> }),
      col.accessor("phone", { header: "Phone" }),
      col.accessor("blood_type", { header: "Blood", cell: (c) => <BloodTypeBadge type={c.getValue()} /> }),
      col.accessor("last_visit", { header: "Last Visit", cell: (c) => (c.getValue() ? formatDate(c.getValue()!) : "—") }),
      col.accessor("is_active", { header: "Status", cell: (c) => <StatusBadge active={c.getValue()} /> }),
      col.display({
        id: "actions",
        header: "Actions",
        cell: (c) => (
          <div className="flex gap-1">
            <IconBtn title="View" onClick={() => navigate(`/patients/${c.row.original.id}`)}><Eye className="h-4 w-4" /></IconBtn>
            <IconBtn title="Edit" onClick={() => openEdit(c.row.original)}><Pencil className="h-4 w-4" /></IconBtn>
            <IconBtn title="Appointment" onClick={() => navigate("/appointments")}><CalendarPlus className="h-4 w-4" /></IconBtn>
            <IconBtn title="Invoice" onClick={() => navigate("/billing")}><Receipt className="h-4 w-4" /></IconBtn>
          </div>
        ),
      }),
    ],
    [navigate]
  )

  return (
    <div className="space-y-6">
      {/* Stat bar */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MiniStat icon={<Users className="h-4 w-4" />} label="Total" value={stats?.total ?? 0} />
        <MiniStat icon={<UserCheck className="h-4 w-4" />} label="Active" value={stats?.active ?? 0} />
        <MiniStat icon={<UserX className="h-4 w-4" />} label="Inactive" value={stats?.inactive ?? 0} />
        <MiniStat icon={<UserPlus className="h-4 w-4" />} label="New This Month" value={stats?.new_this_month ?? 0} />
        <MiniStat icon={<ShieldCheck className="h-4 w-4" />} label="With Insurance" value={stats?.with_insurance ?? 0} />
      </div>

      {/* Top bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, national ID..."
              className="input pl-9"
            />
          </div>
          <select className="input w-auto" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <select className="input w-auto" value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
            <option value="">All Blood Types</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
            <button onClick={() => setView("card")} className={viewBtn(view === "card")}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setView("table")} className={viewBtn(view === "table")}><List className="h-4 w-4" /></button>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4" /> Register Patient</Button>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <SkeletonCards count={6} />
      ) : view === "card" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {patients.map((p) => (
            <PatientCard key={p.id} p={p} onView={() => navigate(`/patients/${p.id}`)} onEdit={() => openEdit(p)} />
          ))}
        </div>
      ) : (
        <Card className="p-2">
          <DataTable columns={columns} data={patients} emptyTitle="No patients found" />
        </Card>
      )}

      <PatientFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} patient={editing} />
    </div>
  )
}

function PatientCard({ p, onView, onEdit }: { p: Patient; onView: () => void; onEdit: () => void }) {
  const conditions = p.chronic_conditions ?? []
  return (
    <Card className="p-5 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-cardhover">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={p.full_name} size={48} />
          <div>
            <p className="font-heading font-bold text-gray-900 dark:text-gray-100">{p.full_name}</p>
            <span className="text-xs text-ink-secondary">{calcAge(p.date_of_birth)} yrs · <span className="capitalize">{p.gender}</span></span>
          </div>
        </div>
        <BloodTypeBadge type={p.blood_type} />
      </div>
      <div className="mt-3 space-y-1 text-sm text-ink-secondary">
        <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {p.phone}</p>
        {p.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {p.email}</p>}
      </div>
      {p.last_visit && <p className="mt-2 text-xs text-ink-muted">Last seen: {formatDate(p.last_visit)}</p>}
      {conditions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {conditions.slice(0, 3).map((c) => (
            <Badge key={c} className="bg-brand-100 text-brand-700">{c}</Badge>
          ))}
          {conditions.length > 3 && <Badge className="bg-gray-100 text-gray-500">+{conditions.length - 3} more</Badge>}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
        <StatusBadge active={p.is_active} />
        <div className="flex gap-1">
          <IconBtn title="View" onClick={onView}><Eye className="h-4 w-4" /></IconBtn>
          <IconBtn title="Edit" onClick={onEdit}><Pencil className="h-4 w-4" /></IconBtn>
          <Link to="/appointments"><IconBtn title="Appointment"><CalendarPlus className="h-4 w-4" /></IconBtn></Link>
          <Link to="/billing"><IconBtn title="Invoice"><Receipt className="h-4 w-4" /></IconBtn></Link>
        </div>
      </div>
    </Card>
  )
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-600">{icon}</span>
      <div>
        <p className="font-heading text-xl font-bold tabular">{value}</p>
        <p className="text-xs text-ink-secondary">{label}</p>
      </div>
    </Card>
  )
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick?: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="rounded-lg p-1.5 text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-gray-700"
    >
      {children}
    </button>
  )
}

function viewBtn(active: boolean) {
  return active ? "rounded-md bg-brand-100 p-1.5 text-brand-700" : "rounded-md p-1.5 text-gray-400"
}
