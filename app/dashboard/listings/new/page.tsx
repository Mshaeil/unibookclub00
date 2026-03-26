import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NewListingForm } from "@/components/dashboard/new-listing-form"

export default async function NewListingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/dashboard/listings/new")
  }

  // Fetch faculties
  const { data: faculties } = await supabase
    .from("faculties")
    .select("id, name")
    .order("id")

  // Fetch majors
  const { data: majors } = await supabase
    .from("majors")
    .select("id, faculty_id, name")
    .order("id")

  // Fetch courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, major_id, name")
    .order("id")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">أضف كتاباً أو ملخصاً للبيع</h1>
        <p className="text-muted-foreground mb-8">
          املأ التفاصيل لعرض كتابك أو ملخصك أو ملزمتك — المنصة موجّهة للمحتوى الدراسي (كتب وملخصات).
        </p>
        
        <NewListingForm 
          faculties={faculties || []}
          majors={majors || []}
          courses={courses || []}
        />
      </div>
    </div>
  )
}
