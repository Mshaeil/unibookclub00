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

type Faculty = { id: string; name_ar?: string; name?: string }
type Major = { id: string; faculty_id: string; name_ar?: string; name?: string }

type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  whatsapp: string | null
  faculty_id: string | null
  major_id: string | null
  faculty?: { id: string; name_ar?: string; name?: string } | null
  major?: { id: string; name_ar?: string; name?: string } | null
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
  course?: { name_ar?: string; name?: string } | null
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

const NONE_VALUE = "__none__"
const phoneRegex = /^(?:07\d{8}|\+9627\d{8})$/

function normalizePhoneInput(value: string) {
  const normalized = value
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^\d+]/g, "")

  if (normalized.startsWith("+")) {
    return `+${normalized.slice(1).replace(/\+/g, "")}`
  }

  return normalized.replace(/\+/g, "")
}

function mapSupabaseProfileError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes("row-level security") || lower.includes("policy")) {
    return "لا تملك صلاحية تعديل الملف الشخصي حالياً. تأكد من تسجيل الدخول ثم أعد المحاولة."
  }
  if (lower.includes("duplicate key")) {
    return "تعذر حفظ البيانات بسبب تعارض في السجل. أعد المحاولة."
  }
  return message || "فشل تحديث البيانات"
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

    const trimmedName = fullName.trim()
    const trimmedPhone = phone.trim()
    const trimmedWhatsapp = whatsapp.trim()

    if (!trimmedName) {
      setError("الاسم الكامل مطلوب")
      setSaving(false)
      return
    }

    if (trimmedPhone && !phoneRegex.test(trimmedPhone)) {
      setError("رقم الهاتف غير صالح. استخدم 07XXXXXXXX أو +9627XXXXXXXX")
      setSaving(false)
      return
    }

    if (trimmedWhatsapp && !phoneRegex.test(trimmedWhatsapp)) {
      setError("رقم واتساب غير صالح. استخدم 07XXXXXXXX أو +9627XXXXXXXX")
      setSaving(false)
      return
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.")
      setSaving(false)
      return
    }

    const payload = {
      id: user.id,
      full_name: trimmedName,
      phone: trimmedPhone || null,
      whatsapp: trimmedWhatsapp || null,
      faculty_id: facultyId || null,
      major_id: majorId || null,
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id)
      .select("id")
      .maybeSingle()

    if (updateError) {
      setSaving(false)
      setError(mapSupabaseProfileError(updateError.message))
      return
    }

    if (!updatedProfile) {
      const { data: insertedProfile, error: insertError } = await supabase
        .from("profiles")
        .insert(payload)
        .select("id")
        .maybeSingle()

      setSaving(false)
      if (insertError) {
        setError(mapSupabaseProfileError(insertError.message))
        return
      }
      if (!insertedProfile) {
        setError("لم يتم حفظ البيانات. أعد المحاولة.")
        return
      }
      setEditing(false)
      router.refresh()
      return
    }

    setSaving(false)
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
                    onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
                    placeholder="07XXXXXXXX"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={13}
                  />
                  <p className="text-xs text-muted-foreground">مثال: 0791234567 أو +962791234567</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">واتساب</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(normalizePhoneInput(e.target.value))}
                    placeholder="07XXXXXXXX"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={13}
                  />
                  <p className="text-xs text-muted-foreground">مثال: 0791234567 أو +962791234567</p>
                </div>
                <div className="space-y-2">
                  <Label>الكلية</Label>
                  <Select
                    value={facultyId || NONE_VALUE}
                    onValueChange={(v) => {
                      if (v === NONE_VALUE) {
                        setFacultyId("")
                        setMajorId("")
                        return
                      }
                      setFacultyId(v)
                      setMajorId("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الكلية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>بدون</SelectItem>
                      {faculties.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name_ar ?? f.name ?? "-"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>التخصص</Label>
                  <Select
                    value={majorId || NONE_VALUE}
                    onValueChange={(v) => setMajorId(v === NONE_VALUE ? "" : v)}
                    disabled={!facultyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التخصص" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>بدون</SelectItem>
                      {filteredMajors.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name_ar ?? m.name ?? "-"}
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
                <p><span className="text-muted-foreground">الكلية:</span> {profile?.faculty?.name_ar ?? profile?.faculty?.name ?? "-"}</p>
                <p><span className="text-muted-foreground">التخصص:</span> {profile?.major?.name_ar ?? profile?.major?.name ?? "-"}</p>
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
                        {listing.course?.name_ar ?? listing.course?.name ?? "-"}
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
