import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FileDown, FileSpreadsheet } from "lucide-react"
import { reportsApi } from "@/api/misc"
import { STALE } from "@/lib/queryClient"
import { Card, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { RevenueExpenseChart, GroupedBarChart, DonutChart, DonutLegend, HorizontalBarChart, TrendsChart } from "@/components/charts/Charts"
import { GREEN_SCALE } from "@/lib/colors"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"

const PERIODS = [
  { id: "month", label: "This Month" },
  { id: "3months", label: "Last 3 Months" },
  { id: "year", label: "This Year" },
] as const

export default function Reports() {
  const [period, setPeriod] = useState<string>("year")
  const { data, isLoading } = useQuery({ queryKey: ["reports", period], queryFn: () => reportsApi.overview(period), staleTime: STALE.reports })

  if (isLoading) return <Skeleton className="h-96 w-full" />
  const r = data ?? ({} as any)
  const fin = r.financial ?? {}

  return (
    <div className="space-y-6 pb-24">
      {/* Period selector */}
      <div className="sticky top-16 z-10 flex flex-wrap gap-1 rounded-xl border border-gray-100 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
        {PERIODS.map((p) => (
          <button key={p.id} onClick={() => setPeriod(p.id)} className={cn("rounded-lg px-4 py-2 text-sm font-medium", period === p.id ? "bg-brand-500 text-white" : "text-ink-secondary hover:bg-brand-50")}>{p.label}</button>
        ))}
      </div>

      {/* Financial overview */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <FinCard label="Total Revenue" value={formatCurrency(fin.revenue ?? 0)} change={fin.revenue_change} />
        <FinCard label="Collected" value={formatCurrency(fin.collected ?? 0)} change={fin.collected_change} />
        <FinCard label="Pending" value={formatCurrency(fin.pending ?? 0)} change={fin.pending_change} />
        <FinCard label="Total Expenses" value={formatCurrency(fin.expenses ?? 0)} change={fin.expenses_change} />
        <FinCard label="Net Income" value={formatCurrency(fin.net_income ?? 0)} change={fin.net_change} danger={(fin.net_income ?? 0) < 0} />
      </div>

      {/* Revenue vs Expenses */}
      <Card>
        <CardHeader title="Revenue vs Expenses" />
        <div className="p-4">
          <RevenueExpenseChart data={r.revenue_expense ?? []} currency height={320} />
        </div>
      </Card>

      {/* Appointments + Revenue by service */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Appointments Summary" action={<Badge className="bg-brand-100 text-brand-700">{r.completion_rate ?? 0}% completion</Badge>} />
          <div className="p-4">
            <GroupedBarChart
              data={r.appointments_summary ?? []}
              bars={[{ key: "completed", name: "Completed", color: "#10B981" }, { key: "cancelled", name: "Cancelled", color: "#FCA5A5" }, { key: "no_show", name: "No-Show", color: "#9CA3AF" }]}
              height={280}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Revenue by Service" />
          <div className="p-4">
            <DonutChart data={r.revenue_by_service ?? []} centerLabel="Total" centerValue={formatCurrency((r.revenue_by_service ?? []).reduce((s: number, d: any) => s + d.value, 0))} height={240} />
            <DonutLegend data={r.revenue_by_service ?? []} currency />
          </div>
        </Card>
      </div>

      {/* Demographics */}
      <Card>
        <CardHeader title="Patient Demographics" />
        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
          <div>
            <p className="mb-2 text-center text-sm font-medium text-ink-secondary">Gender</p>
            <DonutChart data={r.gender_distribution ?? []} centerLabel="Total" centerValue={formatNumber((r.gender_distribution ?? []).reduce((s: number, d: any) => s + d.value, 0))} height={200} colors={["#0D9488", "#10B981", "#9CA3AF"]} />
          </div>
          <div>
            <p className="mb-2 text-center text-sm font-medium text-ink-secondary">Age Groups</p>
            <HorizontalBarChart data={r.age_groups ?? []} height={200} />
          </div>
          <div>
            <p className="mb-2 text-center text-sm font-medium text-ink-secondary">Blood Types</p>
            <HorizontalBarChart data={r.blood_types ?? []} height={200} />
          </div>
        </div>
      </Card>

      {/* Diagnosis + heatmap */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top 5 Diagnoses" />
          <div className="p-4">
            <HorizontalBarChart data={(r.top_diagnoses ?? []).map((d: any) => ({ label: `${d.code} · ${d.description}`, value: d.count }))} height={260} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Busiest Time Slots" />
          <div className="overflow-x-auto p-4">
            <Heatmap data={r.heatmap ?? []} />
          </div>
        </Card>
      </div>

      {/* Insurance + new patients */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Insurance vs Self-Pay" />
          <div className="p-4">
            <DonutChart data={r.insurance_split ?? []} centerLabel="Patients" centerValue={formatNumber((r.insurance_split ?? []).reduce((s: number, d: any) => s + d.value, 0))} height={220} colors={["#10B981", "#0D9488"]} />
            <DonutLegend data={r.insurance_split ?? []} />
          </div>
        </Card>
        <Card>
          <CardHeader title="New Patients per Month" />
          <div className="p-4">
            <TrendsChart data={r.new_patients ?? []} height={220} singleSeries />
          </div>
        </Card>
      </div>

      {/* Export bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-end gap-2 border-t border-gray-100 bg-white/90 px-6 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        <Button variant="secondary" onClick={() => window.print()}><FileDown className="h-4 w-4" /> Export PDF Report</Button>
        <Button variant="secondary"><FileSpreadsheet className="h-4 w-4" /> Export Excel</Button>
      </div>
    </div>
  )
}

function FinCard({ label, value, change, danger }: { label: string; value: string; change?: number; danger?: boolean }) {
  const up = (change ?? 0) >= 0
  return (
    <Card className="border-t-4 border-brand-500 p-4">
      <p className="text-xs text-ink-secondary">{label}</p>
      <p className={cn("mt-1 font-heading text-xl font-bold tabular", danger && "text-red-600")}>{value}</p>
      {change !== undefined && <p className={cn("mt-0.5 text-xs", up ? "text-brand-600" : "text-red-500")}>{up ? "↑" : "↓"} {Math.abs(change)}% vs prev</p>}
    </Card>
  )
}

function Heatmap({ data }: { data: { day: string; hour: number; count: number }[] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const hours = Array.from({ length: 11 }, (_, i) => 8 + i)
  const max = Math.max(1, ...data.map((d) => d.count))
  const get = (day: string, hour: number) => data.find((d) => d.day === day && d.hour === hour)?.count ?? 0
  function shade(count: number) {
    if (count === 0) return "#FFFFFF"
    const idx = Math.min(GREEN_SCALE.length - 1, Math.floor((count / max) * (GREEN_SCALE.length - 1)))
    return GREEN_SCALE[idx]
  }
  return (
    <table className="min-w-[520px] border-collapse text-center text-[11px]">
      <thead>
        <tr><th /> {hours.map((h) => <th key={h} className="px-1 py-0.5 text-ink-muted">{h}</th>)}</tr>
      </thead>
      <tbody>
        {days.map((day) => (
          <tr key={day}>
            <td className="pr-2 text-right font-medium text-ink-secondary">{day}</td>
            {hours.map((h) => {
              const count = get(day, h)
              const cellStyle = { backgroundColor: shade(count) }
              return <td key={h} title={`${count} appointments`} className="h-7 w-7 rounded border border-gray-100" style={cellStyle}>{count > 0 ? count : ""}</td>
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
