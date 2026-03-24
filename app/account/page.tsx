import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AccountContent } from "@/components/account/account-content"

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/account")
  }

  const [{ data: profile }, { data: listings }, { data: faculties }, { data: majors }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          phone,
          whatsapp,
          faculty_id,
          major_id,
          faculty:faculties(id, name),
          major:majors(id, name)
        `)
        .eq("id", user.id)
        .single(),
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
          created_at,
          course:courses(name)
        `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("faculties").select("id, name").order("id"),
      supabase.from("majors").select("id, faculty_id, name").order("id"),
    ])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <AccountContent
          userEmail={user.email ?? ""}
          profile={profile}
          listings={listings || []}
          faculties={faculties || []}
          majors={majors || []}
        />
      </main>
      <Footer />
    </div>
  )
}
