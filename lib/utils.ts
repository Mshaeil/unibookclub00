import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Supabase RPC returning bigint may be number, string, or bigint */
export function countFromBigintRpc(data: unknown): number | null {
  if (data == null) return null
  if (typeof data === "number") return Number.isFinite(data) ? Math.trunc(data) : null
  if (typeof data === "bigint") return Number(data)
  if (typeof data === "string") {
    const n = Number(data)
    return Number.isFinite(n) ? Math.trunc(n) : null
  }
  return null
}

const JOD_FILS = 100

/** Round to 2 decimal places (fils) for JOD; removes float noise like 9.999999999. */
export function roundMoneyJod(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.round(n * JOD_FILS) / JOD_FILS
}

/**
 * Display a JOD amount without long decimal tails. Whole numbers show without ".00".
 */
export function formatJod(value: unknown): string {
  const r = roundMoneyJod(typeof value === "number" ? value : Number(value))
  if (!Number.isFinite(r)) return "0"
  return String(Number.parseFloat(r.toFixed(2)))
}

/** Exactly two decimals (فواتير / ملخص مالي). */
export function formatJodStrict(value: unknown): string {
  const r = roundMoneyJod(typeof value === "number" ? value : Number(value))
  if (!Number.isFinite(r)) return "0.00"
  return r.toFixed(2)
}

/** Average rating: one decimal, stable rounding. */
export function formatRatingOneDecimal(value: unknown): string {
  const r = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(r)) return "—"
  return (Math.round(r * 10) / 10).toFixed(1)
}
