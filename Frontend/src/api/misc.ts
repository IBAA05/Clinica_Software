import { api } from "@/lib/axios"
import type {
  ApiEnvelope,
  ClinicNotification,
  ClinicSettings,
  DoctorProfile,
  Expense,
  ICDCode,
  Service,
  StaffUser,
} from "@/types"

/* ----------------------------- Dashboard ----------------------------- */
export interface DashboardStats {
  total_patients: number
  appointments_today: number
  monthly_revenue: number | null
  pending_invoices_count: number
  pending_invoices_amount?: number
  total_patients_change?: number
  appointments_today_change?: number
  monthly_revenue_change?: number
}

export const dashboardApi = {
  stats: async () => (await api.get<ApiEnvelope<DashboardStats>>("/dashboard/stats")).data.data,
  todaySchedule: async () =>
    (await api.get<ApiEnvelope<any[]>>("/dashboard/today-schedule")).data.data,
  appointmentTrend: async () =>
    (await api.get<ApiEnvelope<any[]>>("/dashboard/appointment-trend")).data.data,
  patientTrend: async () =>
    (await api.get<ApiEnvelope<any[]>>("/dashboard/patient-trend")).data.data,
  revenueByService: async () =>
    (await api.get<ApiEnvelope<any[]>>("/dashboard/revenue-by-service")).data.data,
  recentRecords: async () =>
    (await api.get<ApiEnvelope<any[]>>("/dashboard/recent-records")).data.data,
  quickStats: async () => (await api.get<ApiEnvelope<any>>("/dashboard/quick-stats")).data.data,
}

/* ----------------------------- Reports ----------------------------- */
export const reportsApi = {
  financialOverview: async (period: string, start_date?: string, end_date?: string) =>
    (await api.get<ApiEnvelope<any>>("/reports/financial/overview", {
      params: { period, start_date, end_date },
    })).data.data,
  monthlyTrend: async (year: number) =>
    (await api.get<ApiEnvelope<any[]>>("/reports/financial/monthly-trend", { params: { year } })).data.data,
  byService: async (period: string) =>
    (await api.get<ApiEnvelope<any[]>>("/reports/financial/by-service", { params: { period } })).data.data,
  appointmentsSummary: async (period: string) =>
    (await api.get<ApiEnvelope<any>>("/reports/appointments/summary", { params: { period } })).data.data,
  busiestSlots: async (period: string) =>
    (await api.get<ApiEnvelope<any>>("/reports/appointments/busiest-slots", { params: { period } })).data.data,
  demographics: async (period: string) =>
    (await api.get<ApiEnvelope<any>>("/reports/patients/demographics", { params: { period } })).data.data,
  topDiagnoses: async (period: string, limit = 5) =>
    (await api.get<ApiEnvelope<any[]>>("/reports/patients/top-diagnoses", { params: { period, limit } })).data.data,
}

/* ----------------------------- Doctor ----------------------------- */
export const doctorApi = {
  profile: async () => (await api.get<ApiEnvelope<DoctorProfile>>("/doctor/profile")).data.data,
  updateProfile: async (payload: Partial<DoctorProfile>) =>
    (await api.put<ApiEnvelope<DoctorProfile>>("/doctor/profile", payload)).data.data,
  updateSchedule: async (schedule: DoctorProfile["schedule"]) =>
    (await api.put<ApiEnvelope<DoctorProfile>>("/doctor/schedule", { schedule })).data.data,
  updateFees: async (payload: { consultation_fee: number; followup_fee: number }) =>
    (await api.put<ApiEnvelope<DoctorProfile>>("/doctor/fees", payload)).data.data,
  stats: async () => (await api.get<ApiEnvelope<any>>("/doctor/stats")).data.data,
}

/* ----------------------------- Settings ----------------------------- */
export const settingsApi = {
  get: async () => (await api.get<ApiEnvelope<ClinicSettings>>("/settings")).data.data,
  update: async (payload: Partial<ClinicSettings>) =>
    (await api.put<ApiEnvelope<ClinicSettings>>("/settings", payload)).data.data,
  services: async () => (await api.get<ApiEnvelope<Service[]>>("/settings/services")).data.data,
  updateService: async (id: string, default_price: number) =>
    (await api.put<ApiEnvelope<Service>>(`/settings/services/${id}`, { default_price })).data.data,
  staff: async () => (await api.get<ApiEnvelope<StaffUser[]>>("/settings/staff")).data.data,
  createStaff: async (payload: { full_name: string; email: string; username: string; password: string }) =>
    (await api.post<ApiEnvelope<StaffUser>>("/settings/staff", { ...payload, role: "receptionist" })).data.data,
  updateStaff: async (id: string, payload: { full_name?: string; email?: string; is_active?: boolean }) =>
    (await api.put<ApiEnvelope<StaffUser>>(`/settings/staff/${id}`, payload)).data.data,
  deactivateStaff: async (id: string) => {
    await api.delete(`/settings/staff/${id}`)
  },
}

/* ----------------------------- Expenses ----------------------------- */
export const expensesApi = {
  list: async (params: Record<string, unknown>) => {
    const { data } = await api.get<ApiEnvelope<{ expenses: Expense[]; totals: any }>>("/expenses", { params })
    return { ...data.data, pagination: data.pagination }
  },
  create: async (payload: Partial<Expense>) =>
    (await api.post<ApiEnvelope<Expense>>("/expenses", payload)).data.data,
  update: async (id: string, payload: Partial<Expense>) =>
    (await api.put<ApiEnvelope<Expense>>(`/expenses/${id}`, payload)).data.data,
  remove: async (id: string) => {
    await api.delete(`/expenses/${id}`)
  },
}

/* ----------------------------- Notifications ----------------------------- */
export const notificationsApi = {
  unread: async () =>
    (await api.get<ApiEnvelope<ClinicNotification[]>>("/notifications/unread")).data.data,
  markRead: async (id: string) => {
    await api.put(`/notifications/${id}/read`)
  },
  log: async () => (await api.get<ApiEnvelope<ClinicNotification[]>>("/notifications/log")).data.data,
}

/* ----------------------------- ICD ----------------------------- */
export async function searchICD(q: string): Promise<ICDCode[]> {
  if (!q) return []
  const { data } = await api.get<ApiEnvelope<ICDCode[]>>("/icd/search", { params: { q } })
  return data.data
}
