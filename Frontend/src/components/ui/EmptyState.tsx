import { Inbox } from "lucide-react"

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h4 className="font-heading font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
