import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/keys'

declare global {
  var __ubc_supabase_browser__: ReturnType<typeof createBrowserClient> | undefined
}

export function createClient() {
  if (globalThis.__ubc_supabase_browser__) return globalThis.__ubc_supabase_browser__
  globalThis.__ubc_supabase_browser__ = createBrowserClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
  )
  return globalThis.__ubc_supabase_browser__
}
