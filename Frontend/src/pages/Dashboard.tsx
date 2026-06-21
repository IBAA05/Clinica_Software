import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Users, CalendarDays, DollarSign, FileText, Plus, AlertTriangle } from "lucide-react"
import { dashboardApi } from "@/api/misc"
import { getToday } from "@/api/appointments"
import { getOverdue } from "@/api/invoices"
import { useAuthStore } from "@/stores/authStore"
import { STALE } from "@/lib/queryClient"
import { Card, CardHeader } from "@/components/ui/Card"
import { StatCard } from "@/components/StatCard"
import { Button } from "@/components/ui/Button"
import { Badge, AppointmentStatusBadge, TypeBadge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { SkeletonCards } from "@/components/ui/Skeleton"
import { TrendsChart, DonutChart, DonutLegend, GroupedBarChart } from "@/components/charts/Charts"
import { formatCurrency, formatDate, formatTime } from "@/lib/utils"
import { CHART } from "@/lib/colors"

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const isDoctor = user?.role === "doctor"

  const stats = useQuery({ queryKey: ["dash", "stats"], queryFn: dashboardApi.stats, staleTime: STALE.dashboard })
  const apptTrend = useQuery({ queryKey: ["dash", "apptTrend"], queryFn: dashboardApi.appointmentTrend })
  const patientTrend = useQuery({ queryKey: ["dash", "patientTrend"], queryFn: dashboardApi.patientTrend })
  const revByService = useQuery({
    queryKey: ["dash", "revByService"],
    queryFn: dashboardApi.revenueByService,
    enabled: isDoctor,
  })
  const today = useQuery({ queryKey: ["dash", "today"], queryFn: getToday, staleTime: STALE.today })
  const recent = useQuery({ queryKey: ["dash", "recent"], queryFn: dashboardApi.recentRecords, enabled: isDoctor })
  const overdue = useQuery({ queryKey: ["dash", "overdue"], queryFn: getOverdue })

  const trends = mergeTrends(patientTrend.data, apptTrend.data)
  const weekly = buildWeekly(apptTrend.data)
  const donut = (revByService.data ?? []).map((d: any) => ({ name: d.service_type ?? d.name, value: Number(d.amount ?? d.value ?? 0) }))
  const donutTotal = donut.reduce((s: number, d: any) => s + d.value, 0)

  return (
    <div className="space-y-6">
      {/* Row 1 - stat cards */}
      {stats.isLoading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Patients"
            value={stats.data?.total_patients ?? 0}
            icon={<Users className="h-5 w-5" />}
            trend={stats.data?.total_patients_change}
            subtitle="vs last month"
          />
          <StatCard
            title="Today's Appointments"
            value={stats.data?.appointments_today ?? 0}
            icon={<CalendarDays className="h-5 w-5" />}
            trend={stats.data?.appointments_today_change}
            subtitle="vs yesterday"
          />
          {isDoctor && (
            <StatCard
              title="Monthly Revenue"
              value={stats.data?.monthly_revenue ?? 0}
              icon={<DollarSign className="h-5 w-5" />}
              trend={stats.data?.monthly_revenue_change}
              format={formatCurrency}
              subtitle="vs last month"
            />
          )}
          <StatCard
            title="Pending Invoices"
            value={stats.data?.pending_invoices_count ?? 0}
            icon={<FileText className="h-5 w-5" />}
            subtitle={formatCurrency(stats.data?.pending_invoices_amount ?? 0) + " pending"}
          />
        </div>
      )}

      {/* Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader title="Patient & Appointment Trends" subtitle="This Year" />
          <div className="p-3">
            <TrendsChart data={trends} />
          </div>
        </Card>
        {isDoctor && (
          <Card className="lg:col-span-4">
            <CardHeader title="Revenue by Service" />
            <div className="p-4">
              <DonutChart data={donut} centerLabel="Total Revenue" centerValue={formatCurrency(donutTotal)} />
              <DonutLegend data={donut} />
            </div>
          </Card>
        )}
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader
            title="Today's Schedule"
            action={<Badge className="bg-brand-100 text-brand-700">{today.data?.length ?? 0} total</Badge>}
          />
          <div className="max-h-80 space-y-2 overflow-y-auto p-4">
            {(today.data ?? []).length === 0 ? (
              <EmptyState title="No appointments today" description="Enjoy the calm — nothing scheduled." />
            ) : (
              (today.data ?? []).map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-2.5 dark:border-gray-700">
                  <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 tabular">
                    {formatTime(a.appointment_time)}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium">{a.patient_name}</span>
                  <TypeBadge type={a.type} />
                  <AppointmentStatusBadge status={a.status} />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader title="Weekly Appointment Overview" />
          <div className="p-3">
            <GroupedBarChart
              data={weekly}
              bars={[
                { key: "completed", name: "Completed", color: CHART.primary },
                { key: "cancelled", name: "Cancelled", color: CHART.dangerLight },
              ]}
            />
          </div>
        </Card>
      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader
            title={isDoctor ? "Recent Visit Records" : "Recent Appointments"}
            action={<Link to={isDoctor ? "/visits" : "/appointments"} className="text-sm font-medium text-brand-600 hover:underline">View All</Link>}
          />
          <div className="p-4">
            {isDoctor ? (
              (recent.data ?? []).length === 0 ? (
                <EmptyState title="No recent records" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-ink-muted">
                      <th className="pb-2">Patient</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Diagnosis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recent.data ?? []).map((r: any, i: number) => (
                      <tr key={i} className="border-t border-gray-50 hover:bg-brand-50 dark:border-gray-700">
                        <td className="py-2 font-medium">{r.patient_name}</td>
                        <td className="py-2 text-ink-secondary">{formatDate(r.date)}</td>
                        <td className="py-2 text-ink-secondary">{r.diagnosis_summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              <EmptyState title="Recent appointments" description="Visit records are restricted to doctors." />
            )}
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader title="Quick Actions" />
          <div className="space-y-3 p-4">
            <div className="grid grid-cols-1 gap-2">
              <Link to="/patients"><Button variant="secondary" className="w-full justify-start"><Plus className="h-4 w-4" /> New Patient</Button></Link>
              <Link to="/appointments"><Button variant="secondary" className="w-full justify-start"><Plus className="h-4 w-4" /> New Appointment</Button></Link>
              <Link to="/billing"><Button variant="secondary" className="w-full justify-start"><Plus className="h-4 w-4" /> New Invoice</Button></Link>
            </div>
            {(overdue.data ?? []).length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-700">
                  <AlertTriangle className="h-4 w-4" /> Overdue Invoices
                </p>
                <ul className="space-y-1">
                  {(overdue.data ?? []).slice(0, 4).map((inv) => (
                    <li key={inv.id} className="flex justify-between text-sm text-red-700">
                      <span>{inv.patient_name ?? inv.invoice_ref}</span>
                      <span className="tabular font-medium">{formatCurrency(inv.balance)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function mergeTrends(patients?: any[], appts?: any[]) {
  const map = new Map<string, any>()
  ;(patients ?? []).forEach((p) => map.set(p.month, { month: p.month, patients: p.count ?? p.patients ?? 0 }))
  ;(appts ?? []).forEach((a) => {
    const existing = map.get(a.month) ?? { month: a.month }
    existing.appointments = a.total ?? a.appointments ?? 0
    map.set(a.month, existing)
  })
  return Array.from(map.values())
}

function buildWeekly(appts?: any[]) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  return days.map((d) => ({ label: d, completed: 0, cancelled: 0 }))
}
