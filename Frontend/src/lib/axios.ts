/**
 * Axios instance pre-configured for the Clinica API.
 *
 * Exports:
 *   api         – Axios instance with baseURL, auth interceptors, and silent token refresh.
 *   apiMessage  – Extract a human-readable error message from an Axios/API error.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import { tokenStore } from "@/stores/authStore"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
})

/* ── Request: attach Bearer token ──────────────────────────────────── */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/* ── Response: attempt silent refresh on 401 ───────────────────────── */
let refreshPromise: Promise<string> | null = null

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Skip refresh for login / refresh endpoints themselves
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes("/auth/login") ||
      original.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error)
    }

    original._retry = true

    try {
      // Deduplicate concurrent refresh attempts
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const refresh = tokenStore.getRefresh()
          if (!refresh) throw new Error("No refresh token")
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refresh })
          const newAccess: string = data?.data?.access_token ?? data?.access_token
          if (!newAccess) throw new Error("Bad refresh response")
          // Persist through the auth store
          const { useAuthStore } = await import("@/stores/authStore")
          useAuthStore.getState().setAccessToken(newAccess)
          return newAccess
        })()
      }

      const token = await refreshPromise
      original.headers.Authorization = `Bearer ${token}`
      return api(original)
    } catch {
      // Refresh failed → force logout
      const { useAuthStore } = await import("@/stores/authStore")
      useAuthStore.getState().logout()
      window.location.href = "/login"
      return Promise.reject(error)
    } finally {
      refreshPromise = null
    }
  }
)

/* ── Error message helper ──────────────────────────────────────────── */
export function apiMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined
    if (data) {
      // Backend envelope format: { success, message, data }
      if (typeof data.message === "string" && data.message) return data.message
      if (typeof data.detail === "string" && data.detail) return data.detail
    }
    if (error.message) return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}
