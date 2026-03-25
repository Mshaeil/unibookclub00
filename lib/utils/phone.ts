/** Keep only digits, max length (default 10 for local Jordan numbers). */
export function sanitizePhoneDigits(value: string, maxLen = 10): string {
  return value.replace(/\D/g, "").slice(0, maxLen)
}

export function isValidTenDigitPhone(digits: string): boolean {
  return /^\d{10}$/.test(digits)
}

/** Compare last 10 digits (handles 07… vs +9627… after normalization). */
export function phoneDigitsMatchLast10(a: string, b: string): boolean {
  const da = a.replace(/\D/g, "")
  const db = b.replace(/\D/g, "")
  if (da.length < 10 || db.length < 10) return false
  return da.slice(-10) === db.slice(-10)
}

/** Normalize stored numbers to at most 10 digits (last 10 if longer). */
export function toTenDigitPhone(p: string | null | undefined): string {
  const d = (p || "").replace(/\D/g, "")
  if (d.length <= 10) return d
  return d.slice(-10)
}
