"use client"

import { useEffect, useState } from "react"
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
import { isValidTenDigitPhone, sanitizePhoneDigits, toTenDigitPhone } from "@/lib/utils/phone"
import { isValidEmailFormat, normalizeEmail } from "@/lib/utils/email"

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
  const [emailDraft, setEmailDraft] = useState(userEmail)
  const [phone, setPhone] = useState(toTenDigitPhone(profile?.phone))
  const [whatsapp, setWhatsapp] = useState(toTenDigitPhone(profile?.whatsapp))
  const [facultyId, setFacultyId] = useState(profile?.faculty_id ?? "")
  const [majorId, setMajorId] = useState(profile?.major_id ?? "")

  useEffect(() => {
    setEmailDraft(userEmail)
  }, [userEmail])

  const filteredMajors = majors.filter((m) => m.faculty_id === facultyId)

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const trimmedName = fullName.trim()
    const trimmedPhone = sanitizePhoneDigits(phone, 10)
    const trimmedWhatsapp = sanitizePhoneDigits(whatsapp, 10)

    if (!trimmedName) {
      setError("الاسم الكامل مطلوب")
      setSaving(false)
      return
    }

    if (trimmedPhone && !isValidTenDigitPhone(trimmedPhone)) {
      setError("رقم الهاتف غير صالح")
      setSaving(false)
      return
    }

    if (trimmedWhatsapp && !isValidTenDigitPhone(trimmedWhatsapp)) {
      setError("رقم التواصل غير صالح")
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

    const nextEmail = normalizeEmail(emailDraft)
    const currentEmail = normalizeEmail(userEmail)
    const emailChangeRequested = nextEmail !== currentEmail
    if (emailChangeRequested) {
      if (!isValidEmailFormat(emailDraft)) {
        setError("البريد الإلكتروني غير صالح")
        setSaving(false)
        return
      }
      const { error: emailChangeError } = await supabase.auth.updateUser({ email: nextEmail })
      if (emailChangeError) {
        setSaving(false)
        setError(mapSupabaseProfileError(emailChangeError.message))
        return
      }
    }

    const { error: profileRpcError } = await supabase.rpc("upsert_my_profile", {
      p_full_name: trimmedName,
      p_phone: trimmedPhone || null,
      p_whatsapp: trimmedWhatsapp || null,
      p_faculty_id: facultyId || null,
      p_major_id: majorId || null,
    })

    if (profileRpcError) {
      setSaving(false)
      if (/PGRST202|does not exist|42883/i.test(profileRpcError.message)) {
        setError("ميزة تحديث الملف الشخصي غير مفعّلة بقاعدة البيانات بعد. نفّذ scripts/022_profile_upsert_rpc.sql في Supabase SQL Editor.")
      } else {
        setError(mapSupabaseProfileError(profileRpcError.message))
      }
      return
    }

    setSaving(false)
    if (emailChangeRequested) {
      window.alert(
        "طُلب تغيير البريد. راجع بريدك الجديد لإكمال التحديث إن وُجد رابط تأكيد من مزوّد تسجيل الدخول.",
      )
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
            إدارة معلوماتك وعروض الكتب والملخصات
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
                  <Input
                    id="email"
                    type="email"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    placeholder="you@example.com"
                    dir="ltr"
                    autoComplete="email"
                  />
                  <p className="text-xs text-muted-foreground">
                    عند تغيير البريد قد يُرسل لك رابط تأكيد على العنوان الجديد (حسب إعدادات الموقع).
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(sanitizePhoneDigits(e.target.value, 10))}
                    placeholder="0791234567"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">واتساب</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(sanitizePhoneDigits(e.target.value, 10))}
                    placeholder="0791234567"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={10}
                  />
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
              عروضي (كتب وملخصات)
            </CardTitle>
            <CardDescription>
              {initialListings.length} عرض
            </CardDescription>
          </CardHeader>
          <CardContent>
            {initialListings.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p className="mb-4">لا توجد عروض بعد — اعرض كتاباً أو ملخصاً</p>
                <Button asChild>
                  <Link href="/dashboard/listings/new">أضف عرضاً</Link>
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
