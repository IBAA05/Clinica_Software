import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { fadeIn } from "@/lib/motion"

export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 440,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
  width?: number
  footer?: React.ReactNode
}) {
  const panelStyle = { width }
  const slide = {
    initial: { x: width },
    animate: { x: 0 },
    exit: { x: width },
    transition: { type: "spring" as const, damping: 30, stiffness: 300 },
  }
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/30"
            {...fadeIn}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full flex-col bg-white shadow-xl dark:bg-gray-800"
            style={panelStyle}
            {...slide}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700">{footer}</div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
