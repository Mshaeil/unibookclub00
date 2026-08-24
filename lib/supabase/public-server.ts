import { createClient } from "@supabase/supabase-js"
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/keys"

/**
 * Server-only Supabase client without reading cookies / session.
 * Use for public SELECTs so routes can use ISR/caching on Vercel (faster TTFB).
 * RLS still applies using the anonymous role.
 */
export function createPublicSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
