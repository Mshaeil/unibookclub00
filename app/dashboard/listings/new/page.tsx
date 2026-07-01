import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NewListingForm } from "@/components/dashboard/new-listing-form"
import { mapCatalogForForm } from "@/lib/utils/catalog-label"

export const dynamic = "force-dynamic"

export default async function NewListingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/dashboard/listings/new")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("seller_status")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.seller_status !== "verified") {
    redirect("/dashboard/become-seller")
  }

  const [{ data: facultiesRaw }, { data: majorsRaw }, { data: coursesRaw }] = await Promise.all([
    supabase.from("faculties").select("id, name_ar, name_en").order("id"),
    supabase.from("majors").select("id, faculty_id, name_ar, name_en").order("id"),
    supabase.from("courses").select("id, major_id, name_ar, name_en").order("id"),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">أضف كتاباً أو ملخصاً للبيع</h1>
        <p className="text-muted-foreground mb-8">
          املأ التفاصيل لعرض كتابك أو ملخصك أو ملزمتك — المنصة موجّهة للمحتوى الدراسي (كتب وملخصات).
        </p>

        <NewListingForm
          faculties={mapCatalogForForm(facultiesRaw)}
          majors={mapCatalogForForm(majorsRaw)}
          courses={mapCatalogForForm(coursesRaw)}
        />
      </div>
    </div>
  )
}
