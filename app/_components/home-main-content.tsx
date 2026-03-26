import { createClient } from "@/lib/supabase/server"
import { HowItWorks } from "@/components/how-it-works"
import { BooksSection } from "@/components/books-section"
import { FacultiesSection } from "@/components/faculties-section"
import { CTASection } from "@/components/cta-section"

export async function HomeMainContent() {
  const supabase = await createClient()

  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, title, price, original_price, discount_expires_at, condition, availability, images, course:courses(name_ar, name_en)",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(12)

  const normalizedListings = (listings || []).map(
    (listing: {
      id: string
      title: string
      price: number
      original_price?: number | null
      discount_expires_at?: string | null
      condition: string
      availability: string
      images: string[]
      course:
        | { code?: string; name_ar?: string; name_en?: string; name?: string }[]
        | { code?: string; name_ar?: string; name_en?: string; name?: string }
        | null
    }) => ({
      ...listing,
      course: Array.isArray(listing.course) ? listing.course[0] || null : listing.course,
    }),
  )

  return (
    <>
      <HowItWorks />
      <BooksSection listings={normalizedListings} />
      <FacultiesSection />
      <CTASection />
    </>
  )
}
