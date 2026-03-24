"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookPlus, ShieldCheck, Zap, Users, BookOpen, GraduationCap } from "lucide-react"

export function CTASection() {
  return (
    <section id="about" className="py-16 md:py-24 bg-primary text-primary-foreground relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-foreground/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-5xl mx-auto">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 mb-12 p-6 rounded-2xl backdrop-blur-sm border border-primary-foreground/10">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-xl bg-primary-foreground/10">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="text-2xl md:text-4xl font-bold">350+</div>
              <div className="text-xs md:text-sm text-primary-foreground/70">كتاب متاح</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-xl bg-primary-foreground/10">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-2xl md:text-4xl font-bold">500+</div>
              <div className="text-xs md:text-sm text-primary-foreground/70">طالب مسجل</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-xl bg-primary-foreground/10">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="text-2xl md:text-4xl font-bold">5</div>
              <div className="text-xs md:text-sm text-primary-foreground/70">كليات</div>
            </div>
          </div>

          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance">
              عندك كتب ما تحتاجها؟
              <br />
              <span className="text-primary-foreground/80">حولها إلى فلوس!</span>
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto text-pretty">
              انضم لمجتمع طلاب جامعة العلوم التطبيقية وابدأ ببيع كتبك اليوم. 
              العملية سهلة وآمنة ومجانية تماماً.
            </p>

            {/* Features */}
            <div className="grid gap-6 md:grid-cols-3 py-8">
              <div className="text-center space-y-3 p-6 rounded-2xl bg-primary-foreground/5 backdrop-blur-sm">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
                  <Zap className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-lg">سريع وسهل</h3>
                <p className="text-sm text-primary-foreground/70">
                  أضف كتابك في أقل من دقيقتين بخطوات بسيطة
                </p>
              </div>
              <div className="text-center space-y-3 p-6 rounded-2xl bg-primary-foreground/5 backdrop-blur-sm">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-lg">آمن وموثوق</h3>
                <p className="text-sm text-primary-foreground/70">
                  جميع المستخدمين طلاب جامعة موثقون
                </p>
              </div>
              <div className="text-center space-y-3 p-6 rounded-2xl bg-primary-foreground/5 backdrop-blur-sm">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-foreground/10 flex items-center justify-center">
                  <BookPlus className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-lg">مجاني 100%</h3>
                <p className="text-sm text-primary-foreground/70">
                  لا عمولات ولا رسوم خفية على الإطلاق
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
                  ابدأ البيع الآن
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 px-8 text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/how-it-works">
                  كيف يعمل الموقع؟
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
