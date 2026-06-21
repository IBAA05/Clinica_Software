import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { fadeIn, modalPop } from "@/lib/motion"

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  maxWidth?: string
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          {...fadeIn}
          onClick={onClose}
        >
          <motion.div
            className={cn("w-full rounded-2xl bg-white shadow-xl dark:bg-gray-800", maxWidth)}
            {...modalPop}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                <h2 className="font-heading text-lg font-bold">{title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="px-5 py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
