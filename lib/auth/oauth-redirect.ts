/** Build Supabase OAuth redirect URL (must match /auth/callback route). */
export function getOAuthCallbackUrl(nextPath: string) {
  if (typeof window === "undefined") return ""
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
}
