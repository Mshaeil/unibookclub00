import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AccountContent } from "@/components/account/account-content"
import { DatabaseUnavailable } from "@/components/database-unavailable"

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/account")
  }

  const [{ data: profile, error: profileError }, { data: listings, error: listingsError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, whatsapp, faculty_id, major_id")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("listings")
      .select(`
        id,
        title,
        price,
        condition,
        status,
        availability,
        images,
        views_count,
        created_at
      `)
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
  ])

  const facultiesArResult = await supabase.from("faculties").select("id, name_ar").order("id")
  const facultiesNameResult =
    facultiesArResult.error
      ? await supabase.from("faculties").select("id, name").order("id")
      : { data: null }

  const majorsArResult = await supabase
    .from("majors")
    .select("id, faculty_id, name_ar")
    .order("id")
  const majorsNameResult =
    majorsArResult.error
      ? await supabase.from("majors").select("id, faculty_id, name").order("id")
      : { data: null }

  const faculties = (facultiesArResult.data ??
    facultiesNameResult.data?.map((f: { id: string; name: string }) => ({
      id: f.id,
      name_ar: f.name,
    })) ??
    []) as { id: string; name_ar: string }[]

  const majors = (majorsArResult.data ??
    majorsNameResult.data?.map((m: { id: string; faculty_id: string; name: string }) => ({
      id: m.id,
      faculty_id: m.faculty_id,
      name_ar: m.name,
    })) ??
    []) as { id: string; faculty_id: string; name_ar: string }[]

  const hasDbError =
    Boolean(profileError) ||
    Boolean(listingsError) ||
    (Boolean(facultiesArResult.error) && !facultiesNameResult.data) ||
    (Boolean(majorsArResult.error) && !majorsNameResult.data)

  if (hasDbError) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <DatabaseUnavailable retryPath="/account" />
        </main>
        <Footer />
      </div>
    )
  }

  const hydratedProfile = profile
    ? {
        ...profile,
        faculty: profile.faculty_id
          ? faculties.find((f) => f.id === profile.faculty_id) ?? null
          : null,
        major: profile.major_id
          ? majors.find((m) => m.id === profile.major_id) ?? null
          : null,
      }
    : null

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <AccountContent
          userEmail={user.email ?? ""}
          profile={hydratedProfile}
          listings={listings || []}
          faculties={faculties}
          majors={majors}
        />
      </main>
      <Footer />
    </div>
  )
}
