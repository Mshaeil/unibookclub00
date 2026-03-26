import { createClient } from "@/lib/supabase/server"
import { countFromBigintRpc } from "@/lib/utils"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { HowItWorks } from "@/components/how-it-works"
import { BooksSection } from "@/components/books-section"
import { FacultiesSection } from "@/components/faculties-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { count: availableBooks },
    registeredRpc,
    { count: profilesCount },
    { count: soldCount },
    { data: listings },
  ] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.rpc("get_platform_registered_count"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "sold"),
    supabase
      .from("listings")
      .select(
        "id, title, price, original_price, discount_expires_at, condition, availability, images, course:courses(name_ar, name_en)",
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(12),
  ])

  const rpcRegistered = countFromBigintRpc(registeredRpc.data)
  const sellersCount =
    !registeredRpc.error && rpcRegistered !== null ? rpcRegistered : (profilesCount ?? 0)

  const normalizedListings = (listings || []).map((listing: {
    id: string
    title: string
    price: number
    original_price?: number | null
    discount_expires_at?: string | null
    condition: string
    availability: string
    images: string[]
    course: { code?: string; name_ar?: string; name_en?: string; name?: string }[] | { code?: string; name_ar?: string; name_en?: string; name?: string } | null
  }) => ({
    ...listing,
    course: Array.isArray(listing.course) ? listing.course[0] || null : listing.course,
  }))

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection
          stats={{
            availableBooks: availableBooks ?? 0,
            sellersCount: sellersCount ?? 0,
            soldCount: soldCount ?? 0,
          }}
        />
        <HowItWorks />
        <BooksSection listings={normalizedListings} />
        <FacultiesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
