import { unstable_cache } from "next/cache"
import { createPublicSupabaseClient } from "@/lib/supabase/public-server"
import { HowItWorks } from "@/components/how-it-works"
import { BooksSection } from "@/components/books-section"
import { FacultiesSection } from "@/components/faculties-section"
import { CTASection } from "@/components/cta-section"

const fetchHomeListings = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient()
    const { data, error } = await supabase
      .from("listings")
      .select(
        "id, title, price, original_price, discount_expires_at, condition, availability, images, course:courses(name_ar, name_en)",
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(12)
    if (error) {
      console.error("[HomeMainContent] listings:", error.message)
      return []
    }
    return data ?? []
  },
  ["home-main-listings-v2"],
  { revalidate: 60, tags: ["home-listings"] },
)

export async function HomeMainContent() {
  const listings = await fetchHomeListings()

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
