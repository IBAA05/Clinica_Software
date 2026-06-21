import { api } from "@/lib/axios"
import type { ApiEnvelope, Patient, PatientStats, Appointment, Visit, Prescription, Invoice } from "@/types"

export interface PatientListParams {
  page?: number
  limit?: number
  search?: string
  gender?: string
  blood_type?: string
  status?: string
  has_insurance?: boolean
  age_min?: number
  age_max?: number
}

export interface PatientListResult {
  patients: Patient[]
  stats: PatientStats
  pagination?: ApiEnvelope<unknown>["pagination"]
}

export async function listPatients(params: PatientListParams): Promise<PatientListResult> {
  const { data } = await api.get<ApiEnvelope<{ patients: Patient[]; stats: PatientStats }>>(
    "/patients",
    { params }
  )
  return { ...data.data, pagination: data.pagination }
}

export async function getPatient(id: string) {
  const { data } = await api.get<ApiEnvelope<Patient>>(`/patients/${id}`)
  return data.data
}

export async function createPatient(payload: Partial<Patient>) {
  const { data } = await api.post<ApiEnvelope<Patient>>("/patients", payload)
  return data.data
}

export async function updatePatient(id: string, payload: Partial<Patient>) {
  const { data } = await api.put<ApiEnvelope<Patient>>(`/patients/${id}`, payload)
  return data.data
}

export async function deletePatient(id: string) {
  await api.delete(`/patients/${id}`)
}

export async function getPatientVisits(id: string) {
  const { data } = await api.get<ApiEnvelope<Visit[]>>(`/patients/${id}/visits`)
  return data.data
}

export async function getPatientAppointments(id: string) {
  const { data } = await api.get<ApiEnvelope<Appointment[]>>(`/patients/${id}/appointments`)
  return data.data
}

export async function getPatientPrescriptions(id: string) {
  const { data } = await api.get<ApiEnvelope<Prescription[]>>(`/patients/${id}/prescriptions`)
  return data.data
}

export async function getPatientInvoices(id: string) {
  const { data } = await api.get<ApiEnvelope<{ invoices: Invoice[]; total_paid: number; balance: number }>>(
    `/patients/${id}/invoices`
  )
  return data.data
}

export async function notifyPatient(id: string, subject: string, body: string) {
  await api.post(`/patients/${id}/notify`, { subject, body })
}
