"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Loader2, Mail, Lock, AlertCircle } from "lucide-react"
import { useTranslate } from "@/components/language-provider"

export default function LoginForm() {
  const t = useTranslate()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function mapAuthError(message: string) {
    const lower = message.toLowerCase()
    if (lower.includes("unsupported provider") || lower.includes("provider is not enabled")) {
      return t("تسجيل الدخول عبر Google غير مفعّل حالياً في إعدادات المنصة. يرجى تفعيل مزوّد Google في Supabase (Authentication > Providers > Google).", "Google sign-in is not enabled in Supabase settings.")
    }
    if (lower.includes("invalid login credentials")) {
      return t("البريد الإلكتروني أو كلمة المرور غير صحيحة", "Invalid email or password")
    }
    return message || t("حدث خطأ أثناء تسجيل الدخول", "Login failed")
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(mapAuthError(error.message))
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  async function handleGoogleLogin() {
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirect}`,
      },
    })

    if (error) {
      setError(mapAuthError(error.message))
      setLoading(false)
    }
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
          <p className="text-muted-foreground">{t("مرحباً بعودتك! سجّل دخولك للمتابعة", "Welcome back! Sign in to continue")}</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">{t("تسجيل الدخول", "Sign In")}</CardTitle>
            <CardDescription>
              {t("أدخل بيانات حسابك للوصول إلى لوحة التحكم", "Enter your account details")}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("كلمة المرور", "Password")}</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    {t("نسيت كلمة المرور؟", "Forgot password?")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={handleGoogleLogin}
              >
                {t("تسجيل الدخول عبر Google", "Continue with Google")}
              </Button>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    {t("جاري تسجيل الدخول...", "Signing in...")}
                  </>
                ) : (
                  t("تسجيل الدخول", "Sign In")
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t("ليس لديك حساب؟", "Don't have an account?")}{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  {t("أنشئ حساباً جديداً", "Create one")}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}