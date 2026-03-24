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

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus(data.details ? `${data.error}: ${data.details}` : (data.error || "فشل إرسال الرسالة"))
      } else {
        setStatus("تم إرسال رسالتك بنجاح")
        setName("")
        setEmail("")
        setSubject("")
        setMessage("")
      }
    } catch {
      setStatus("تعذر الاتصال بالخادم")
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
              <span className="text-sm font-medium text-primary">تواصل معنا</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              نحن هنا لمساعدتك
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              لديك سؤال أو اقتراح؟ لا تتردد في التواصل معنا وسنرد عليك في أقرب وقت
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
                    <h3 className="font-semibold text-foreground mb-1">البريد الإلكتروني</h3>
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
                    <h3 className="font-semibold text-foreground mb-1">واتساب</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5" dir="ltr">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 text-xs font-medium">
                        الأردن
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
                    <h3 className="font-semibold text-foreground mb-1">الموقع</h3>
                    <p className="text-sm text-muted-foreground">جامعة العلوم التطبيقية - عمّان</p>
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
                        <Label htmlFor="name">الاسم الكامل</Label>
                        <Input id="name" placeholder="أدخل اسمك" value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">الموضوع</Label>
                      <Input id="subject" placeholder="موضوع الرسالة" value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">الرسالة</Label>
                      <Textarea id="message" placeholder="اكتب رسالتك هنا..." rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
                    </div>

                    {status && (
                      <p
                        className={`text-sm text-center ${
                          status.startsWith("تم") ? "text-green-600" : "text-destructive"
                        }`}
                      >
                        {status}
                      </p>
                    )}

                    <Button type="submit" size="lg" className="w-full" disabled={loading}>
                      {loading ? "جاري الإرسال..." : "إرسال الرسالة"}
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