import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { createColumnHelper } from "@tanstack/react-table"
import { Search, Eye, Pencil } from "lucide-react"
import { listVisits } from "@/api/visits"
import { useDebounce } from "@/hooks/useDebounce"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/DataTable"
import { formatDate } from "@/lib/utils"
import type { Visit } from "@/types"

const col = createColumnHelper<Visit>()

export default function Visits() {
  const [search, setSearch] = useState("")
  const term = useDebounce(search, 300)
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ["visits", term], queryFn: () => listVisits({ patient_name: term }) })
  const visits = data?.items ?? []

  const columns = useMemo(
    () => [
      col.accessor("patient_name", { header: "Patient", cell: (c) => <span className="font-medium">{c.getValue()}</span> }),
      col.accessor("visit_date", { header: "Visit Date", cell: (c) => formatDate(c.getValue()) }),
      col.accessor("diagnosis_summary", { header: "Diagnosis", cell: (c) => <span className="line-clamp-1">{c.getValue() ?? "—"}</span> }),
      col.accessor("prescription_count", { header: "Meds", cell: (c) => c.getValue() ?? 0 }),
      col.accessor("next_visit_date", { header: "Next Visit", cell: (c) => (c.getValue() ? formatDate(c.getValue()!) : "—") }),
      col.display({
        id: "actions",
        header: "Actions",
        cell: (c) => (
          <div className="flex gap-1">
            <button onClick={() => navigate(`/visits/${c.row.original.id}`)} className="rounded-lg p-1.5 text-gray-500 hover:bg-brand-50 hover:text-brand-600"><Eye className="h-4 w-4" /></button>
            <button onClick={() => navigate(`/visits/${c.row.original.id}`)} className="rounded-lg p-1.5 text-gray-500 hover:bg-brand-50 hover:text-brand-600"><Pencil className="h-4 w-4" /></button>
          </div>
        ),
      }),
    ],
    [navigate]
  )

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search patient..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => navigate("/appointments")}>Start from Appointment</Button>
        </div>
      </Card>
      <Card className="p-2">
        <DataTable columns={columns} data={visits} loading={isLoading} emptyTitle="No visit records" />
      </Card>
    </div>
  )
}
