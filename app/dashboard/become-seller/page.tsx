"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { isUniversityEmail } from "@/lib/utils/university-email"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Loader2, ShieldCheck, Upload, AlertCircle } from "lucide-react"
import { useTranslate } from "@/components/language-provider"

export default function BecomeSellerPage() {
  const t = useTranslate()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [uniEmail, setUniEmail] = useState("")
  const [idFile, setIdFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isUniversityEmail(uniEmail)) {
      setError(t("أدخل بريدك الجامعي الرسمي (@asu.edu.jo)", "Enter your official university email (@asu.edu.jo)"))
      return
    }
    if (!idFile) {
      setError(t("ارفع صورة هويتك الجامعية", "Upload a photo of your university ID"))
      return
    }
    if (!idFile.type.startsWith("image/")) {
      setError(t("الملف يجب أن يكون صورة", "File must be an image"))
      return
    }
    if (idFile.size > 5 * 1024 * 1024) {
      setError(t("حجم الصورة كبير (الحد 5MB)", "Image too large (max 5MB)"))
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login?redirect=/dashboard/become-seller")
        return
      }

      const ext = idFile.name.split(".").pop() || "jpg"
      const path = `seller-id/${user.id}/id-${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from("listing-images")
        .upload(path, idFile, { upsert: true, contentType: idFile.type })

      if (upErr) {
        setError(upErr.message)
        return
      }

      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          seller_university_email: uniEmail.trim().toLowerCase(),
          seller_id_image_path: path,
          seller_status: "verified",
          seller_verified_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (profErr) {
        setError(
          profErr.message.includes("seller_status")
            ? t(
                "شغّل scripts/fresh/06_seller_verification.sql في Supabase أولاً",
                "Run scripts/fresh/06_seller_verification.sql in Supabase first",
              )
            : profErr.message,
        )
        return
      }

      router.push("/dashboard/listings/new")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("تعذر إكمال التحقق", "Verification failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-lg">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">UniBookClub</span>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {t("التسجيل كبائع", "Register as a seller")}
          </CardTitle>
          <CardDescription>
            {t(
              "لرفع إعلانات البيع نحتاج التحقق من هويتك الجامعية. بياناتك تُستخدم للتوثيق فقط ولا تُعرض للمشترين.",
              "To list items for sale we verify your university identity. Your data is for verification only and is not shown to buyers.",
            )}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="uni-email">{t("البريد الجامعي", "University email")}</Label>
              <Input
                id="uni-email"
                type="email"
                dir="ltr"
                placeholder="name@asu.edu.jo"
                value={uniEmail}
                onChange={(e) => setUniEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id-photo">{t("صورة الهوية الجامعية", "University ID photo")}</Label>
              <div className="rounded-lg border border-dashed p-4">
                <Input
                  id="id-photo"
                  type="file"
                  accept="image/*"
                  className="cursor-pointer"
                  disabled={loading}
                  onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Upload className="h-3.5 w-3.5" />
                  {t("صورة واضحة للوجه والبطاقة — حد أقصى 5MB", "Clear photo of you and your card — max 5MB")}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  {t("جاري التحقق...", "Verifying...")}
                </>
              ) : (
                t("تأكيد والمتابعة لرفع إعلان", "Verify and continue to list")
              )}
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">{t("العودة للوحة التحكم", "Back to dashboard")}</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
