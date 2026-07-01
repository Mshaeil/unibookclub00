"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, MapPin, MessageSquare, Phone } from "lucide-react"
import { useTranslate } from "@/components/language-provider"
import { TurnstileWidget } from "@/components/auth/turnstile-widget"

export default function ContactPage() {
  const t = useTranslate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [captchaToken, setCaptchaToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    setIsSuccess(false)

    if (turnstileSiteKey && !captchaToken) {
      setStatus(t("يرجى إكمال التحقق الأمني أولاً", "Please complete the security check first"))
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          ...(turnstileSiteKey ? { captchaToken } : {}),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus(data.error || t("فشل إرسال الرسالة", "Failed to send message"))
      } else {
        setIsSuccess(true)
        setStatus(t("تم إرسال رسالتك بنجاح", "Your message was sent successfully"))
        setName("")
        setEmail("")
        setSubject("")
        setMessage("")
        setCaptchaToken("")
      }
    } catch {
      setStatus(t("تعذر الاتصال بالخادم", "Could not reach the server"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t("تواصل معنا", "Contact us")}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {t("نحن هنا لمساعدتك", "We are here to help")}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t(
                "لديك سؤال أو اقتراح؟ لا تتردد في التواصل معنا وسنرد عليك في أقرب وقت",
                "Have a question or suggestion? Reach out and we will get back to you soon.",
              )}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{t("البريد الإلكتروني", "Email")}</h3>
                    <p className="text-sm text-muted-foreground">support@unibookclub.com</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{t("واتساب", "WhatsApp")}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5" dir="ltr">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 text-xs font-medium">
                        {t("الأردن", "Jordan")}
                      </span>
                      <a
                        href="https://wa.me/962781113371"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary hover:underline"
                      >
                        +962 78 111 3371
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{t("الموقع", "Location")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("جامعة العلوم التطبيقية - عمّان", "Applied Science University — Amman")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6 md:p-8">
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t("الاسم الكامل", "Full name")}</Label>
                        <Input
                          id="name"
                          placeholder={t("أدخل اسمك", "Enter your name")}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          maxLength={120}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t("البريد الإلكتروني", "Email")}</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">{t("الموضوع", "Subject")}</Label>
                      <Input
                        id="subject"
                        placeholder={t("موضوع الرسالة", "Message subject")}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        maxLength={200}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">{t("الرسالة", "Message")}</Label>
                      <Textarea
                        id="message"
                        placeholder={t("اكتب رسالتك هنا...", "Write your message here...")}
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        maxLength={5000}
                      />
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

                    {status && (
                      <p
                        className={`text-sm text-center ${
                          isSuccess ? "text-green-600" : "text-destructive"
                        }`}
                      >
                        {status}
                      </p>
                    )}

                    <Button type="submit" size="lg" className="w-full" disabled={loading}>
                      {loading ? t("جاري الإرسال...", "Sending...") : t("إرسال الرسالة", "Send message")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
