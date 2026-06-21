import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { CommandPalette } from "./CommandPalette"
import { pageTransition } from "@/lib/motion"

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/patients": "Patients",
  "/appointments": "Appointments",
  "/visits": "Visits & Records",
  "/billing": "Billing & Invoices",
  "/reports": "Reports & Analytics",
  "/doctor": "Doctor Profile",
  "/settings": "Settings",
  "/support": "Support",
}

function titleFor(path: string): string {
  if (path.startsWith("/patients/")) return "Patient Profile"
  if (path.startsWith("/visits/")) return "Visit Record"
  const key = Object.keys(TITLES).find((k) => path === k || path.startsWith(k + "/"))
  return key ? TITLES[key] : "Clinica"
}

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
      if (e.key === "Escape") setSearchOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const marginLeft = { marginLeft: collapsed ? 72 : 260 }

  return (
    <div className="min-h-screen bg-[#F8FAFB] dark:bg-gray-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="transition-all duration-200" style={marginLeft}>
        <Topbar title={titleFor(location.pathname)} onOpenSearch={() => setSearchOpen(true)} />
        <main className="min-h-[calc(100vh-4rem)] p-6">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} {...pageTransition}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
