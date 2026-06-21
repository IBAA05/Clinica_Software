export type Role = "doctor" | "receptionist"

export interface AuthUser {
  id: string
  name: string
  role: Role
  email: string
  avatar_url?: string | null
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: AuthUser
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  message: string
  pagination?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export type Gender = "male" | "female" | "other"
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
export type PatientStatus = "active" | "inactive"

export interface Patient {
  id: string
  full_name: string
  date_of_birth: string
  age: number
  gender: Gender
  phone: string
  email?: string | null
  address?: string | null
  blood_type?: BloodType | null
  national_id: string
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  insurance_provider?: string | null
  insurance_number?: string | null
  allergies: string[]
  chronic_conditions: string[]
  notes?: string | null
  status: PatientStatus
  last_visit?: string | null
  created_at: string
  updated_at?: string | null
}

export interface PatientStats {
  total: number
  active: number
  inactive?: number
  new_this_month: number
  with_insurance: number
}

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"

export type AppointmentType =
  | "consultation"
  | "followup"
  | "procedure"
  | "checkup"
  | "emergency"

export interface Appointment {
  id: string
  patient_id: string
  patient_name?: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  type: AppointmentType
  status: AppointmentStatus
  reason?: string | null
  notes?: string | null
  created_by?: string
  cancelled_reason?: string | null
  created_at?: string
}

export interface Visit {
  id: string
  patient_id: string
  patient_name?: string
  appointment_id?: string | null
  visit_date: string
  symptoms?: string | null
  clinical_notes?: string | null
  diagnosis_code?: string | null
  diagnosis_description?: string | null
  lab_requests: string[]
  next_visit_date?: string | null
  next_visit_notes?: string | null
  prescriptions?: Prescription[]
  created_at?: string
}

export interface Prescription {
  id: string
  visit_id: string
  patient_id: string
  medication_name: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string | null
  is_printed?: boolean
  printed_at?: string | null
}

export type PaymentMethod = "cash" | "card" | "insurance" | "bank_transfer"
export type InvoiceStatus = "paid" | "pending" | "partial" | "overdue"
export type ServiceType =
  | "consultation"
  | "followup"
  | "procedure"
  | "lab"
  | "medication"
  | "other"

export interface InvoiceItem {
  id?: string
  service_type: ServiceType
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Invoice {
  id: string
  invoice_ref: string
  patient_id: string
  patient_name?: string
  appointment_id?: string | null
  subtotal: number
  discount: number
  tax_rate: number
  tax_amount: number
  total: number
  amount_paid: number
  balance: number
  payment_method?: PaymentMethod | null
  status: InvoiceStatus
  issue_date: string
  due_date: string
  paid_date?: string | null
  notes?: string | null
  items: InvoiceItem[]
  created_at?: string
}

export interface InvoiceStats {
  total_revenue: number
  collected: number
  pending: number
  overdue: number
}

export type ExpenseCategory =
  | "salaries"
  | "rent"
  | "supplies"
  | "equipment"
  | "utilities"
  | "marketing"
  | "other"

export interface Expense {
  id: string
  category: ExpenseCategory
  description: string
  amount: number
  date: string
  receipt_ref?: string | null
  notes?: string | null
}

export interface DoctorProfile {
  id: string
  user_id: string
  full_name: string
  specialty?: string
  qualification?: string
  registration_number?: string
  phone?: string
  email?: string
  bio?: string
  photo_url?: string | null
  signature_url?: string | null
  consultation_fee: number
  followup_fee: number
  schedule: Record<string, DaySchedule>
  slot_duration_minutes: number
  max_daily_appointments: number
}

export interface DaySchedule {
  active: boolean
  morning_start?: string
  morning_end?: string
  afternoon_start?: string
  afternoon_end?: string
}

export interface ClinicSettings {
  id: string
  clinic_name: string
  logo_url?: string | null
  address?: string
  phone?: string
  email?: string
  website?: string
  tax_rate: number
  currency: string
  appointment_reminder_hours: number[]
  smtp_host?: string
  smtp_port?: number
  smtp_user?: string
  smtp_from?: string
}

export interface Service {
  id: string
  name: string
  service_type: ServiceType
  default_price: number
}

export interface ClinicNotification {
  id: string
  type: "email" | "internal"
  recipient_email?: string
  subject: string
  body: string
  status: "sent" | "failed" | "pending" | "unread" | "read"
  related_entity?: "appointment" | "invoice" | "visit"
  related_id?: string
  sent_at?: string | null
}

export interface ICDCode {
  code: string
  description: string
}

export interface StaffUser {
  id: string
  full_name: string
  email: string
  role: Role
  is_active: boolean
}
