import { isValidEmailFormat, normalizeEmail } from "@/lib/utils/email"

const DEFAULT_DOMAINS = ["asu.edu.jo"]

function allowedDomains(): string[] {
  const raw = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS?.trim()
  if (!raw) return DEFAULT_DOMAINS
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean)
}

export function isUniversityEmail(email: string): boolean {
  if (!isValidEmailFormat(email)) return false
  const domain = normalizeEmail(email).split("@")[1]
  if (!domain) return false
  return allowedDomains().includes(domain)
}

export function universityEmailHint(): string {
  const domains = allowedDomains()
  if (domains.length === 1) return `name@${domains[0]}`
  return `name@${domains[0]}`
}

export function universityEmailErrorMessage(language: "ar" | "en" = "ar"): string {
  const domains = allowedDomains().map((d) => `@${d}`).join(language === "ar" ? " أو " : " or ")
  if (language === "ar") {
    return `يُسمح بالتسجيل ببريد جامعي فقط (${domains})`
  }
  return `Registration requires a university email (${domains})`
}
