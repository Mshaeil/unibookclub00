export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Basic format check; not a full RFC parser. */
export function isValidEmailFormat(email: string): boolean {
  const s = normalizeEmail(email)
  if (s.length < 5 || s.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}
