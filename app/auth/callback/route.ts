import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile"

/**
 * OAuth (Google) redirect target. Add this URL in Supabase:
 * Authentication → URL Configuration → Redirect URLs:
 *   http://localhost:3000/auth/callback
 *   https://your-domain.com/auth/callback
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  let next = searchParams.get("next") ?? "/dashboard"
  if (!next.startsWith("/")) {
    next = "/dashboard"
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              )
            } catch {
              /* ignore when called outside a route that can set cookies */
            }
          },
        },
      },
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await ensureUserProfile(supabase, user)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
