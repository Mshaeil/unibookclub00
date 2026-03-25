"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PasswordField } from "@/components/auth/password-field"
import { useTranslate } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import {
  isPasswordStrongEnough,
  PASSWORD_MIN_LENGTH,
} from "@/lib/utils/generate-password"

export default function ResetPasswordPage() {
  const router = useRouter()
  const t = useTranslate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password !== confirmPassword) {
      setError(
        t("كلمتا المرور غير متطابقتين", "Passwords do not match"),
      )
      setLoading(false)
      return
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(
        t(
          `كلمة المرور يجب أن تكون ${PASSWORD_MIN_LENGTH} أحرف على الأقل`,
          `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
        ),
      )
      setLoading(false)
      return
    }

    if (!isPasswordStrongEnough(password)) {
      setError(
        t(
          "استخدم أحرفاً كبيرة وصغيرة ورقماً ورمزاً خاصاً (مثل !@#)",
          "Use upper and lower case letters, a number, and a symbol (e.g. !@#)",
        ),
      )
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      router.push("/dashboard")
    }, 2000)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">
              {t("تم تغيير كلمة المرور", "Password updated")}
            </CardTitle>
            <CardDescription className="text-base">
              {t(
                "تم تحديث كلمة المرور بنجاح. جاري تحويلك للوحة التحكم...",
                "Your password was updated. Redirecting to your dashboard...",
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">UniBookClub</span>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">
              {t("إعادة تعيين كلمة المرور", "Reset password")}
            </CardTitle>
            <CardDescription>
              {t("أدخل كلمة المرور الجديدة لحسابك", "Enter your new account password")}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <PasswordField
                id="password"
                label={t("كلمة المرور الجديدة", "New password")}
                value={password}
                onChange={setPassword}
                disabled={loading}
                showGenerate
                generateLabel={t("إنشاء كلمة مرور قوية", "Generate strong password")}
                showPasswordAria={t("إظهار كلمة المرور", "Show password")}
                hidePasswordAria={t("إخفاء كلمة المرور", "Hide password")}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                {t(
                  `${PASSWORD_MIN_LENGTH}+ أحرف مع حرف كبير وصغير ورقم ورمز`,
                  `${PASSWORD_MIN_LENGTH}+ chars with upper, lower, number, and symbol`,
                )}
              </p>

              <PasswordField
                id="confirmPassword"
                label={t("تأكيد كلمة المرور", "Confirm password")}
                value={confirmPassword}
                onChange={setConfirmPassword}
                disabled={loading}
                showPasswordAria={t("إظهار كلمة المرور", "Show password")}
                hidePasswordAria={t("إخفاء كلمة المرور", "Hide password")}
                autoComplete="new-password"
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    {t("جاري الحفظ...", "Saving...")}
                  </>
                ) : (
                  t("حفظ كلمة المرور الجديدة", "Save new password")
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
