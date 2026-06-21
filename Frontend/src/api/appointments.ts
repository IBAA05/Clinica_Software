import { api } from "@/lib/axios"
import type { ApiEnvelope, Appointment } from "@/types"

export interface AppointmentListParams {
  page?: number
  limit?: number
  status?: string
  type?: string
  date?: string
  date_from?: string
  date_to?: string
  patient_id?: string
  patient_name?: string
}

export async function listAppointments(params: AppointmentListParams) {
  const { data } = await api.get<ApiEnvelope<Appointment[]>>("/appointments", { params })
  return { items: data.data, pagination: data.pagination }
}

export async function getAppointment(id: string) {
  const { data } = await api.get<ApiEnvelope<Appointment>>(`/appointments/${id}`)
  return data.data
}

export async function createAppointment(payload: Partial<Appointment>) {
  const { data } = await api.post<ApiEnvelope<Appointment>>("/appointments", payload)
  return data.data
}

export async function updateAppointment(id: string, payload: Partial<Appointment>) {
  const { data } = await api.put<ApiEnvelope<Appointment>>(`/appointments/${id}`, payload)
  return data.data
}

export async function cancelAppointment(id: string, cancelled_reason?: string) {
  await api.delete(`/appointments/${id}`, { data: { cancelled_reason } })
}

export async function updateAppointmentStatus(id: string, status: string) {
  const { data } = await api.put<ApiEnvelope<Appointment>>(`/appointments/${id}/status`, { status })
  return data.data
}

export async function getToday() {
  const { data } = await api.get<ApiEnvelope<Appointment[]>>("/appointments/today")
  return data.data
}

export async function getUpcoming() {
  const { data } = await api.get<ApiEnvelope<Appointment[]>>("/appointments/upcoming")
  return data.data
}

export async function getCalendar(year: number, month: number) {
  const { data } = await api.get<ApiEnvelope<Record<string, Appointment[]>>>("/appointments/calendar", {
    params: { year, month },
  })
  return data.data
}

export async function getSlots(date: string) {
  const { data } = await api.get<ApiEnvelope<{ slot: string; available: boolean }[]>>(
    "/appointments/slots",
    { params: { date } }
  )
  return data.data
}
