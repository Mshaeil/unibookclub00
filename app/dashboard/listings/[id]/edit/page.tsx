import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EditListingForm } from "@/components/dashboard/edit-listing-form"
import { mapCatalogForForm } from "@/lib/utils/catalog-label"

export default async function EditListingPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/dashboard")
  }

  // Fetch listing
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("seller_id", user.id)
    .single()

  if (!listing) {
    notFound()
  }

  // Fetch faculties, majors, courses
  const [{ data: facultiesRaw }, { data: majorsRaw }, { data: coursesRaw }] = await Promise.all([
    supabase.from("faculties").select("id, name_ar, name_en").order("id"),
    supabase.from("majors").select("id, faculty_id, name_ar, name_en").order("id"),
    supabase.from("courses").select("id, major_id, name_ar, name_en").order("id"),
  ])

  const faculties = mapCatalogForForm(facultiesRaw)
  const majors = mapCatalogForForm(majorsRaw)
  const courses = mapCatalogForForm(coursesRaw)

  // Get faculty and major IDs from course if exists
  let facultyId = ""
  let majorId = ""
  
  if (listing.course_id) {
    const course = courses?.find(c => c.id === listing.course_id)
    if (course) {
      majorId = course.major_id
      const major = majors?.find(m => m.id === course.major_id)
      if (major) {
        facultyId = major.faculty_id
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">تعديل الإعلان</h1>
        <p className="text-muted-foreground mb-8">عدّل تفاصيل كتابك</p>
        
        <EditListingForm 
          listing={listing}
          faculties={faculties || []}
          majors={majors || []}
          courses={courses || []}
          initialFacultyId={facultyId}
          initialMajorId={majorId}
        />
      </div>
    </div>
  )
}
