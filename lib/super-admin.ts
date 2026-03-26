/** Must match scripts/016_account_status_super_admin.sql super-admin email check */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  const expected = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
  if (!expected) return false
  return (email?.trim().toLowerCase() ?? "") === expected
}
