import { api } from "@/lib/axios"
import type { ApiEnvelope, Invoice, InvoiceStats, Service } from "@/types"

export interface InvoiceListParams {
  page?: number
  limit?: number
  status?: string
  payment_method?: string
  date_from?: string
  date_to?: string
  patient_id?: string
  patient_name?: string
}

export async function listInvoices(params: InvoiceListParams) {
  const { data } = await api.get<ApiEnvelope<{ invoices: Invoice[]; stats: InvoiceStats }>>(
    "/invoices",
    { params }
  )
  return { ...data.data, pagination: data.pagination }
}

export async function getInvoice(id: string) {
  const { data } = await api.get<ApiEnvelope<Invoice>>(`/invoices/${id}`)
  return data.data
}

export async function createInvoice(payload: Partial<Invoice>) {
  const { data } = await api.post<ApiEnvelope<Invoice>>("/invoices", payload)
  return data.data
}

export async function updateInvoice(id: string, payload: Partial<Invoice>) {
  const { data } = await api.put<ApiEnvelope<Invoice>>(`/invoices/${id}`, payload)
  return data.data
}

export async function deleteInvoice(id: string) {
  await api.delete(`/invoices/${id}`)
}

export async function payInvoice(
  id: string,
  payload: { amount_paid: number; payment_method: string; paid_date: string }
) {
  const { data } = await api.put<ApiEnvelope<Invoice>>(`/invoices/${id}/pay`, payload)
  return data.data
}

export async function sendInvoice(id: string) {
  await api.post(`/invoices/${id}/send`)
}

export async function getOverdue() {
  const { data } = await api.get<ApiEnvelope<Invoice[]>>("/invoices/overdue")
  return data.data
}

export async function listServices() {
  const { data } = await api.get<ApiEnvelope<Service[]>>("/invoices/services")
  return data.data
}

export async function updateService(id: string, default_price: number) {
  const { data } = await api.put<ApiEnvelope<Service>>(`/invoices/services/${id}`, { default_price })
  return data.data
}
