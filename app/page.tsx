import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { HowItWorks } from "@/components/how-it-works"
import { BooksSection } from "@/components/books-section"
import { FacultiesSection } from "@/components/faculties-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, price, condition, availability, images, course:courses(name)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(12)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <HowItWorks />
        <BooksSection listings={listings ?? []} />
        <FacultiesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
