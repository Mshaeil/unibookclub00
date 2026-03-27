import type { SupabaseClient } from "@supabase/supabase-js"

export async function ensureMyProfileRpc(supabase: SupabaseClient): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.rpc("ensure_my_profile")
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

