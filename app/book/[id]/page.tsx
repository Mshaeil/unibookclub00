import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { BookDetails } from "@/components/book-details"

export const dynamic = "force-dynamic"

interface BookPageProps {
  params: Promise<{ id: string }>
}

type SellerRatingStatsRow = { avg_rating: number | string | null; review_count: number | string | null }

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [authRes, listingRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("listings")
      .select(
        `
      *,
      seller:profiles!listings_seller_id_fkey(id, full_name, phone, whatsapp),
      course:courses(
        id, name_ar, name_en,
        major:majors(
          id, name_ar, name_en,
          faculty:faculties(id, name_ar, name_en)
        )
      )
    `,
      )
      .eq("id", id)
      .single(),
  ])

  const user = authRes.data.user ?? null
  const { data: listing, error: listingError } = listingRes

  if (!listing) {
    if (listingError) {
      console.error("[BookPage] Listing fetch failed:", {
        id,
        error: listingError.message,
        code: listingError.code,
      })
    }
    notFound()
  }

  let relatedQuery = supabase
    .from("listings")
    .select(
      "id, title, price, original_price, discount_expires_at, condition, images, availability, course:courses(code, name_ar, name_en)",
    )
    .eq("status", "approved")
    .neq("id", listing.id)
    .limit(4)
    .order("created_at", { ascending: false })

  if (listing.course_id) {
    relatedQuery = relatedQuery.eq("course_id", listing.course_id)
  }

  const [relatedRes, statsRes] = await Promise.all([
    relatedQuery,
    supabase.rpc("get_seller_rating_stats", { p_seller_id: listing.seller_id }),
  ])

  const { data: relatedListings } = relatedRes

  let sellerRatingAvg = 0
  let sellerRatingCount = 0
  const statsRows = statsRes.data as SellerRatingStatsRow[] | null
  const statsRow = statsRows?.[0]
  if (!statsRes.error && statsRow) {
    sellerRatingAvg = Number(statsRow.avg_rating) || 0
    sellerRatingCount = Number(statsRow.review_count) || 0
  } else {
    const { data: sellerReviews } = await supabase
      .from("seller_reviews")
      .select("rating")
      .eq("seller_id", listing.seller_id)
      .limit(200)
    const ratings = (sellerReviews ?? [])
      .map((r: { rating: number }) => Number(r.rating))
      .filter((n) => Number.isFinite(n))
    sellerRatingCount = ratings.length
    sellerRatingAvg =
      sellerRatingCount > 0 ? ratings.reduce((a, b) => a + b, 0) / sellerRatingCount : 0
  }

  const normalizedRelatedListings = (relatedListings || []).map(
    (item: {
      id: string
      title: string
      price: number
      original_price?: number | null
      discount_expires_at?: string | null
      condition: "new" | "like_new" | "good" | "acceptable"
      availability: "available" | "reserved" | "sold"
      images: string[]
      course:
        | { code?: string; name_ar?: string; name_en?: string; name?: string }[]
        | { code?: string; name_ar?: string; name_en?: string; name?: string }
        | null
    }) => ({
      ...item,
      course: Array.isArray(item.course) ? item.course[0] || null : item.course,
    }),
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <BookDetails
          listing={listing}
          relatedListings={normalizedRelatedListings}
          viewer={{
            userId: user?.id ?? null,
            isSeller: Boolean(user && listing.seller_id === user.id),
            canRateSeller: false,
          }}
          sellerRating={{ avg: sellerRatingAvg, count: sellerRatingCount }}
        />
      </main>
      <Footer />
    </div>
  )
}
