import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  Receipt,
  BarChart3,
  UserCog,
  Settings as SettingsIcon,
  LifeBuoy,
  ChevronLeft,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/Avatar"
import { useAuthStore } from "@/stores/authStore"
import type { Role } from "@/types"

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  roles?: Role[]
}
interface NavGroup {
  heading: string
  items: NavItem[]
  roles?: Role[]
}

const GROUPS: NavGroup[] = [
  {
    heading: "Main",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
      { to: "/patients", label: "Patients", icon: <Users className="h-5 w-5" /> },
      { to: "/appointments", label: "Appointments", icon: <CalendarDays className="h-5 w-5" /> },
    ],
  },
  {
    heading: "Clinical",
    roles: ["doctor"],
    items: [{ to: "/visits", label: "Visits & Records", icon: <Stethoscope className="h-5 w-5" /> }],
  },
  {
    heading: "Billing",
    items: [{ to: "/billing", label: "Billing & Invoices", icon: <Receipt className="h-5 w-5" /> }],
  },
  {
    heading: "Analytics",
    roles: ["doctor"],
    items: [{ to: "/reports", label: "Reports", icon: <BarChart3 className="h-5 w-5" /> }],
  },
  {
    heading: "Management",
    items: [
      { to: "/doctor", label: "Doctor Profile", icon: <UserCog className="h-5 w-5" /> },
      { to: "/settings", label: "Settings", icon: <SettingsIcon className="h-5 w-5" />, roles: ["doctor"] },
      { to: "/support", label: "Support", icon: <LifeBuoy className="h-5 w-5" /> },
    ],
  },
]

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const user = useAuthStore((s) => s.user)
  const role = user?.role
  const width = collapsed ? 72 : 260
  const style = { width }

  const visibleGroups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.roles || (role && i.roles.includes(role))),
  })).filter((g) => (!g.roles || (role && g.roles.includes(role))) && g.items.length > 0)

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-full flex-col border-r border-gray-100 bg-white transition-all duration-200 dark:border-gray-800 dark:bg-gray-900"
      style={style}
    >
      <div className="flex h-16 items-center gap-2 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white">
          <Plus className="h-5 w-5" />
        </div>
        {!collapsed && <span className="font-heading text-lg font-bold text-gray-900 dark:text-gray-100">Clinica</span>}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {visibleGroups.map((g) => (
          <div key={g.heading} className="mb-4">
            {!collapsed && (
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                {g.heading}
              </p>
            )}
            <ul className="space-y-1">
              {g.items.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className={navClass} title={item.label}>
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-3 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name} src={user?.avatar_url} size={36} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
              <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium capitalize text-brand-700">
                {user?.role}
              </span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
    isActive
      ? "border-l-4 border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20"
      : "text-gray-600 hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-gray-800"
  )
}
