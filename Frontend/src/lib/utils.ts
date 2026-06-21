import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, differenceInYears, isValid } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "—"
  const d = typeof value === "string" ? parseISO(value) : value
  if (!isValid(d)) return "—"
  return format(d, "dd MMM yyyy")
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return "—"
  const d = typeof value === "string" ? parseISO(value) : value
  if (!isValid(d)) return "—"
  return format(d, "dd MMM yyyy, HH:mm")
}

export function formatTime(value?: string | null): string {
  if (!value) return "—"
  // value like "14:30:00" or "14:30"
  return value.slice(0, 5)
}

export function calcAge(dob?: string | null): number | null {
  if (!dob) return null
  const d = parseISO(dob)
  if (!isValid(d)) return null
  return differenceInYears(new Date(), d)
}

let currencyCode = "USD"
export function setCurrency(code: string) {
  currencyCode = code || "USD"
}

export function formatCurrency(amount?: number | null): string {
  const value = Number(amount ?? 0)
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(value)
  } catch {
    return `$${value.toFixed(2)}`
  }
}

export function formatNumber(value?: number | null): string {
  return new Intl.NumberFormat("en-US").format(Number(value ?? 0))
}

export function initials(name?: string): string {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

export function pct(value?: number | null): string {
  const v = Number(value ?? 0)
  const sign = v > 0 ? "+" : ""
  return `${sign}${v.toFixed(1)}%`
}
