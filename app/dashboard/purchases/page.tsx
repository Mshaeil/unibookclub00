import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PurchasesContent } from "@/components/dashboard/purchases-content"

export const dynamic = "force-dynamic"

export default async function PurchasesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/dashboard/purchases")
  }

  const { data: sales, error: salesError } = await supabase
    .from("sales")
    .select(
      `
      id,
      reference_code,
      created_at,
      listing_id,
      listing:listings(id, title, price, images, status, description),
      seller:profiles!sales_seller_id_fkey(id, full_name)
    `,
    )
    .order("created_at", { ascending: false })

  if (salesError) {
    console.error("Purchases query error:", salesError)
  }

  const rows = sales ?? []
  const listingIds = rows.map((s) => s.listing_id).filter(Boolean) as string[]
  let reviewedListingIds: string[] = []

  if (listingIds.length > 0) {
    const { data: reviews } = await supabase
      .from("seller_reviews")
      .select("listing_id")
      .eq("reviewer_id", user.id)
      .in("listing_id", listingIds)

    reviewedListingIds = (reviews ?? []).map((r) => r.listing_id)
  }

  const PDF_TAG = /\[PDF_FILE\]/
  const salesWithFlags = rows.map((row) => {
    const listing = row.listing as { description?: string } | { description?: string }[] | null
    const L = Array.isArray(listing) ? listing[0] : listing
    const desc = L && "description" in L ? L.description : null
    return {
      ...row,
      listingHasPdf: Boolean(desc && PDF_TAG.test(desc)),
    }
  })

  return (
    <PurchasesContent
      sales={salesWithFlags as never}
      reviewedListingIds={reviewedListingIds}
    />
  )
}
