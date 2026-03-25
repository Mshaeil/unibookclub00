import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/admin")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

const [
  listingsResult,
  usersResult,
  reportsByReporterResult,
  reportsByUserResult,
  salesResult,
  sellerReviewsResult,
  facultiesResult,
  majorsResult,
  coursesResult,
] = await Promise.all([
  supabase
  .from("listings")
  .select("id, title, price, status, availability, created_at, seller_id, course_id")
  .order("created_at", { ascending: false }),
  supabase
    .from("profiles")
    .select("id, full_name, phone, whatsapp, role, created_at, is_active, email")
    .order("created_at", { ascending: false }),
  supabase
    .from("reports")
    .select("id, reason, details, status, created_at, listing_id, reporter_id")
    .order("created_at", { ascending: false }),
  supabase
    .from("reports")
    .select("id, reason, details, status, created_at, listing_id, user_id")
    .order("created_at", { ascending: false }),
  supabase
    .from("sales")
    .select("id, listing_id, seller_id, buyer_id, buyer_name, buyer_phone, reference_code, created_at")
    .order("created_at", { ascending: false }),
  supabase
    .from("seller_reviews")
    .select("id, seller_id, reviewer_id, listing_id, rating, comment, created_at")
    .order("created_at", { ascending: false }),
  supabase.from("faculties").select("id, name_ar, name").order("id"),
  supabase.from("majors").select("id, faculty_id, name_ar, name").order("id"),
  supabase.from("courses").select("id, major_id, name_ar, name").order("id"),
])

if (listingsResult.error) {
  if (listingsResult.error) {
    console.error("Admin listings query error:", {
      message: listingsResult.error.message,
      details: listingsResult.error.details,
      hint: listingsResult.error.hint,
      code: listingsResult.error.code,
    })
  }
}
if (usersResult.error) {
  console.error("Admin users query error:", usersResult.error)
}
const reportsResult =
  !reportsByReporterResult.error
    ? reportsByReporterResult
    : !reportsByUserResult.error
      ? reportsByUserResult
      : reportsByReporterResult

if (reportsResult.error) {
  console.error("Admin reports query error:", reportsResult.error)
}
if (salesResult.error && salesResult.error.code !== "PGRST205") {
  console.error("Admin sales query error:", salesResult.error)
}
if (sellerReviewsResult.error && sellerReviewsResult.error.code !== "PGRST205") {
  console.error("Admin seller reviews query error:", sellerReviewsResult.error)
}
if (facultiesResult.error) {
  console.error("Admin faculties query error:", facultiesResult.error)
}
if (majorsResult.error) {
  console.error("Admin majors query error:", majorsResult.error)
}
if (coursesResult.error) {
  console.error("Admin courses query error:", coursesResult.error)
}

const listings = listingsResult.data || []
const users = (usersResult.data || []).map((u: {
  id: string
  full_name: string | null
  phone: string | null
  whatsapp: string | null
  role: "user" | "admin"
  created_at: string
  is_active?: boolean | null
  email?: string | null
}) => ({
  ...u,
  is_active: u.is_active !== false,
  email: u.email ?? null,
}))
const rawReports = (reportsResult.data || []) as {
  id: string
  reason: string
  details: string | null
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  created_at: string
  listing_id: string
  reporter_id?: string
  user_id?: string
}[]
const rawSales = ((salesResult.error && salesResult.error.code === "PGRST205")
  ? []
  : salesResult.data || []) as {
  id: string
  listing_id: string
  seller_id: string
  buyer_id: string | null
  buyer_name: string
  buyer_phone: string
  reference_code: string
  created_at: string
}[]
const rawSellerReviews = ((sellerReviewsResult.error && sellerReviewsResult.error.code === "PGRST205")
  ? []
  : sellerReviewsResult.data || []) as {
  id: string
  seller_id: string
  reviewer_id: string
  listing_id: string
  rating: number
  comment: string | null
  created_at: string
}[]
const faculties = (facultiesResult.data || []).map((f: { id: string; name_ar?: string | null; name?: string | null }) => ({
  id: f.id,
  name: f.name_ar || f.name || "-",
}))
const majors = (majorsResult.data || []).map((m: { id: string; faculty_id: string; name_ar?: string | null; name?: string | null }) => ({
  id: m.id,
  faculty_id: m.faculty_id,
  name: m.name_ar || m.name || "-",
}))
const courses = (coursesResult.data || []).map((c: { id: string; major_id: string; name_ar?: string | null; name?: string | null }) => ({
  id: c.id,
  major_id: c.major_id,
  name: c.name_ar || c.name || "-",
}))

