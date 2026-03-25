"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getOAuthCallbackUrl } from "@/lib/auth/oauth-redirect"
import { createClient } from "@/lib/supabase/client"
import { isValidTenDigitPhone, sanitizePhoneDigits } from "@/lib/utils/phone"
import { isPasswordStrongEnough, PASSWORD_MIN_LENGTH } from "@/lib/utils/generate-password"
import { PasswordField } from "@/components/auth/password-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Loader2, Mail, User, Phone, GraduationCap, AlertCircle } from "lucide-react"
import { useLanguage, useTranslate } from "@/components/language-provider"

type Faculty = {
  id: string
  name_ar?: string
  name?: string
}

type Major = {
  id: string
  faculty_id: string
  name_ar?: string
  name?: string
}

export default function RegisterPage() {
  const { language } = useLanguage()
  const t = useTranslate()
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    facultyId: "",
    majorId: "",
  })
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [majors, setMajors] = useState<Major[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function fetchFaculties() {
      const { data } = await supabase
        .from("faculties")
        .select("id, name")
        .order("id")
      if (data) setFaculties(data)
    }
    fetchFaculties()
  }, [supabase])

  useEffect(() => {
    async function fetchMajors() {
      if (!formData.facultyId) {
        setMajors([])
        return
      }
      const { data } = await supabase
        .from("majors")
        .select("id, faculty_id, name")
        .eq("faculty_id", formData.facultyId)
        .order("id")
      if (data) setMajors(data)
    }
    fetchMajors()
  }, [formData.facultyId, supabase])

  function mapAuthError(message: string) {
    const lower = message.toLowerCase()
    if (lower.includes("unsupported provider") || lower.includes("provider is not enabled")) {
      return t(
        "تسجيل الدخول عبر Google غير مفعّل في Supabase (Authentication → Providers → Google).",
        "Google sign-in is not enabled in Supabase (Authentication → Providers → Google).",
      )
    }
    return message || t("حدث خطأ", "Something went wrong")
  }

  async function handleGoogleRegister() {
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getOAuthCallbackUrl("/dashboard"),
      },
    })
    if (error) {
      setError(mapAuthError(error.message))
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(t("كلمتا المرور غير متطابقتين", "Passwords do not match"))
      setLoading(false)
      return
    }

    if (formData.password.length < PASSWORD_MIN_LENGTH) {
      setError(
        t(
          `كلمة المرور يجب أن تكون ${PASSWORD_MIN_LENGTH} أحرف على الأقل`,
          `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
        ),
      )
      setLoading(false)
      return
    }

    if (!isPasswordStrongEnough(formData.password)) {
      setError(
        t(
          "استخدم كلمة مرور قوية: حرف كبير وصغير ورقم ورمز (أو اضغط «توليد كلمة مرور قوية»).",
          "Use a strong password: upper & lower case, a number, and a symbol (or tap «Generate strong password»).",
        ),
      )
      setLoading(false)
      return
    }

    const phoneDigits = sanitizePhoneDigits(formData.phone, 10)
    if (!isValidTenDigitPhone(phoneDigits)) {
      setError(
        t("رقم التواصل غير صالح", "Invalid contact number"),
      )
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 
          `${window.location.origin}/dashboard`,
        data: {
          full_name: formData.fullName,
          phone: phoneDigits,
          faculty_id: formData.facultyId || null,
          major_id: formData.majorId || null,
        },
      },
    })

    if (error) {
      if (error.message.includes("already registered")) {
        setError(t("هذا البريد الإلكتروني مسجل مسبقاً", "This email is already registered"))
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
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">{t("تحقق من بريدك الإلكتروني", "Check your email")}</CardTitle>
            <CardDescription className="text-base">
              {t("أرسلنا رابط التفعيل إلى", "We sent an activation link to")} <strong>{formData.email}</strong>
              <br />
              {t("يرجى التحقق من بريدك الإلكتروني والنقر على الرابط لتفعيل حسابك", "Please open your email and activate your account")}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button asChild variant="outline" className="w-full">
                <Link href="/login">{t("العودة لتسجيل الدخول", "Back to sign in")}</Link>
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
          <p className="text-muted-foreground">{t("أنشئ حسابك وابدأ ببيع وشراء الكتب", "Create your account and start trading books")}</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">{t("إنشاء حساب جديد", "Create New Account")}</CardTitle>
            <CardDescription>
              {t("أدخل بياناتك لإنشاء حساب في UniBookClub", "Enter your details to create a UniBookClub account")}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("الاسم الكامل", "Full Name")}</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={t("أحمد محمد", "John Doe")}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="pr-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("البريد الإلكتروني", "Email")}</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@university.edu.jo"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pr-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("رقم التواصل", "Contact number")}</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: sanitizePhoneDigits(e.target.value, 10),
                      })
                    }
                    className="pr-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("الكلية", "Faculty")}</Label>
                  <Select 
                    value={formData.facultyId} 
                    onValueChange={(v) => setFormData({ ...formData, facultyId: v, majorId: "" })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("اختر الكلية", "Select faculty")} />
                    </SelectTrigger>
                    <SelectContent>
                      {faculties.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{language === "ar" ? (f.name_ar ?? f.name ?? "-") : (f.name ?? f.name_ar ?? "-")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("التخصص", "Major")}</Label>
                  <Select 
                    value={formData.majorId} 
                    onValueChange={(v) => setFormData({ ...formData, majorId: v })}
                    disabled={loading || !formData.facultyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("اختر التخصص", "Select major")} />
                    </SelectTrigger>
                    <SelectContent>
                      {majors.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{language === "ar" ? (m.name_ar ?? m.name ?? "-") : (m.name ?? m.name_ar ?? "-")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <PasswordField
                id="password"
                label={t("كلمة المرور", "Password")}
                value={formData.password}
                onChange={(v) => setFormData({ ...formData, password: v })}
                disabled={loading}
                showGenerate
                generateLabel={t("توليد كلمة مرور قوية", "Generate strong password")}
                showPasswordAria={t("إظهار كلمة المرور", "Show password")}
                hidePasswordAria={t("إخفاء كلمة المرور", "Hide password")}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                {t(
                  `${PASSWORD_MIN_LENGTH}+ أحرف، وحرف كبير وصغير ورقم ورمز.`,
                  `${PASSWORD_MIN_LENGTH}+ characters with upper, lower, number, and symbol.`,
                )}
              </p>

              <PasswordField
                id="confirmPassword"
                label={t("تأكيد كلمة المرور", "Confirm Password")}
                value={formData.confirmPassword}
                onChange={(v) => setFormData({ ...formData, confirmPassword: v })}
                disabled={loading}
                showGenerate={false}
                showPasswordAria={t("إظهار كلمة المرور", "Show password")}
                hidePasswordAria={t("إخفاء كلمة المرور", "Hide password")}
                autoComplete="new-password"
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={handleGoogleRegister}
              >
                {t("المتابعة مع Google", "Continue with Google")}
              </Button>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    {t("جاري إنشاء الحساب...", "Creating account...")}
                  </>
                ) : (
                  <>
                    <GraduationCap className="ml-2 h-4 w-4" />
                    {t("إنشاء الحساب", "Create Account")}
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t("لديك حساب بالفعل؟", "Already have an account?")}{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  {t("تسجيل الدخول", "Sign In")}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
