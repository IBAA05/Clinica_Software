import { Navigate, useLocation } from "react-router-dom"
import { useEffect } from "react"
import toast from "react-hot-toast"
import { useAuthStore } from "@/stores/authStore"
import type { Role } from "@/types"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={fromState(location.pathname)} />
  }
  return <>{children}</>
}

function fromState(path: string) {
  return { from: path }
}

export function RequireRole({
  roles,
  children,
}: {
  roles: Role[]
  children: React.ReactNode
}) {
  const user = useAuthStore((s) => s.user)
  const allowed = user && roles.includes(user.role)
  useEffect(() => {
    if (!allowed) toast.error("Access restricted to doctor only")
  }, [allowed])
  if (!allowed) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
