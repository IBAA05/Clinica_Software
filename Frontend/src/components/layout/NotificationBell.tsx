import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { Bell } from "lucide-react"
import { notificationsApi } from "@/api/misc"
import { formatDateTime } from "@/lib/utils"
import { EmptyState } from "@/components/ui/EmptyState"

const dropAnim = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: notificationsApi.unread,
    refetchInterval: 60000,
  })
  const items = data ?? []
  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  })

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Bell className="h-5 w-5" />
        {items.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {items.length}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              {...dropAnim}
              className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                <p className="font-heading font-bold">Notifications</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                  <EmptyState title="All caught up" description="No new notifications." />
                ) : (
                  items.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markRead.mutate(n.id)}
                      className="flex w-full flex-col items-start border-b border-gray-50 px-4 py-3 text-left hover:bg-brand-50 dark:border-gray-700/50 dark:hover:bg-gray-700"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.subject}</span>
                      <span className="mt-0.5 line-clamp-2 text-xs text-ink-secondary">{n.body}</span>
                      <span className="mt-1 text-[11px] text-ink-muted">{formatDateTime(n.sent_at)}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
