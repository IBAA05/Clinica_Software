import { api } from "@/lib/axios"
import type { ApiEnvelope, AuthUser, LoginResponse } from "@/types"

export async function login(username: string, password: string) {
  const { data } = await api.post<ApiEnvelope<LoginResponse> | LoginResponse>("/auth/login", {
    username,
    password,
  })
  // Support both enveloped and raw responses
  const payload = (data as ApiEnvelope<LoginResponse>).data ?? (data as LoginResponse)
  return payload
}

export async function logout(refresh_token: string) {
  await api.post("/auth/logout", { refresh_token })
}

export async function getMe() {
  const { data } = await api.get<ApiEnvelope<AuthUser>>("/auth/me")
  return data.data
}

export async function updateMe(payload: { full_name?: string; email?: string; avatar_url?: string }) {
  const { data } = await api.put<ApiEnvelope<AuthUser>>("/auth/me", payload)
  return data.data
}

export async function changePassword(current_password: string, new_password: string) {
  await api.put("/auth/me/password", { current_password, new_password })
}
