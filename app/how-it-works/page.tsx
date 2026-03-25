import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HowItWorksBody } from "@/components/how-it-works/how-it-works-body"

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12 md:py-20">
        <HowItWorksBody />
      </main>
      <Footer />
    </div>
  )
}
