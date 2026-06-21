import { cn } from "@/lib/utils"

export function Card({
  className,
  children,
  topAccent,
}: {
  className?: string
  children: React.ReactNode
  topAccent?: boolean
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-100 shadow-card dark:bg-gray-800 dark:border-gray-700",
        topAccent && "border-t-4 border-t-brand-500",
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  action,
  subtitle,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between px-5 pt-5">
      <div>
        <h3 className="font-heading font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        {subtitle && <p className="text-sm text-ink-secondary mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
