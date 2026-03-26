"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { CheckCircle, ExternalLink, MessageCircle, RefreshCw, ShieldAlert, Trash2, XCircle } from "lucide-react"

const AdminSecurityPanel = dynamic(
  () => import("@/components/admin/admin-security-panel").then((m) => m.AdminSecurityPanel),
  { loading: () => <p className="p-4 text-sm text-muted-foreground">جاري تحميل الأمان…</p> },
)

type Listing = {
  id: string
  title: string
  price: number
  status: "pending_review" | "approved" | "rejected" | "sold"
  availability: "available" | "reserved" | "sold"
  views_count: number
  updated_at: string
  created_at: string
  seller_id?: string
  course_id?: string
  rejection_reason?: string | null
  seller?: {
    id: string
    full_name: string | null
    phone: string | null
    whatsapp: string | null
    email: string | null
  } | null
  course?: { id: string; name: string } | null
}

type AccountStatus = "active" | "suspended" | "banned"

type User = {
  id: string
  full_name: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  role: "user" | "admin"
  created_at: string
  is_active: boolean
  account_status: AccountStatus
}

type SuperAdminRow = {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  account_status: string
  created_at: string
}

type Report = {
  id: string
  reason: string
  details: string | null
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  created_at: string
  listing: { id: string; title: string; seller_id?: string } | null
  reporter: { id: string; full_name: string | null } | null
  listingSeller: { id: string; full_name: string | null; phone: string | null; whatsapp: string | null } | null
}

type Faculty = {
  id: string
  name: string
}

type Major = {
  id: string
  faculty_id: string
  name: string
}

type Course = {
  id: string
  major_id: string
  name: string
}

type PlatformStats = {
  approvedTotal: number
  pendingTotal: number
  soldTotal: number
  rejectedTotal: number
  homeSpotlightCount: number
}

type Props = {
  listings: Listing[]
  platformStats: PlatformStats
  users: User[]
  viewerUserId: string
  isSuperAdmin?: boolean
  superAdmins?: SuperAdminRow[]
  reports: Report[]
  sales: {
    id: string
    buyer_name: string
    buyer_phone: string
    buyer_email: string | null
    reference_code: string
    created_at: string
    listing: { id: string; title: string } | null
    seller: { id: string; full_name: string | null } | null
    buyer: { id: string; full_name: string | null } | null
  }[]
  sellerReviews: {
    id: string
    rating: number
    comment: string | null
    created_at: string
    listing: { id: string; title: string } | null
    seller: { id: string; full_name: string | null } | null
    reviewer: { id: string; full_name: string | null } | null
  }[]
  faculties: Faculty[]
  majors: Major[]
  courses: Course[]
}

const listingStatusLabel: Record<string, string> = {
  pending_review: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  sold: "مباع",
}

const reportStatusLabel: Record<string, string> = {
  pending: "قيد المراجعة",
  reviewed: "تمت المراجعة",
  resolved: "تم الحل",
  dismissed: "مرفوض",
}

const reportReasonLabel: Record<string, string> = {
  inappropriate: "محتوى غير لائق",
  spam: "إعلان مزعج",
  fake: "إعلان وهمي",
  offensive: "محتوى مسيء",
  other: "سبب آخر",
}

const availabilityLabel: Record<string, string> = {
  available: "متاح",
  reserved: "محجوز",
  sold: "مباع (توفر)",
}

const accountStatusLabel: Record<AccountStatus, string> = {
  active: "نشط",
  suspended: "معلّق",
  banned: "محظور",
}

