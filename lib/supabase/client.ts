import { createBrowserClient } from '@supabase/ssr'

declare global {
  var __ubc_supabase_browser__: ReturnType<typeof createBrowserClient> | undefined
}

export function createClient() {
  if (globalThis.__ubc_supabase_browser__) return globalThis.__ubc_supabase_browser__
  globalThis.__ubc_supabase_browser__ = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return globalThis.__ubc_supabase_browser__
}
