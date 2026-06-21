import { create } from "zustand"
import type { AuthUser } from "@/types"

const ACCESS_KEY = "clinica_access"
const REFRESH_KEY = "clinica_refresh"
const USER_KEY = "clinica_user"

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setSession: (p: { user: AuthUser; access: string; refresh: string }) => void
  setAccessToken: (token: string) => void
  logout: () => void
  hasRole: (roles: string[]) => boolean
}

function readUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

const initialAccess = localStorage.getItem(ACCESS_KEY)
const initialRefresh = localStorage.getItem(REFRESH_KEY)
const initialUser = readUser()

export const useAuthStore = create<AuthState>((set, get) => ({
  // access_token kept in memory but mirrored to storage so refresh on reload works
  user: initialUser,
  accessToken: initialAccess,
  refreshToken: initialRefresh,
  isAuthenticated: Boolean(initialAccess && initialUser),

  setSession: ({ user, access, refresh }) => {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true })
  },

  setAccessToken: (token) => {
    localStorage.setItem(ACCESS_KEY, token)
    set({ accessToken: token })
  },

  logout: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
  },

  hasRole: (roles) => {
    const u = get().user
    return Boolean(u && roles.includes(u.role))
  },
}))

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
}
