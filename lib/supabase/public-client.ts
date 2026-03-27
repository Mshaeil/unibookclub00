import { createClient } from "@supabase/supabase-js"

/** Browser-side Supabase client without session persistence (avoids auth lock contention). */
export function createPublicBrowserSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

