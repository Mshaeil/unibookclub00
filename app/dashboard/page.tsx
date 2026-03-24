import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/dashboard")
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Fetch user's listings with counts
  const { data: listings, count: totalListings } = await supabase
    .from("listings")
    .select("*, course:courses(name)", { count: "exact" })
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  // Get stats
  const activeListings = listings?.filter((l: any) => l.status === "approved").length || 0
  const pendingListings = listings?.filter((l: any) => l.status === "pending_review").length || 0
  const soldListings = listings?.filter((l: any) => l.status === "sold").length || 0

  // Get total views
  const totalViews = listings?.reduce((acc: number, l: any) => acc + (l.views_count || 0), 0) || 0

  // Get favorites count for user's listings
  const { count: totalFavorites } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .in("listing_id", listings?.map((l: any) => l.id) || [])

  return (
    <DashboardContent
      profile={profile}
      listings={listings || []}
      stats={{
        totalListings: totalListings || 0,
        activeListings,
        pendingListings,
        soldListings,
        totalViews,
        totalFavorites: totalFavorites || 0,
      }}
    />
  )
}
