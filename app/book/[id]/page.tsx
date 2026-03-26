import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { BookDetails } from "@/components/book-details"

export const dynamic = "force-dynamic"

interface BookPageProps {
  params: Promise<{ id: string }>
}

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null }
  const isAdmin = profile?.role === "admin"

  const query = supabase
    .from("listings")
    .select(`
      *,
      seller:profiles!listings_seller_id_fkey(id, full_name, phone, whatsapp),
      course:courses(
        id, name_ar, name_en,
        major:majors(
          id, name_ar, name_en,
          faculty:faculties(id, name_ar, name_en)
        )
      )
    `)
    .eq("id", id)

  /* RLS (listings_read_approved) limits rows: guests see approved only; sellers/buyers/admins see more */
  const { data: listing, error: listingError } = await query.single()

  if (!listing) {
    if (listingError) {
      console.error("[BookPage] Listing fetch failed:", {
        id,
        isAdmin,
        error: listingError.message,
        code: listingError.code,
      })
    }
    notFound()
  }

  const relatedQuery = supabase
    .from("listings")
    .select(
      "id, title, price, original_price, discount_expires_at, condition, images, availability, course:courses(code, name_ar, name_en)",
    )
    .eq("status", "approved")
    .neq("id", listing.id)
    .limit(4)
    .order("created_at", { ascending: false })

  const { data: relatedListings } = listing.course_id
    ? await relatedQuery.eq("course_id", listing.course_id)
    : await relatedQuery

  const { data: sellerReviews } = await supabase
    .from("seller_reviews")
    .select("rating")
    .eq("seller_id", listing.seller_id)
    .limit(200)

  const ratings = (sellerReviews ?? [])
    .map((r: { rating: number }) => Number(r.rating))
    .filter((n) => Number.isFinite(n))
  const sellerRatingCount = ratings.length
  const sellerRatingAvg =
    sellerRatingCount > 0 ? ratings.reduce((a, b) => a + b, 0) / sellerRatingCount : 0

  const normalizedRelatedListings = (relatedListings || []).map((item: {
    id: string
    title: string
    price: number
    original_price?: number | null
    discount_expires_at?: string | null
    condition: "new" | "like_new" | "good" | "acceptable"
    availability: "available" | "reserved" | "sold"
    images: string[]
    course: { code?: string; name_ar?: string; name_en?: string; name?: string }[] | { code?: string; name_ar?: string; name_en?: string; name?: string } | null
  }) => ({
    ...item,
    course: Array.isArray(item.course) ? item.course[0] || null : item.course,
  }))

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
