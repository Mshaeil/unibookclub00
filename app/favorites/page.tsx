import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FavoritesContent } from "@/components/favorites/favorites-content"

export default async function FavoritesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/favorites")
  }

  const { data: favorites } = await supabase
    .from("favorites")
    .select(`
      id,
      listing:listings(
        id,
        title,
        price,
        condition,
        availability,
        images,
        views_count,
        created_at,
        course:courses(name)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const listings = (favorites || [])
    .map((f: { listing: unknown }) => f.listing)
    .filter(Boolean) as Array<{
    id: string
    title: string
    price: number
    condition: string
    availability: string
    images: string[]
    views_count: number
    created_at: string
    course: { name: string } | null
  }>

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <FavoritesContent listings={listings} />
      </main>
      <Footer />
    </div>
  )
}
