"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, LogOut, Loader2, User, Edit } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Faculty = { id: string; name: string }
type Major = { id: string; faculty_id: string; name: string }

type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  whatsapp: string | null
  faculty_id: string | null
  major_id: string | null
  faculty?: { id: string; name: string } | null
  major?: { id: string; name: string } | null
} | null

type Listing = {
  id: string
  title: string
  price: number
  condition: string
  status: string
  availability: string
  images: string[]
  views_count: number
  created_at: string
  course: { name: string } | null
}

const statusLabels: Record<string, string> = {
  pending_review: "قيد المراجعة",
  approved: "نشط",
  rejected: "مرفوض",
  sold: "مباع",
}

const availabilityLabels: Record<string, string> = {
  available: "متاح",
  reserved: "محجوز",
  sold: "مباع",
}

type Props = {
  userEmail: string
  profile: Profile
  listings: Listing[]
  faculties: Faculty[]
  majors: Major[]
}

export function AccountContent({
  userEmail,
  profile,
  listings: initialListings,
  faculties,
  majors,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState(profile?.full_name ?? "")
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp ?? "")
  const [facultyId, setFacultyId] = useState(profile?.faculty_id ?? "")
  const [majorId, setMajorId] = useState(profile?.major_id ?? "")

  const filteredMajors = majors.filter((m) => m.faculty_id === facultyId)

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const { error: err } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        faculty_id: facultyId || null,
        major_id: majorId || null,
      })
      .eq("id", profile!.id)

    setSaving(false)
    if (err) {
      setError("فشل تحديث البيانات")
      return
    }
    setEditing(false)
    router.refresh()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">إعدادات الحساب</h1>
          <p className="text-muted-foreground">
            إدارة معلوماتك وإعلاناتك
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                الملف الشخصي
              </CardTitle>
              <CardDescription>البيانات الأساسية لحسابك</CardDescription>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 ml-1" />
                تعديل
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="full_name">الاسم الكامل</Label>
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="الاسم الكامل"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" value={userEmail} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">واتساب</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="07XXXXXXXX"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الكلية</Label>
                  <Select value={facultyId} onValueChange={(v) => { setFacultyId(v); setMajorId("") }}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الكلية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">بدون</SelectItem>
                      {faculties.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>التخصص</Label>
                  <Select value={majorId} onValueChange={setMajorId} disabled={!facultyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التخصص" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">بدون</SelectItem>
                      {filteredMajors.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                    حفظ
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                    إلغاء
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">الاسم:</span> {profile?.full_name || "-"}</p>
                <p><span className="text-muted-foreground">البريد:</span> {userEmail}</p>
                <p><span className="text-muted-foreground">الهاتف:</span> {profile?.phone || "-"}</p>
                <p><span className="text-muted-foreground">واتساب:</span> {profile?.whatsapp || "-"}</p>
                <p><span className="text-muted-foreground">الكلية:</span> {profile?.faculty?.name || "-"}</p>
                <p><span className="text-muted-foreground">التخصص:</span> {profile?.major?.name || "-"}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Listings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              إعلاناتي
            </CardTitle>
            <CardDescription>
              {initialListings.length} إعلان
            </CardDescription>
          </CardHeader>
          <CardContent>
            {initialListings.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p className="mb-4">لا توجد إعلانات</p>
                <Button asChild>
                  <Link href="/dashboard/listings/new">أضف إعلاناً</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {initialListings.slice(0, 5).map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/book/${listing.id}`}
                    className="flex gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative w-16 h-20 flex-shrink-0 rounded overflow-hidden bg-muted">
                      {listing.images?.[0] ? (
                        <Image
                          src={`/api/file?pathname=${encodeURIComponent(listing.images[0])}`}
                          alt={listing.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{listing.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {listing.course?.name ?? "-"}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-primary font-semibold">{listing.price} د.أ</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{statusLabels[listing.status] || listing.status}</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{availabilityLabels[listing.availability] || listing.availability}</span>
                      </div>
                    </div>
                  </Link>
                ))}
                {initialListings.length > 5 && (
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/dashboard">عرض الكل ({initialListings.length})</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="outline"
              className="w-full gap-2 text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
