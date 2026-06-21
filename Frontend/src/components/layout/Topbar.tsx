import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Search, Moon, Sun, ChevronDown, User, KeyRound, LogOut } from "lucide-react"
import { Avatar } from "@/components/ui/Avatar"
import { NotificationBell } from "./NotificationBell"
import { useAuthStore } from "@/stores/authStore"
import { useThemeStore } from "@/stores/themeStore"
import { logout as apiLogout } from "@/api/auth"
import { tokenStore } from "@/stores/authStore"

const dropAnim = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export function Topbar({
  title,
  onOpenSearch,
}: {
  title: string
  onOpenSearch: () => void
}) {
  const user = useAuthStore((s) => s.user)
  const doLogout = useAuthStore((s) => s.logout)
  const { theme, toggle } = useThemeStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      const refresh = tokenStore.getRefresh()
      if (refresh) await apiLogout(refresh)
    } catch {
      /* ignore */
    }
    doLogout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-100 bg-white/80 px-6 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
      <h1 className="font-heading text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>

      <button
        onClick={onOpenSearch}
        className="mx-auto flex w-full max-w-md items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400 hover:border-brand-300 dark:border-gray-700"
      >
        <Search className="h-4 w-4" />
        <span>Search patients, appointments...</span>
        <kbd className="ml-auto rounded border border-gray-200 px-1.5 py-0.5 text-[10px] dark:border-gray-600">⌘K</kbd>
      </button>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <button
          onClick={toggle}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Avatar name={user?.name} src={user?.avatar_url} size={32} />
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <motion.div
                  {...dropAnim}
                  className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    <p className="text-xs text-ink-secondary">{user?.email}</p>
                  </div>
                  <MenuItem icon={<User className="h-4 w-4" />} label="Profile" onClick={() => { setMenuOpen(false); navigate("/doctor") }} />
                  <MenuItem icon={<KeyRound className="h-4 w-4" />} label="Change Password" onClick={() => { setMenuOpen(false); navigate("/settings") }} />
                  <MenuItem
                    icon={theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    label="Dark Mode"
                    onClick={toggle}
                  />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
    >
      {icon}
      {label}
    </button>
  )
}
