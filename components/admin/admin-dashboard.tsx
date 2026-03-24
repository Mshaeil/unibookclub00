"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { CheckCircle, ExternalLink, ShieldAlert, Trash2, XCircle } from "lucide-react"

type Listing = {
  id: string
  title: string
  price: number
  status: "pending_review" | "approved" | "rejected" | "sold"
  availability: "available" | "reserved" | "sold"
  created_at: string
  seller: { id: string; full_name: string | null } | null
  course: { id: string; name: string } | null
}

type User = {
  id: string
  full_name: string | null
  phone: string | null
  whatsapp: string | null
  role: "user" | "admin"
  created_at: string
  is_active: boolean
}

type Report = {
  id: string
  reason: string
  details: string | null
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  created_at: string
  listing: { id: string; title: string } | null
  reporter: { id: string; full_name: string | null } | null
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

type Props = {
  listings: Listing[]
  users: User[]
  reports: Report[]
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

export function AdminDashboard({
  listings: initialListings,
  users: initialUsers,
  reports: initialReports,
  faculties: initialFaculties,
  majors: initialMajors,
  courses: initialCourses,
}: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [listings, setListings] = useState<Listing[]>(initialListings)
  const [users] = useState<User[]>(initialUsers)
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [faculties, setFaculties] = useState<Faculty[]>(initialFaculties)
  const [majors, setMajors] = useState<Major[]>(initialMajors)
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [listingFilter, setListingFilter] = useState<"all" | "pending_review" | "approved" | "rejected">("pending_review")
  const [error, setError] = useState<string | null>(null)

  const [newFacultyName, setNewFacultyName] = useState("")
  const [newMajorFaculty, setNewMajorFaculty] = useState("")
  const [newMajorName, setNewMajorName] = useState("")
  const [newCourseMajor, setNewCourseMajor] = useState("")
  const [newCourseName, setNewCourseName] = useState("")

  const filteredListings =
    listingFilter === "all" ? listings : listings.filter((l) => l.status === listingFilter)

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
      setError("فشل تحديث حالة الإعلان")
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
    const { error: deleteError } = await supabase.from("listings").delete().eq("id", id)
    if (deleteError) {
      setError("فشل حذف الإعلان")
      return
    }
    setListings((prev) => prev.filter((l) => l.id !== id))
    router.refresh()
  }

  async function markReportResolved(reportId: string) {
    setError(null)
    const { error: updateError } = await supabase
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", reportId)

    if (updateError) {
      setError("فشل تحديث حالة البلاغ")
      return
    }

    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r)),
    )
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

      <Tabs defaultValue="moderation" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="moderation">مراجعة الإعلانات</TabsTrigger>
          <TabsTrigger value="users">المستخدمون</TabsTrigger>
          <TabsTrigger value="reports">البلاغات</TabsTrigger>
          <TabsTrigger value="faculties">الكليات</TabsTrigger>
          <TabsTrigger value="majors">التخصصات</TabsTrigger>
          <TabsTrigger value="courses">المواد</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>مراجعة الإعلانات</CardTitle>
                <CardDescription>اعتماد أو رفض الإعلانات حسب الحالة</CardDescription>
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
                    <TableHead>الحالة</TableHead>
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
                      <TableCell>{listing.seller?.full_name || "مستخدم"}</TableCell>
                      <TableCell>{listing.course?.name ?? "-"}</TableCell>
                      <TableCell>{listing.price} د.أ</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{listingStatusLabel[listing.status]}</Badge>
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
              <CardDescription>عرض معلومات المستخدمين الأساسية</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>واتساب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ التسجيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.full_name || "مستخدم"}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "outline"}>
                          {user.role === "admin" ? "مدير" : "مستخدم"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>{user.whatsapp || "-"}</TableCell>
                      <TableCell>{user.is_active ? "نشط" : "غير نشط"}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString("ar-JO")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
                      <TableCell>{reportReasonLabel[report.reason] ?? report.reason}</TableCell>
                      <TableCell className="max-w-[240px] truncate">{report.details || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={report.status === "resolved" ? "default" : "secondary"}>
                          {reportStatusLabel[report.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {report.listing?.id && (
                            <Button size="sm" variant="ghost" className="gap-1" asChild>
                              <Link href={`/book/${report.listing.id}`}>
                                <ExternalLink className="h-4 w-4" />
                                عرض الإعلان
                              </Link>
                            </Button>
                          )}
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

