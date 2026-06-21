import { formatCurrency } from "@/lib/utils"

interface TooltipPayload {
  name: string
  value: number
  color: string
  dataKey?: string
}

export function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  currency?: boolean
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      {label && <p className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-200">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={dotStyle(p.color)} />
          <span className="text-ink-secondary capitalize">{p.name}:</span>
          <span className="font-semibold tabular">
            {currency ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function dotStyle(color: string) {
  return { backgroundColor: color }
}