const listingIds = Array.from(new Set(rawReports.map((r) => r.listing_id).filter(Boolean)))
const reporterIds = Array.from(new Set(rawReports.map((r) => r.reporter_id || r.user_id).filter(Boolean))) as string[]
const salesListingIds = Array.from(new Set(rawSales.map((s) => s.listing_id).filter(Boolean)))
const salesSellerIds = Array.from(new Set(rawSales.map((s) => s.seller_id).filter(Boolean)))
const salesBuyerIds = Array.from(new Set(rawSales.map((s) => s.buyer_id).filter(Boolean))) as string[]
const reviewSellerIds = Array.from(new Set(rawSellerReviews.map((r) => r.seller_id).filter(Boolean)))
const reviewReviewerIds = Array.from(new Set(rawSellerReviews.map((r) => r.reviewer_id).filter(Boolean)))
const reviewListingIds = Array.from(new Set(rawSellerReviews.map((r) => r.listing_id).filter(Boolean)))
const allProfileIds = Array.from(new Set([
  ...reporterIds,
  ...salesSellerIds,
  ...salesBuyerIds,
  ...reviewSellerIds,
  ...reviewReviewerIds,
]))
const allListingIds = Array.from(new Set([
  ...listingIds,
  ...salesListingIds,
  ...reviewListingIds,
]))

const allListingsHydrationResult = allListingIds.length
  ? await supabase.from("listings").select("id, title, seller_id").in("id", allListingIds)
  : { data: [], error: null as null }

if (allListingsHydrationResult.error) {
  console.error("Admin listings hydration query error:", allListingsHydrationResult.error)
}

const listingRows = (allListingsHydrationResult.data || []) as {
  id: string
  title: string
  seller_id: string
}[]
const sellerIdsFromListings = listingRows.map((l) => l.seller_id).filter(Boolean)
const mergedProfileIds = Array.from(new Set([...allProfileIds, ...sellerIdsFromListings]))

const allUsersHydrationResult = mergedProfileIds.length
  ? await supabase.from("profiles").select("id, full_name, phone, whatsapp").in("id", mergedProfileIds)
  : { data: [], error: null as null }

if (allUsersHydrationResult.error) {
  console.error("Admin users hydration query error:", allUsersHydrationResult.error)
}

const listingById = new Map(listingRows.map((l) => [l.id, l]))
const userById = new Map(
  (allUsersHydrationResult.data || []).map((u: { id: string; full_name: string | null; phone: string | null; whatsapp: string | null }) => [
    u.id,
    u,
  ]),
)

const reports = rawReports.map((r) => {
  const listingRow = listingById.get(r.listing_id)
  const sellerId = listingRow?.seller_id
  return {
    id: r.id,
    reason: r.reason,
    details: r.details,
    status: r.status,
    created_at: r.created_at,
    listing: listingRow
      ? { id: listingRow.id, title: listingRow.title, seller_id: listingRow.seller_id }
      : null,
    reporter: userById.get((r.reporter_id || r.user_id) as string) || null,
    listingSeller: sellerId ? userById.get(sellerId) || null : null,
  }
})
const sales = rawSales.map((s) => ({
  id: s.id,
  buyer_name: s.buyer_name,
  buyer_phone: s.buyer_phone,
  reference_code: s.reference_code,
  created_at: s.created_at,
  listing: listingById.get(s.listing_id) || null,
  seller: userById.get(s.seller_id) || null,
  buyer: s.buyer_id ? userById.get(s.buyer_id) || null : null,
}))
const sellerReviews = rawSellerReviews.map((r) => ({
  id: r.id,
  rating: r.rating,
  comment: r.comment,
  created_at: r.created_at,
  listing: listingById.get(r.listing_id) || null,
  seller: userById.get(r.seller_id) || null,
  reviewer: userById.get(r.reviewer_id) || null,
}))

  return (
    <AdminDashboard
      listings={(listings || []) as Parameters<typeof AdminDashboard>[0]["listings"]}
      users={users || []}
      reports={reports as Parameters<typeof AdminDashboard>[0]["reports"]}
      sales={sales as Parameters<typeof AdminDashboard>[0]["sales"]}
      sellerReviews={sellerReviews as Parameters<typeof AdminDashboard>[0]["sellerReviews"]}
      faculties={faculties || []}
      majors={majors || []}
      courses={courses || []}
    />
  )
}

