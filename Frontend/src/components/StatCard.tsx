import { motion } from "framer-motion"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card } from "./ui/Card"
import { CountUp } from "./ui/CountUp"
import { cardMount } from "@/lib/motion"
import { cn } from "@/lib/utils"

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  format,
  subtitle,
}: {
  title: string
  value: number
  icon: React.ReactNode
  trend?: number
  trendLabel?: string
  format?: (n: number) => string
  subtitle?: string
}) {
  const up = (trend ?? 0) >= 0
  return (
    <motion.div {...cardMount}>
      <Card topAccent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            {icon}
          </div>
          {typeof trend === "number" && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                up ? "bg-brand-50 text-brand-600" : "bg-red-50 text-red-600"
              )}
            >
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="mt-4 text-sm text-ink-secondary">{title}</p>
        <p className="mt-1 font-heading text-2xl font-bold text-gray-900 dark:text-gray-100">
          <CountUp value={value} format={format} />
        </p>
        {(subtitle || trendLabel) && (
          <p className="mt-1 text-xs text-ink-muted">{subtitle ?? trendLabel}</p>
        )}
      </Card>
    </motion.div>
  )
}
