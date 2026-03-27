import { createClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client without reading cookies / session.
 * Use for public SELECTs so routes can use ISR/caching on Vercel (faster TTFB).
 * RLS still applies using the anonymous role.
 */
export function createPublicSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
