import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { BookDetails } from "@/components/book-details"

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

  let query = supabase
    .from("listings")
    .select(`
      *,
      seller:profiles!listings_seller_id_fkey(id, full_name, phone, whatsapp),
      course:courses(
        id, name,
        major:majors(
          id, name,
          faculty:faculties(id, name)
        )
      )
    `)
    .eq("id", id)

  if (!isAdmin) {
    query = query.eq("status", "approved")
  }
  const { data: listing } = await query.single()

  if (!listing) {
    notFound()
  }

  const relatedQuery = supabase
    .from("listings")
    .select("id, title, price, condition, images, availability, course:courses(name)")
    .eq("status", "approved")
    .neq("id", listing.id)
    .limit(4)
    .order("created_at", { ascending: false })

  const { data: relatedListings } = listing.course_id
    ? await relatedQuery.eq("course_id", listing.course_id)
    : await relatedQuery

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <BookDetails listing={listing} relatedListings={relatedListings || []} />
      </main>
      <Footer />
    </div>
  )
}
