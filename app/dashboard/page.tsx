import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/dashboard")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { data: listings, count: totalListings, error: listingsError } = await supabase
    .from("listings")
    .select("*, course:courses(name_ar, name_en)", { count: "exact" })
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  if (listingsError) {
    console.error("Dashboard listings query error:", listingsError)
  }

  const activeListings = listings?.filter((l: any) => l.status === "approved").length || 0
  const pendingListings = listings?.filter((l: any) => l.status === "pending_review").length || 0
  const soldListings = listings?.filter((l: any) => l.status === "sold").length || 0

  const totalViews = listings?.reduce((acc: number, l: any) => acc + (l.views_count || 0), 0) || 0

  const listingIds = listings?.map((l: any) => l.id) || []

  let totalFavorites = 0

  if (listingIds.length > 0) {
    const { count, error: favoritesError } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .in("listing_id", listingIds)

    if (favoritesError) {
      console.error("Dashboard favorites query error:", favoritesError)
    }

    totalFavorites = count || 0
  }

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
        totalFavorites,
      }}
    />
  )
}