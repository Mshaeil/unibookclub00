import type { SupabaseClient, User } from "@supabase/supabase-js"

export type EnsureUserProfileResult = { ok: true } | { ok: false; error: string }

/**
 * Ensures a `profiles` row exists and mirrors auth email / OAuth names.
 * Safe on every login: never downgrades `role` from admin.
 */
export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<EnsureUserProfileResult> {
  const meta = user.user_metadata || {}
  const fromMeta = (k: string) => {
    const v = meta[k]
    return typeof v === "string" ? v.trim() : ""
  }
  const fullName =
    fromMeta("full_name") ||
    fromMeta("name") ||
    user.email?.split("@")[0]?.trim() ||
    "مستخدم"

  const phoneRaw = fromMeta("phone")
  const waRaw = fromMeta("whatsapp")
  const phone = phoneRaw || null
  const whatsapp = waRaw || null
  const email = user.email ?? null

  const { data: existing, error: readErr } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", user.id)
    .maybeSingle()

  if (readErr) {
    return { ok: false, error: readErr.message }
  }

  if (!existing) {
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: fullName,
      phone,
      whatsapp,
      email,
      role: "user",
    })
    if (error) {
      return { ok: false, error: error.message }
    }
    return { ok: true }
  }

  const patch: Record<string, string | null> = { email }
  const fn = (existing.full_name || "").trim()
  if (!fn || fn === "مستخدم") {
    patch.full_name = fullName
  }
  if (phone) patch.phone = phone
  if (whatsapp) patch.whatsapp = whatsapp

  if (Object.keys(patch).length === 0) return { ok: true }

  const { error: upErr } = await supabase.from("profiles").update(patch).eq("id", user.id)
  if (upErr) {
    return { ok: false, error: upErr.message }
  }
  return { ok: true }
}
