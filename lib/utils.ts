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
