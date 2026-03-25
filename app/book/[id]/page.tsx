import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { BookDetails } from "@/components/book-details"
import { phoneDigitsMatchLast10, sanitizePhoneDigits } from "@/lib/utils/phone"

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

  let canRateSeller = false
  if (user && listing.status === "sold") {
    const [{ data: saleRows }, { data: buyerProfile }] = await Promise.all([
      supabase
        .from("sales")
        .select("buyer_id, buyer_email, buyer_phone")
        .eq("listing_id", listing.id),
      supabase.from("profiles").select("phone, whatsapp").eq("id", user.id).maybeSingle(),
    ])
    const email = user.email?.toLowerCase().trim()
    const phone = buyerProfile?.phone ?? ""
    const whatsapp = buyerProfile?.whatsapp ?? ""
    const p10 = sanitizePhoneDigits(phone, 10)
    const w10 = sanitizePhoneDigits(whatsapp, 10)
    canRateSeller = Boolean(
      saleRows?.some(
        (s: { buyer_id: string | null; buyer_email: string | null; buyer_phone: string }) => {
          if (s.buyer_id === user.id) return true
          if (
            email &&
            s.buyer_email &&
            s.buyer_email.toLowerCase().trim() === email
          )
            return true
          const bp10 = sanitizePhoneDigits(s.buyer_phone ?? "", 10)
          if (bp10.length === 10 && (bp10 === p10 || bp10 === w10)) return true
          return (
            phoneDigitsMatchLast10(s.buyer_phone ?? "", phone) ||
            phoneDigitsMatchLast10(s.buyer_phone ?? "", whatsapp)
          )
        },
      ),
    )
  }

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
            canRateSeller,
          }}
        />
      </main>
      <Footer />
    </div>
  )
}
