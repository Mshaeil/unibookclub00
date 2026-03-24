import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/admin")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  const [{ data: listings }, { data: users }, { data: reports }, { data: faculties }, { data: majors }, { data: courses }] = await Promise.all([
    supabase
      .from("listings")
      .select(`
        id, title, price, status, availability, created_at,
        seller:profiles!listings_seller_id_fkey(id, full_name),
        course:courses(id, name)
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, phone, whatsapp, role, created_at, is_active")
      .order("created_at", { ascending: false }),
    supabase
      .from("reports")
      .select(`
        id, reason, details, status, created_at,
        listing:listings(id, title),
        reporter:profiles!reports_reporter_id_fkey(id, full_name)
      `)
      .order("created_at", { ascending: false }),
    supabase.from("faculties").select("id, name").order("id"),
    supabase.from("majors").select("id, faculty_id, name").order("id"),
    supabase.from("courses").select("id, major_id, name").order("id"),
  ])

  return (
    <AdminDashboard
      listings={listings || []}
      users={users || []}
      reports={reports || []}
      faculties={faculties || []}
      majors={majors || []}
      courses={courses || []}
    />
  )
}

