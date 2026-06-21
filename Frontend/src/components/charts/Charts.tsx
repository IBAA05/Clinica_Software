import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { CHART, SERVICE_COLORS } from "@/lib/colors"
import { ChartTooltip } from "./ChartTooltip"
import { formatCurrency } from "@/lib/utils"

const axisProps = { stroke: "#9CA3AF", fontSize: 12, tickLine: false, axisLine: false }
const gridProps = { strokeDasharray: "3 3", stroke: "#F3F4F6", vertical: false }
const areaMargin = { top: 10, right: 16, left: 0, bottom: 0 }

export interface TrendDatum {
  month: string
  patients?: number
  appointments?: number
  revenue?: number
  expenses?: number
  net_income?: number
  total?: number
  completed?: number
  cancelled?: number
  count?: number
}

/* Patient + Appointment composed chart (area + line) */
export function TrendsChart({ data }: { data: TrendDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={areaMargin}>
        <defs>
          <linearGradient id="gPatients" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="patients"
          name="New Patients"
          stroke={CHART.primary}
          fill="url(#gPatients)"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="appointments"
          name="Appointments"
          stroke={CHART.secondary}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/* Revenue vs Expenses composed chart */
export function RevenueExpenseChart({ data }: { data: TrendDatum[] }) {
  const tip = <ChartTooltip currency />
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={areaMargin}>
        <defs>
          <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => formatCurrency(v)} width={80} />
        <Tooltip content={tip} />
        <Legend />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke={CHART.primary}
          fill="url(#gRevenue)"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          name="Expenses"
          stroke={CHART.danger}
          strokeDasharray="5 5"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export interface DonutDatum {
  name: string
  value: number
}

/* Donut chart with center total */
export function DonutChart({
  data,
  centerLabel,
  centerValue,
  currency = true,
  height = 280,
}: {
  data: DonutDatum[]
  centerLabel?: string
  centerValue?: string
  currency?: boolean
  height?: number
}) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-ink-secondary">{centerLabel}</span>
          <span className="font-heading text-lg font-bold tabular">{centerValue}</span>
        </div>
      )}
    </div>
  )
}

/* Donut legend list */
export function DonutLegend({
  data,
  currency = true,
}: {
  data: DonutDatum[]
  currency?: boolean
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  return (
    <ul className="mt-2 space-y-2">
      {data.map((d, i) => {
        const dot = { backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length] }
        return (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={dot} />
              <span className="capitalize text-ink-secondary">{d.name}</span>
            </span>
            <span className="tabular font-medium">
              {currency ? formatCurrency(d.value) : d.value}{" "}
              <span className="text-ink-muted">({Math.round((d.value / total) * 100)}%)</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/* Grouped bar chart */
export function GroupedBarChart({
  data,
  bars,
  height = 300,
}: {
  data: any[]
  bars: { key: string; name: string; color: string }[]
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={areaMargin} barGap={4}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={cursorFill} />
        <Legend />
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={barRadius} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

const cursorFill = { fill: "rgba(16,185,129,0.06)" }
const barRadius: [number, number, number, number] = [4, 4, 0, 0]

/* Horizontal bar chart */
export function HorizontalBarChart({
  data,
  height = 280,
  color = CHART.primary,
}: {
  data: { label: string; value: number }[]
  height?: number
  color?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={areaMargin}>
        <CartesianGrid {...gridProps} horizontal={false} />
        <XAxis type="number" {...axisProps} allowDecimals={false} />
        <YAxis type="category" dataKey="label" {...axisProps} width={120} />
        <Tooltip content={<ChartTooltip />} cursor={cursorFill} />
        <Bar dataKey="value" fill={color} radius={hBarRadius} />
      </BarChart>
    </ResponsiveContainer>
  )
}

const hBarRadius: [number, number, number, number] = [0, 4, 4, 0]
