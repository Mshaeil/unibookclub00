"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Loader2, Mail, AlertCircle, ArrowRight, CheckCircle } from "lucide-react"
import { useTranslate } from "@/components/language-provider"
import { TurnstileWidget } from "@/components/auth/turnstile-widget"

export default function ForgotPasswordPage() {
  const t = useTranslate()
  const [email, setEmail] = useState("")
  const [captchaToken, setCaptchaToken] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    if (turnstileSiteKey && !captchaToken) {
      setError(t("يرجى إكمال التحقق الأمني أولاً", "Please complete the security check first"))
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      ...(turnstileSiteKey ? { captchaToken } : {}),
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes("captcha") || msg.includes("captcha_token") || msg.includes("turnstile")) {
        setError(
          t(
            "CAPTCHA/Turnstile مطلوب لإرسال رابط الاسترداد. تأكد من ضبط `NEXT_PUBLIC_TURNSTILE_SITE_KEY` في `.env.local` وتشغيل السيرفر من جديد، أو عطّل CAPTCHA من Supabase.",
            "CAPTCHA/Turnstile is required to send the reset link. Make sure `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set in `.env.local` and restart the server, or disable CAPTCHA in Supabase.",
          ),
        )
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
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
              {t("تحقق من بريدك الإلكتروني", "Check your email")}
            </CardTitle>
            <CardDescription className="text-base">
              {t("أرسلنا رابط إعادة تعيين كلمة المرور إلى", "We sent a password reset link to")}{" "}
              <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                <ArrowRight className="ml-2 h-4 w-4" />
                {t("العودة لتسجيل الدخول", "Back to sign in")}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
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
              {t("نسيت كلمة المرور؟", "Forgot password?")}
            </CardTitle>
            <CardDescription>
              {t(
                "أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور",
                "Enter your email and we will send you a link to reset your password",
              )}
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
              
              <div className="space-y-2">
                <Label htmlFor="email">{t("البريد الإلكتروني", "Email")}</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@university.edu.jo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {turnstileSiteKey ? (
                <div className="space-y-2">
                  <Label>{t("التحقق الأمني", "Security check")}</Label>
                  <div className="rounded-md border bg-background p-3">
                    <TurnstileWidget
                      siteKey={turnstileSiteKey}
                      onToken={(tkn) => setCaptchaToken(tkn)}
                      onError={() => setCaptchaToken("")}
                    />
                  </div>
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    {t("جاري الإرسال...", "Sending...")}
                  </>
                ) : (
                  t("إرسال رابط إعادة التعيين", "Send reset link")
                )}
              </Button>
              <Link 
                href="/login" 
                className="text-center text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                {t("العودة لتسجيل الدخول", "Back to sign in")}
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
