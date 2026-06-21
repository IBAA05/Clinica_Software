import { api } from "@/lib/axios"
import type { ApiEnvelope, Visit, Prescription } from "@/types"

export interface VisitListParams {
  page?: number
  limit?: number
  patient_id?: string
  date_from?: string
  date_to?: string
  diagnosis_code?: string
}

export async function listVisits(params: VisitListParams) {
  const { data } = await api.get<ApiEnvelope<Visit[]>>("/visits", { params })
  return { items: data.data, pagination: data.pagination }
}

export async function getVisit(id: string) {
  const { data } = await api.get<ApiEnvelope<Visit>>(`/visits/${id}`)
  return data.data
}

export async function createVisit(payload: Partial<Visit>) {
  const { data } = await api.post<ApiEnvelope<Visit>>("/visits", payload)
  return data.data
}

export async function updateVisit(id: string, payload: Partial<Visit>) {
  const { data } = await api.put<ApiEnvelope<Visit>>(`/visits/${id}`, payload)
  return data.data
}

export async function deleteVisit(id: string) {
  await api.delete(`/visits/${id}`)
}

export async function listPrescriptions(visitId: string) {
  const { data } = await api.get<ApiEnvelope<Prescription[]>>(`/visits/${visitId}/prescriptions`)
  return data.data
}

export async function addPrescription(visitId: string, payload: Partial<Prescription>) {
  const { data } = await api.post<ApiEnvelope<Prescription>>(`/visits/${visitId}/prescriptions`, payload)
  return data.data
}

export async function updatePrescription(visitId: string, pid: string, payload: Partial<Prescription>) {
  const { data } = await api.put<ApiEnvelope<Prescription>>(`/visits/${visitId}/prescriptions/${pid}`, payload)
  return data.data
}

export async function deletePrescription(visitId: string, pid: string) {
  await api.delete(`/visits/${visitId}/prescriptions/${pid}`)
}
