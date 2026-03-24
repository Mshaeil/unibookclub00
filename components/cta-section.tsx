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
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-foreground/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance">
              {language === "ar" ? "عندك كتب ما تحتاجها؟" : "Got books you no longer need?"}
              <br />
              <span className="text-primary-foreground/80">{language === "ar" ? "حولها إلى فلوس!" : "Turn them into cash!"}</span>
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto text-pretty">
              {language === "ar"
                ? "انضم لمجتمع طلاب جامعة العلوم التطبيقية وابدأ ببيع كتبك اليوم. العملية سهلة وآمنة ومجانية تماماً."
                : "Join Applied Science University students and start selling your books today. It's easy, safe, and completely free."}
            </p>

            {/* Features */}
            <div className="grid gap-6 md:grid-cols-3 py-8">
              <div className="text-center space-y-3 p-6 rounded-2xl bg-primary-foreground/5 backdrop-blur-sm">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-lg">{language === "ar" ? "سريع وسهل" : "Fast and easy"}</h3>
                <p className="text-sm text-primary-foreground/70">
                  {language === "ar" ? "أضف كتابك في أقل من دقيقتين بخطوات بسيطة" : "List your book in under two minutes"}
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