export function AdminDashboard({
  listings: initialListings,
  platformStats,
  users: initialUsers,
  viewerUserId,
  isSuperAdmin = false,
  superAdmins: initialSuperAdmins = [],
  reports: initialReports,
  sales: initialSales,
  sellerReviews: initialSellerReviews,
  faculties: initialFaculties,
  majors: initialMajors,
  courses: initialCourses,
}: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [listings, setListings] = useState<Listing[]>(initialListings)
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [superAdmins, setSuperAdmins] = useState<SuperAdminRow[]>(initialSuperAdmins)
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [sales] = useState<Props["sales"]>(initialSales)
  const [sellerReviews] = useState<Props["sellerReviews"]>(initialSellerReviews)
  const [faculties, setFaculties] = useState<Faculty[]>(initialFaculties)
  const [majors, setMajors] = useState<Major[]>(initialMajors)
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [listingFilter, setListingFilter] = useState<"all" | "pending_review" | "approved" | "rejected">("all")
  const [userSearch, setUserSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  const [newFacultyName, setNewFacultyName] = useState("")
  const [newMajorFaculty, setNewMajorFaculty] = useState("")
  const [newMajorName, setNewMajorName] = useState("")
  const [newCourseMajor, setNewCourseMajor] = useState("")
  const [newCourseName, setNewCourseName] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    setListings(initialListings)
  }, [initialListings])

  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  useEffect(() => {
    setSuperAdmins(initialSuperAdmins)
  }, [initialSuperAdmins])

  useEffect(() => {
    setReports(initialReports)
  }, [initialReports])

  useEffect(() => {
    setFaculties(initialFaculties)
  }, [initialFaculties])

  useEffect(() => {
    setMajors(initialMajors)
  }, [initialMajors])

  useEffect(() => {
    setCourses(initialCourses)
  }, [initialCourses])

  useEffect(() => {
    if (!autoRefresh) return
    const id = window.setInterval(() => router.refresh(), 90_000)
    return () => window.clearInterval(id)
  }, [autoRefresh, router])

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") {
        router.refresh()
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [router])

  async function manualRefresh() {
    setRefreshing(true)
    router.refresh()
    window.setTimeout(() => setRefreshing(false), 600)
  }

  const filteredListings =
    listingFilter === "all" ? listings : listings.filter((l) => l.status === listingFilter)

  const q = userSearch.trim().toLowerCase()
  const filteredUsers = q
    ? users.filter((u) => {
        const hay = [
          u.full_name,
          u.email,
          u.phone,
          u.whatsapp,
          u.id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return hay.includes(q)
      })
    : users

  async function updateListingStatus(id: string, status: "approved" | "rejected") {
    setError(null)

    let rejectionReason: string | null = null
    if (status === "rejected") {
      rejectionReason = window.prompt("سبب الرفض (اختياري)") || null
    }

    const { error: updateError } = await supabase
      .from("listings")
      .update({
        status,
        rejection_reason: status === "rejected" ? rejectionReason : null,
      })
      .eq("id", id)

      if (updateError) {
        console.error("Update listing status error:", updateError)
        setError(`فشل تحديث حالة الإعلان: ${updateError.message}`)
        return
      }
    setListings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item)),
    )
    router.refresh()
  }

  async function deleteListing(id: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع.")) return
    setError(null)
    const { data, error: deleteError } = await supabase.from("listings").delete().eq("id", id).select("id")
    if (deleteError) {
      setError(`فشل حذف الإعلان: ${deleteError.message}`)
      return
    }
    if (!data?.length) {
      setError(
        "لم يُحذف أي صف — غالبًا سياسة RLS تمنع الحذف. نفّذ سكربت scripts/011_listings_admin_delete_rls.sql في Supabase (SQL Editor) ثم أعد المحاولة.",
      )
      return
    }
    setListings((prev) => prev.filter((l) => l.id !== id))
    router.refresh()
  }

  async function markReportResolved(reportId: string) {
    await updateReportStatus(reportId, "resolved")
  }

  async function updateReportStatus(reportId: string, status: Report["status"]) {
    setError(null)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const runUpdate = async (patch: Record<string, unknown>) =>
      supabase.from("reports").update(patch).eq("id", reportId).select("id")

    let patch: Record<string, unknown> = { status }
    if (status === "resolved") {
      patch = {
        status,
        resolved_at: new Date().toISOString(),
        ...(user?.id ? { resolved_by: user.id } : {}),
      }
    }

    let { data, error: updateError } = await runUpdate(patch)

    if (status === "resolved" && (updateError || !data?.length)) {
      const retry = await runUpdate({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      if (!retry.error && retry.data?.length) {
        data = retry.data
        updateError = null
      } else if (!retry.error && !retry.data?.length) {
        const minimal = await runUpdate({ status: "resolved" })
        if (!minimal.error && minimal.data?.length) {
          data = minimal.data
          updateError = null
        } else {
          updateError = minimal.error ?? retry.error ?? updateError
        }
      } else {
        updateError = retry.error ?? updateError
      }
    }

    if (updateError || !data?.length) {
      setError(
        updateError?.message ??
          "لم يتم تحديث البلاغ (0 صفوف). طبّق سياسة reports_admin_update من scripts/009_listing_discount_profile_email_rls_fixes.sql أو تحقق من صلاحية المدير.",
      )
      return
    }

    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)))
    router.refresh()
  }

  async function setUserAccountStatus(userId: string, status: AccountStatus) {
    setError(null)
    const { error: rpcError } = await supabase.rpc("admin_set_account_status", {
      p_target_user_id: userId,
      p_status: status,
    })

    if (rpcError) {
      const m = rpcError.message || ""
      if (/only_super_admin_can_manage_admin_accounts/i.test(m)) {
        setError("لا يمكنك إدارة حسابات المدراء إلا بحساب «سوبر أدمن». نفّذ scripts/019_super_admins_config.sql ثم أضف بريدك إلى public.super_admins.")
        return
      }
      if (/cannot_modify_self/i.test(m)) {
        setError("لا يمكنك تعديل حالة حسابك من لوحة الأدمن.")
        return
      }
      setError(
        `فشل تحديث الحساب: ${rpcError.message}. تأكد من تنفيذ scripts/016_account_status_super_admin.sql، ثم scripts/019_super_admins_config.sql في Supabase (SQL Editor).`,
      )
      return
    }

    const isActive = status === "active"
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, is_active: isActive, account_status: status } : u,
      ),
    )
    if (isSuperAdmin) {
      setSuperAdmins((prev) =>
        prev.map((a) =>
          a.id === userId
            ? { ...a, is_active: isActive, account_status: status }
            : a,
        ),
      )
    }
    router.refresh()
  }

  async function createFaculty() {
    if (!newFacultyName.trim()) return
    const { data, error: insertError } = await supabase
      .from("faculties")
      .insert({ name: newFacultyName.trim() })
      .select("id, name")
      .single()

    if (insertError || !data) {
      setError("فشل إضافة الكلية")
      return
    }

    setFaculties((prev) => [data, ...prev])
    setNewFacultyName("")
  }

  async function updateFaculty(faculty: Faculty) {
    const name = window.prompt("اسم الكلية", faculty.name)
    if (!name) return

    const { error: updateError } = await supabase
      .from("faculties")
      .update({ name })
      .eq("id", faculty.id)

    if (updateError) {
      setError("فشل تعديل الكلية")
      return
    }

    setFaculties((prev) =>
      prev.map((f) => (f.id === faculty.id ? { ...f, name } : f)),
    )
  }

  async function deleteFaculty(id: string) {
    if (!window.confirm("هل أنت متأكد من حذف الكلية؟")) return
    const { error: deleteError } = await supabase.from("faculties").delete().eq("id", id)
    if (deleteError) {
      setError("فشل حذف الكلية")
      return
    }
    setFaculties((prev) => prev.filter((f) => f.id !== id))
    setMajors((prev) => prev.filter((m) => m.faculty_id !== id))
    setCourses((prev) => prev.filter((c) => {
      const major = majors.find((m) => m.id === c.major_id)
      return major?.faculty_id !== id
    }))
  }

  async function createMajor() {
    if (!newMajorFaculty || !newMajorName.trim()) return
    const { data, error: insertError } = await supabase
      .from("majors")
      .insert({
        faculty_id: newMajorFaculty,
        name: newMajorName.trim(),
      })
      .select("id, faculty_id, name")
      .single()

    if (insertError || !data) {
      setError("فشل إضافة التخصص")
      return
    }

    setMajors((prev) => [data, ...prev])
    setNewMajorName("")
    setNewMajorFaculty("")
  }

  async function updateMajor(major: Major) {
    const name = window.prompt("اسم التخصص", major.name)
    if (!name) return

    const { error: updateError } = await supabase
      .from("majors")
      .update({ name })
      .eq("id", major.id)

    if (updateError) {
      setError("فشل تعديل التخصص")
      return
    }

    setMajors((prev) =>
      prev.map((m) => (m.id === major.id ? { ...m, name } : m)),
    )
  }

  async function deleteMajor(id: string) {
    if (!window.confirm("هل أنت متأكد من حذف التخصص؟")) return
    const { error: deleteError } = await supabase.from("majors").delete().eq("id", id)
    if (deleteError) {
      setError("فشل حذف التخصص")
      return
    }
    setMajors((prev) => prev.filter((m) => m.id !== id))
    setCourses((prev) => prev.filter((c) => c.major_id !== id))
  }

  async function createCourse() {
    if (!newCourseMajor || !newCourseName.trim()) return
    const { data, error: insertError } = await supabase
      .from("courses")
      .insert({
        major_id: newCourseMajor,
        name: newCourseName.trim(),
      })
      .select("id, major_id, name")
      .single()

    if (insertError || !data) {
      setError("فشل إضافة المادة")
      return
    }

    setCourses((prev) => [data, ...prev])
    setNewCourseMajor("")
    setNewCourseName("")
  }

  async function updateCourse(course: Course) {
    const name = window.prompt("اسم المادة", course.name)
    if (!name) return

    const { error: updateError } = await supabase
      .from("courses")
      .update({ name })
      .eq("id", course.id)

    if (updateError) {
      setError("فشل تعديل المادة")
      return
    }

    setCourses((prev) =>
      prev.map((c) => (c.id === course.id ? { ...c, name } : c)),
    )
  }

  async function deleteCourse(id: string) {
    if (!window.confirm("هل أنت متأكد من حذف المادة؟")) return
    const { error: deleteError } = await supabase.from("courses").delete().eq("id", id)
    if (deleteError) {
      setError("فشل حذف المادة")
      return
    }
    setCourses((prev) => prev.filter((c) => c.id !== id))
  }

  function getFacultyName(facultyId: string) {
    return faculties.find((f) => f.id === facultyId)?.name || "-"
  }

  function getMajorName(majorId: string) {
    return majors.find((m) => m.id === majorId)?.name || "-"
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">لوحة الإدارة</h1>
        <p className="text-muted-foreground">إدارة الإعلانات والمستخدمين والبلاغات والبيانات الأكاديمية</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">ملخص المنصة والرئيسية</CardTitle>
            <CardDescription>
              أرقام تطابق ما يظهر للزوار: المعتمد = المعروض في التصفح والرئيسية (ضمن الـ 12 الأحدث). التحديث التلقائي يعيد
              جلب البيانات من السيرفر كل 90 ثانية (وعند العودة للتبويب) — أخف على السيرفر.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void manualRefresh()} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              تحديث الآن
            </Button>
            <div className="flex items-center gap-2">
              <Switch id="admin-auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <Label htmlFor="admin-auto-refresh" className="text-sm font-normal">
                تحديث تلقائي / 90 ث
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg border bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{platformStats.approvedTotal}</p>
              <p className="text-xs text-muted-foreground">معتمد (ظاهر للزوار)</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{platformStats.homeSpotlightCount}</p>
              <p className="text-xs text-muted-foreground">في شريط الرئيسية (حتى 12)</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{platformStats.pendingTotal}</p>
              <p className="text-xs text-muted-foreground">قيد المراجعة</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{platformStats.rejectedTotal}</p>
              <p className="text-xs text-muted-foreground">مرفوض</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{platformStats.soldTotal}</p>
              <p className="text-xs text-muted-foreground">حالة &quot;مباع&quot; (سجل)</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-center">
              <p className="text-2xl font-bold tabular-nums">{listings.length}</p>
              <p className="text-xs text-muted-foreground">إجمالي الإعلانات بالجدول</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="moderation" className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1.5 bg-muted/50 p-1.5">
          <TabsTrigger value="moderation" className="flex-none">
            مراجعة الإعلانات
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-none">
            المستخدمون
          </TabsTrigger>
          {isSuperAdmin ? (
            <TabsTrigger value="super-admins" className="flex-none border border-amber-500/40 bg-amber-500/10">
              مسؤول أعلى
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="security" className="flex-none">
            الأمن
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex-none">
            البلاغات
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex-none">
            عمليات البيع
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex-none">
            تقييمات البائعين
          </TabsTrigger>
          <TabsTrigger value="faculties" className="flex-none">
            الكليات
          </TabsTrigger>
          <TabsTrigger value="majors" className="flex-none">
            التخصصات
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex-none">
            المواد
          </TabsTrigger>
        </TabsList>

        <TabsContent value="moderation">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>مراجعة الإعلانات</CardTitle>
                <CardDescription>
                 اعتماد أو رفض الإعلانات حسب الحالة — إجمالي الإعلانات: {listings.length} — المعروض حاليًا: {filteredListings.length}
                </CardDescription>
              </div>
              <Select
                value={listingFilter}
                onValueChange={(v: "all" | "pending_review" | "approved" | "rejected") => setListingFilter(v)}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="تصفية الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="pending_review">قيد المراجعة</SelectItem>
                  <SelectItem value="approved">معتمد</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>البائع</TableHead>
                    <TableHead>المادة</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>التوفر</TableHead>
                    <TableHead>المشاهدات</TableHead>
                    <TableHead>آخر تحديث</TableHead>
                    <TableHead>حالة الإعلان</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <Link href={`/book/${listing.id}`} className="hover:text-primary hover:underline">
                          {listing.title}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[220px] align-top text-sm">
                        <div className="space-y-1">
                          <div className="font-medium">{listing.seller?.full_name || "—"}</div>
                          {listing.seller?.email ? (
                            <div className="break-all text-muted-foreground">{listing.seller.email}</div>
                          ) : null}
                          {listing.seller?.phone ? (
                            <div className="text-muted-foreground">هاتف: {listing.seller.phone}</div>
                          ) : null}
                          {listing.seller?.whatsapp ? (
                            <div className="text-muted-foreground">واتساب: {listing.seller.whatsapp}</div>
                          ) : null}
                          {!listing.seller && <span className="text-muted-foreground">لا بيانات بائع</span>}
                        </div>
                      </TableCell>
                      <TableCell>{listing.course?.name ?? "-"}</TableCell>
                      <TableCell>{listing.price} د.أ</TableCell>
                      <TableCell>
                        <Badge variant="outline">{availabilityLabel[listing.availability] ?? listing.availability}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{listing.views_count ?? 0}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(listing.updated_at).toLocaleString("ar-JO")}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary">{listingStatusLabel[listing.status]}</Badge>
                          {listing.status === "rejected" && listing.rejection_reason ? (
                            <span className="max-w-[180px] text-xs text-muted-foreground" title={listing.rejection_reason}>
                              سبب: {listing.rejection_reason.length > 60 ? `${listing.rejection_reason.slice(0, 60)}…` : listing.rejection_reason}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="ghost" className="gap-1" asChild>
                            <Link href={`/book/${listing.id}`}>
                              <ExternalLink className="h-4 w-4" />
                              عرض
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => updateListingStatus(listing.id, "approved")}
                            disabled={listing.status === "approved"}
                          >
                            <CheckCircle className="h-4 w-4" />
                            اعتماد
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-destructive hover:text-destructive"
                            onClick={() => updateListingStatus(listing.id, "rejected")}
                            disabled={listing.status === "rejected"}
                          >
                            <XCircle className="h-4 w-4" />
                            رفض
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            onClick={() => deleteListing(listing.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>إدارة المستخدمين</CardTitle>
              <CardDescription>
                سجل كامل للمستخدمين مع البريد. استخدم البحث بالاسم، البريد، الهاتف، أو المعرف.
              </CardDescription>
              <div className="max-w-md pt-2">
                <Label htmlFor="admin-user-search">بحث</Label>
                <Input
                  id="admin-user-search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ابحث عن مستخدم…"
                  className="mt-1"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>واتساب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.full_name || "مستخدم"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{user.email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "outline"}>
                          {user.role === "admin" ? "مدير" : "مستخدم"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>{user.whatsapp || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.account_status === "active" ? "outline" : "destructive"
                          }
                          className="whitespace-nowrap"
                        >
                          {accountStatusLabel[user.account_status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString("ar-JO")}</TableCell>
                      <TableCell>
                        {user.id === viewerUserId ? (
                          <span className="text-xs text-muted-foreground">حسابك الحالي</span>
                        ) : user.role === "admin" && !isSuperAdmin ? (
                          <span className="text-xs text-muted-foreground">
                            تعديل المدراء من تبويب «مسؤول أعلى» فقط
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {user.account_status !== "active" ? (
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8"
                                onClick={() => void setUserAccountStatus(user.id, "active")}
                              >
                                تفعيل
                              </Button>
                            ) : null}
                            {user.account_status !== "suspended" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => {
                                  if (window.confirm("تعليق الحساب مؤقتاً؟")) {
                                    void setUserAccountStatus(user.id, "suspended")
                                  }
                                }}
                              >
                                تعليق
                              </Button>
                            ) : null}
                            {user.account_status !== "banned" ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "حظر الحساب؟ يمكن إعادة التفعيل لاحقاً من نفس الجدول.",
                                    )
                                  ) {
                                    void setUserAccountStatus(user.id, "banned")
                                  }
                                }}
                              >
                                حظر
                              </Button>
                            ) : null}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {isSuperAdmin ? (
          <TabsContent value="super-admins">
            <Card className="border-amber-500/30">
              <CardHeader>
                <CardTitle>المسؤول الأعلى — المدراء المسجّلون</CardTitle>
                <CardDescription>
                  يظهر هذا القسم فقط عند إضافة بريدك إلى جدول{" "}
                  <code className="rounded bg-muted px-1">public.super_admins</code> (نفّذ{" "}
                  <code className="rounded bg-muted px-1">scripts/019_super_admins_config.sql</code>). يمكنك تعليق
                  أو حظر حسابات المدراء أو إعادة تفعيلها (لا يمكن تعديل حسابك من هنا).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>البريد</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>تاريخ الإنشاء</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {superAdmins.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="max-w-[200px] truncate text-sm">{row.email}</TableCell>
                        <TableCell>{row.full_name || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              (row.account_status || "active") === "active"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {accountStatusLabel[
                              (row.account_status === "banned"
                                ? "banned"
                                : row.account_status === "suspended"
                                  ? "suspended"
                                  : "active") as AccountStatus
                            ]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(row.created_at).toLocaleDateString("ar-JO")}
                        </TableCell>
                        <TableCell>
                          {row.id === viewerUserId ? (
                            <span className="text-xs text-muted-foreground">حسابك</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {(row.account_status || "active") !== "active" ? (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-8"
                                  onClick={() =>
                                    void setUserAccountStatus(row.id, "active")
                                  }
                                >
                                  تفعيل
                                </Button>
                              ) : null}
                              {(row.account_status || "active") !== "suspended" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8"
                                  onClick={() => {
                                    if (window.confirm("تعليق هذا المدير؟")) {
                                      void setUserAccountStatus(row.id, "suspended")
                                    }
                                  }}
                                >
                                  تعليق
                                </Button>
                              ) : null}
                              {(row.account_status || "active") !== "banned" ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8"
                                  onClick={() => {
                                    if (window.confirm("حظر هذا المدير؟")) {
                                      void setUserAccountStatus(row.id, "banned")
                                    }
                                  }}
                                >
                                  حظر
                                </Button>
                              ) : null}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        <TabsContent value="security">
          <AdminSecurityPanel />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>إدارة البلاغات</CardTitle>
              <CardDescription>مراجعة البلاغات وتحديث حالتها</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الإعلان</TableHead>
                    <TableHead>صاحب الإعلان</TableHead>
                    <TableHead>السبب</TableHead>
                    <TableHead>التفاصيل</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.reporter?.full_name || "-"}</TableCell>
                      <TableCell>{report.listing?.title || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <span>{report.listingSeller?.full_name || "—"}</span>
                          <div className="flex flex-wrap gap-1">
                            {report.listing?.id && (
                              <Button size="sm" variant="outline" className="h-7 gap-1 px-2" asChild>
                                <Link href={`/book/${report.listing.id}`}>
                                  <ExternalLink className="h-3 w-3" />
                                  الإعلان
                                </Link>
                              </Button>
                            )}
                            {(report.listingSeller?.whatsapp || report.listingSeller?.phone) && (
                              <Button size="sm" variant="outline" className="h-7 gap-1 px-2" asChild>
                                <a
                                  href={`https://wa.me/${(report.listingSeller?.whatsapp || report.listingSeller?.phone || "").replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                  تواصل
                                </a>
                              </Button>
                            )}
                            {report.listingSeller?.id && (
                              <span className="text-[10px] text-muted-foreground font-mono self-center px-1">
                                {report.listingSeller.id.slice(0, 8)}…
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{reportReasonLabel[report.reason] ?? report.reason}</TableCell>
                      <TableCell className="max-w-[240px] truncate">{report.details || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={report.status === "resolved" ? "default" : "secondary"}>
                          {reportStatusLabel[report.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markReportResolved(report.id)}
                            disabled={report.status === "resolved"}
                            className="gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            تم الحل
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateReportStatus(report.id, "reviewed")}
                            disabled={report.status === "reviewed"}
                          >
                            تمت المراجعة
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateReportStatus(report.id, "dismissed")}
                            disabled={report.status === "dismissed"}
                          >
                            رفض البلاغ
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faculties">
          <Card>
            <CardHeader>
              <CardTitle>إدارة الكليات</CardTitle>
              <CardDescription>إضافة/تعديل/حذف الكليات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Label>اسم الكلية</Label>
                  <Input value={newFacultyName} onChange={(e) => setNewFacultyName(e.target.value)} placeholder="أدخل اسم الكلية" />
                </div>
                <div className="flex items-end">
                  <Button onClick={createFaculty}>إضافة كلية</Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faculties.map((faculty) => (
                    <TableRow key={faculty.id}>
                      <TableCell>{faculty.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateFaculty(faculty)}>
                            تعديل
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteFaculty(faculty.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="majors">
          <Card>
            <CardHeader>
              <CardTitle>إدارة التخصصات</CardTitle>
              <CardDescription>إضافة/تعديل/حذف التخصصات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <div className="w-48 space-y-2">
                  <Label>الكلية</Label>
                  <Select value={newMajorFaculty} onValueChange={setNewMajorFaculty}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الكلية" />
                    </SelectTrigger>
                    <SelectContent>
                      {faculties.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label>اسم التخصص</Label>
                  <Input value={newMajorName} onChange={(e) => setNewMajorName(e.target.value)} placeholder="أدخل اسم التخصص" />
                </div>
                <div className="flex items-end">
                  <Button onClick={createMajor}>إضافة تخصص</Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكلية</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {majors.map((major) => (
                    <TableRow key={major.id}>
                      <TableCell>{getFacultyName(major.faculty_id)}</TableCell>
                      <TableCell>{major.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateMajor(major)}>
                            تعديل
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteMajor(major.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>سجل عمليات البيع</CardTitle>
              <CardDescription>عرض جميع عمليات البيع المسجلة بين البائع والمشتري</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>مرجع العملية</TableHead>
                    <TableHead>الإعلان</TableHead>
                    <TableHead>البائع</TableHead>
                    <TableHead>المشتري</TableHead>
                    <TableHead>رقم المشتري</TableHead>
                    <TableHead>بريد المشتري</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.reference_code}</TableCell>
                      <TableCell>{sale.listing?.title || "-"}</TableCell>
                      <TableCell>{sale.seller?.full_name || "-"}</TableCell>
                      <TableCell>{sale.buyer?.full_name || sale.buyer_name || "-"}</TableCell>
                      <TableCell>{sale.buyer_phone}</TableCell>
                      <TableCell className="max-w-[200px] truncate" dir="ltr">
                        {sale.buyer_email || "—"}
                      </TableCell>
                      <TableCell>{new Date(sale.created_at).toLocaleDateString("ar-JO")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>تقييمات البائعين</CardTitle>
              <CardDescription>عرض تقييم النجوم والتعليقات المرسلة بعد إتمام البيع</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>البائع</TableHead>
                    <TableHead>المقيّم</TableHead>
                    <TableHead>الإعلان</TableHead>
                    <TableHead>التقييم</TableHead>
                    <TableHead>التعليق</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellerReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>{review.seller?.full_name || "-"}</TableCell>
                      <TableCell>{review.reviewer?.full_name || "-"}</TableCell>
                      <TableCell>{review.listing?.title || "-"}</TableCell>
                      <TableCell>{review.rating} / 5</TableCell>
                      <TableCell className="max-w-[260px] truncate">{review.comment || "-"}</TableCell>
                      <TableCell>{new Date(review.created_at).toLocaleDateString("ar-JO")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>إدارة المواد</CardTitle>
              <CardDescription>إضافة/تعديل/حذف المواد</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <div className="w-48 space-y-2">
                  <Label>التخصص</Label>
                  <Select value={newCourseMajor} onValueChange={setNewCourseMajor}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التخصص" />
                    </SelectTrigger>
                    <SelectContent>
                      {majors.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label>اسم المادة</Label>
                  <Input value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} placeholder="أدخل اسم المادة" />
                </div>
                <div className="flex items-end">
                  <Button onClick={createCourse}>إضافة مادة</Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التخصص</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>{getMajorName(course.major_id)}</TableCell>
                      <TableCell>{course.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateCourse(course)}>
                            تعديل
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteCourse(course.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Button variant="outline" onClick={() => router.refresh()}>
          تحديث البيانات
        </Button>
      </div>
    </div>
  )
}

