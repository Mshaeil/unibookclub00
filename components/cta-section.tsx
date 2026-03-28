"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookPlus, ShieldCheck, Zap } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export function CTASection() {
  const { language } = useLanguage()
  return (
    <section id="about" className="py-16 md:py-24 bg-primary text-primary-foreground relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 motion-reduce:opacity-80">
        <div className="ubc-hero-blob ubc-hero-blob-a absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 transform rounded-full bg-primary-foreground/5 blur-3xl" />
        <div className="ubc-hero-blob ubc-hero-blob-b absolute bottom-0 left-0 h-80 w-80 -translate-x-1/2 translate-y-1/2 transform rounded-full bg-primary-foreground/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance">
              {language === "ar"
                ? "عندك كتب أو ملخصات ما تحتاجها؟"
                : "Got books or summaries you no longer need?"}
              <br />
              <span className="text-primary-foreground/80">
                {language === "ar" ? "اعرضها لزملائك واستفد!" : "List them for peers and earn!"}
              </span>
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto text-pretty">
              {language === "ar"
                ? "منصة تركّز على الكتب الجامعية والملخصات: انضم لطلاب جامعة العلوم التطبيقية وابدأ البيع اليوم — سهل، آمن، وبدون عمولة."
                : "Focused on university books and summaries: join ASU students and start selling today — easy, safe, and commission-free."}
            </p>

            {/* Features */}
            <div className="grid gap-6 md:grid-cols-3 py-8">
              <div className="text-center space-y-3 p-6 rounded-2xl bg-primary-foreground/5 backdrop-blur-sm">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-lg">{language === "ar" ? "سريع وسهل" : "Fast and easy"}</h3>
                <p className="text-sm text-primary-foreground/70">
                  {language === "ar"
                    ? "أضف كتابك أو ملخصك في دقائق بخطوات بسيطة"
                    : "List a book or summary in minutes with simple steps"}
                </p>
              </div>
              <div className="text-center space-y-3 p-6 rounded-2xl bg-primary-foreground/5 backdrop-blur-sm">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-lg">{language === "ar" ? "آمن وموثوق" : "Safe and trusted"}</h3>
                <p className="text-sm text-primary-foreground/70">
                  {language === "ar" ? "جميع المستخدمين طلاب جامعة موثقون" : "All users are verified university students"}
                </p>
              </div>
              <div className="text-center space-y-3 p-6 rounded-2xl bg-primary-foreground/5 backdrop-blur-sm">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
                  <BookPlus className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-lg">{language === "ar" ? "مجاني 100%" : "100% free"}</h3>
                <p className="text-sm text-primary-foreground/70">
                  {language === "ar" ? "لا عمولات ولا رسوم خفية على الإطلاق" : "No commissions and no hidden fees"}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                variant="secondary" 
                className="gap-2 px-8 text-base bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                asChild
              >
                <Link href="/dashboard/listings/new">
                  {language === "ar" ? "ابدأ البيع الآن" : "Start selling now"}
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 px-8 text-base border-primary-foreground/30 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                asChild
              >
                <Link href="/how-it-works">
                  {language === "ar" ? "كيف يعمل الموقع؟" : "How it works?"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
