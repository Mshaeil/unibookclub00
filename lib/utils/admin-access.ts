/** Emails that always see admin panel (comma-separated in env). */
export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const raw = process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAILS?.trim()
  const list = raw
    ? raw.split(",").map((e) => e.trim().toLowerCase())
    : ["mshaeili0111@gmail.com"]
  return list.includes(email.trim().toLowerCase())
}

export function canAccessAdminPanel(opts: {
  role?: string | null
  email?: string | null
  isSuperAdmin?: boolean
}): boolean {
  if (opts.isSuperAdmin) return true
  if (opts.role === "admin") return true
  if (isBootstrapAdminEmail(opts.email)) return true
  return false
}

type RpcClient = {
  rpc: (name: string) => PromiseLike<{ data: unknown; error: unknown }>
}

export async function queryIsSuperAdmin(client: RpcClient): Promise<boolean> {
  try {
    const { data, error } = await client.rpc("is_super_admin")
    return !error && Boolean(data)
  } catch {
    return false
  }
}
