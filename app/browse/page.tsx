import { createPublicSupabaseClient } from "@/lib/supabase/public-server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BrowseContent } from "@/components/browse/browse-content"

/** كاش لكل تركيبة فلاتر — أسرع من SSR ديناميكي كامل مع cookies */
export const revalidate = 30

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const supabase = createPublicSupabaseClient()

  const search = typeof params.search === "string" ? params.search : ""
  const faculty = typeof params.faculty === "string" ? params.faculty : ""
  const major = typeof params.major === "string" ? params.major : ""
  const course = typeof params.course === "string" ? params.course : ""
  const itemType = typeof params.itemType === "string" ? params.itemType : ""
  const condition = typeof params.condition === "string" ? params.condition : ""
  const minPrice =
    typeof params.minPrice === "string" ? parseFloat(params.minPrice) : undefined
  const maxPrice =
    typeof params.maxPrice === "string" ? parseFloat(params.maxPrice) : undefined
  const sort = typeof params.sort === "string" ? params.sort : "latest"
  const pageParam = typeof params.page === "string" ? parseInt(params.page) : 1
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const perPage = 12

  let query = supabase
    .from("listings")
    .select(
      `
      *,
      seller:profiles!listings_seller_id_fkey(
        full_name,
        phone,
        whatsapp
      ),
      course:courses(
        id,
        code,
        name_ar,
        name_en,
        major:majors(
          id,
          name_ar,
          name_en,
          faculty:faculties(
            id,
            name_ar,
            name_en
          )
        )
      )
    `,
      { count: "exact" }
    )
    .eq("status", "approved")

  if (search) {
    const orParts = [
      `title.ilike.%${search}%`,
      `author.ilike.%${search}%`,
    ]

    const { data: matchedCourses } = await supabase
      .from("courses")
      .select("id")
      .or(`name_ar.ilike.%${search}%,name_en.ilike.%${search}%,code.ilike.%${search}%`)

    if (matchedCourses?.length) {
      orParts.push(
        `course_id.in.(${matchedCourses.map((c: { id: string }) => c.id).join(",")})`
      )
    }

    query = query.or(orParts.join(","))
  }

  if (course) {
    query = query.eq("course_id", course)
  } else if (major) {
    const { data: majorCourses } = await supabase
      .from("courses")
      .select("id")
      .eq("major_id", major)

    const courseIds = majorCourses?.map((c) => c.id) || []
    if (courseIds.length > 0) {
      query = query.in("course_id", courseIds)
    } else {
      query = query.eq("id", "__no_results__")
    }
  } else if (faculty) {
    const { data: facultyMajors } = await supabase
      .from("majors")
      .select("id")
      .eq("faculty_id", faculty)

    const majorIds = facultyMajors?.map((m) => m.id) || []

    if (majorIds.length > 0) {
      const { data: facultyCourses } = await supabase
        .from("courses")
        .select("id")
        .in("major_id", majorIds)

      const courseIds = facultyCourses?.map((c) => c.id) || []
      if (courseIds.length > 0) {
        query = query.in("course_id", courseIds)
      } else {
        query = query.eq("id", "__no_results__")
      }
    } else {
      query = query.eq("id", "__no_results__")
    }
  }

  if (condition) {
    query = query.eq("condition", condition)
  }

  if (itemType) {
    query = query.eq("item_type", itemType)
  }

  if (minPrice !== undefined) {
    query = query.gte("price", minPrice)
  }

  if (maxPrice !== undefined) {
    query = query.lte("price", maxPrice)
  }

  switch (sort) {
    case "price_low":
      query = query.order("price", { ascending: true })
      break
    case "price_high":
      query = query.order("price", { ascending: false })
      break
    default:
      query = query.order("created_at", { ascending: false })
  }

  const from = (page - 1) * perPage
  const to = from + perPage - 1
  query = query.range(from, to)

  const { data: listings, count, error } = await query

  if (error) {
    console.error("Browse query error:", error)
  }

  const { data: faculties } = await supabase
    .from("faculties")
    .select("id, name_ar, name_en")
    .order("name_ar", { ascending: true })

  const { data: majors } = await supabase
    .from("majors")
    .select("id, faculty_id, name_ar, name_en")
    .order("name_ar", { ascending: true })

  const { data: courses } = await supabase
    .from("courses")
    .select("id, major_id, code, name_ar, name_en")
    .order("name_ar", { ascending: true })

  const { data: soldListingsForTopSellers } = await supabase
    .from("listings")
    .select("seller_id, seller:profiles!listings_seller_id_fkey(full_name)")
    .eq("status", "sold")

  const topSellerMap = new Map<string, { seller_id: string; full_name: string; sold_count: number }>()
  for (const row of soldListingsForTopSellers || []) {
    const sellerId = row.seller_id as string | null
    const sellerArr = row.seller as { full_name: string | null }[] | null
    const seller = Array.isArray(sellerArr) ? sellerArr[0] : null
    if (!sellerId) continue
    const existing = topSellerMap.get(sellerId)
    if (existing) {
      existing.sold_count += 1
    } else {
      topSellerMap.set(sellerId, {
        seller_id: sellerId,
        full_name: seller?.full_name || "",
        sold_count: 1,
      })
    }
  }
  const topSellers = Array.from(topSellerMap.values())
    .sort((a, b) => b.sold_count - a.sold_count)
    .slice(0, 5)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <BrowseContent
          listings={listings || []}
          topSellers={topSellers}
          totalCount={count || 0}
          currentPage={page}
          perPage={perPage}
          faculties={faculties || []}
          majors={majors || []}
          courses={courses || []}
          filters={{
            search,
            faculty,
            major,
            course,
            itemType,
            condition,
            minPrice,
            maxPrice,
            sort,
          }}
        />
      </main>
      <Footer />
    </div>
  )
}