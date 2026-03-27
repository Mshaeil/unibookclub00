import { Suspense } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { Footer } from "@/components/footer"
import { HomeMainContent } from "@/app/_components/home-main-content"
import { HomeMainSkeleton } from "@/app/_components/home-main-skeleton"

/** ISR: أسرع على Vercel من force-dynamic + cookies لكل طلب */
export const revalidate = 60

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <Suspense fallback={<HomeMainSkeleton />}>
          <HomeMainContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
