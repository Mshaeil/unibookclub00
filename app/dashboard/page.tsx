import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DatabaseUnavailable } from "@/components/database-unavailable"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/dashboard")
  }

  const [profileRes, listingsRes, salesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("listings")
      .select("*, course:courses(name_ar, name_en)", { count: "exact" })
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("sales")
      .select(
        `
        id, reference_code, created_at, listing_id,
        listing:listings(id, title, price, images, status, description),
        seller:profiles!sales_seller_id_fkey(id, full_name)
      `,
      )
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false }),
  ])

  const profile = profileRes.data
  const listings = listingsRes.data
  const listingsError = listingsRes.error || profileRes.error

  if (listingsError) {
    return <DatabaseUnavailable retryPath="/dashboard" />
  }

  const activeListings = listings?.filter((l) => l.status === "approved").length || 0
  const pendingListings = listings?.filter((l) => l.status === "pending_review").length || 0
  const soldListings = listings?.filter((l) => l.status === "sold").length || 0
  const totalViews = listings?.reduce((acc, l) => acc + (l.views_count || 0), 0) || 0
  const listingIds = listings?.map((l) => l.id) || []

  let totalFavorites = 0
  if (listingIds.length > 0) {
    const { count } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .in("listing_id", listingIds)
    totalFavorites = count || 0
  }

  const salesRows = salesRes.data ?? []
  const saleListingIds = salesRows.map((s) => s.listing_id).filter(Boolean) as string[]
  let reviewedListingIds: string[] = []
  if (saleListingIds.length > 0) {
    const { data: reviews } = await supabase
      .from("seller_reviews")
      .select("listing_id")
      .eq("reviewer_id", user.id)
      .in("listing_id", saleListingIds)
    reviewedListingIds = (reviews ?? []).map((r) => r.listing_id)
  }

  const PDF_TAG = /\[PDF_FILE\]/
  const salesWithFlags = salesRows.map((row) => {
    const listing = row.listing as { description?: string } | { description?: string }[] | null
    const L = Array.isArray(listing) ? listing[0] : listing
    const desc = L && "description" in L ? L.description : null
    return { ...row, listingHasPdf: Boolean(desc && PDF_TAG.test(desc)) }
  })

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">...</div>}>
      <DashboardShell
        profile={profile}
        listings={listings || []}
        stats={{
          totalListings: listingsRes.count || 0,
          activeListings,
          pendingListings,
          soldListings,
          totalViews,
          totalFavorites,
        }}
        sales={salesWithFlags as never}
        reviewedListingIds={reviewedListingIds}
      />
    </Suspense>
  )
}
