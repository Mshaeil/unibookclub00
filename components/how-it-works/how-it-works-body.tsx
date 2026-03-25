"use client"

import { useTranslate } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  BookPlus,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Handshake,
  HelpCircle,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  UserPlus,
} from "lucide-react"
import Link from "next/link"

export function HowItWorksBody() {
  const t = useTranslate()

  return (
    <div className="container mx-auto px-4">
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <HelpCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {t("دليل المستخدم", "User guide")}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance">
          {t("كيف يعمل الموقع؟", "How does the site work?")}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          {t(
            "خطوات بسيطة للبدء في بيع أو شراء كتبك الجامعية",
            "Simple steps to start selling or buying your university books",
          )}
        </p>
      </div>

      <div className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <BookPlus className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t("للبائعين", "For sellers")}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <UserPlus className="h-7 w-7 text-primary" />,
              title: t("سجّل حسابك", "Create your account"),
              body: t(
                "أنشئ حسابك باستخدام بريدك الجامعي للتحقق من هويتك كطالب في جامعة العلوم التطبيقية",
                "Sign up with your university email so we can verify you as an Applied Science University student",
              ),
            },
            {
              icon: <Camera className="h-7 w-7 text-primary" />,
              title: t("أضف كتابك", "List your book"),
              body: t(
                "صوّر كتابك من عدة زوايا، أضف المعلومات المطلوبة مثل المادة والحالة والسعر",
                "Take photos from several angles and add details like course, condition, and price",
              ),
            },
            {
              icon: <ClipboardCheck className="h-7 w-7 text-primary" />,
              title: t("انتظر المراجعة", "Wait for review"),
              body: t(
                "سنراجع إعلانك للتأكد من مطابقته للمعايير. عادةً يستغرق الأمر أقل من 24 ساعة",
                "We will review your listing to ensure it meets our guidelines — usually within 24 hours",
              ),
            },
            {
              icon: <Handshake className="h-7 w-7 text-primary" />,
              title: t("بع واستلم", "Sell and get paid"),
              body: t(
                "تواصل مع المشترين المهتمين، اتفق على موعد ومكان التسليم، واستلم المال",
                "Chat with interested buyers, agree on a time and place to meet, and receive payment",
              ),
            },
          ].map((step, i) => (
            <div
              key={i}
              className="relative bg-card border border-border/50 rounded-2xl p-6 group hover:border-primary/30 transition-colors"
            >
              <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                {i + 1}
              </div>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                {step.icon}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-secondary-foreground" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t("للمشترين", "For buyers")}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Building2 className="h-7 w-7 text-secondary" />,
              title: t("اختر كليتك", "Pick your faculty"),
              body: t(
                "استخدم الفلاتر لتحديد كليتك وتخصصك لعرض الكتب المناسبة لك",
                "Use filters to choose your faculty and major to see relevant books",
              ),
            },
            {
              icon: <Search className="h-7 w-7 text-secondary" />,
              title: t("ابحث عن كتابك", "Find your book"),
              body: t(
                "استخدم البحث أو تصفح الكتب حسب المادة. قارن الأسعار والحالات",
                "Search or browse by course — compare prices and conditions",
              ),
            },
            {
              icon: <MessageSquare className="h-7 w-7 text-secondary" />,
              title: t("تواصل مع البائع", "Contact the seller"),
              body: t(
                "راسل البائع عبر المنصة أو واتساب. استفسر عن التفاصيل وتفاوض إن أمكن",
                "Message the seller on the platform or WhatsApp — ask questions and negotiate if needed",
              ),
            },
            {
              icon: <MapPin className="h-7 w-7 text-secondary" />,
              title: t("استلم الكتاب", "Pick up the book"),
              body: t(
                "اتفق على موعد ومكان مناسب. عاين الكتاب وادفع عند الاستلام",
                "Agree on a safe time and place, inspect the book, and pay on delivery",
              ),
            },
          ].map((step, i) => (
            <div
              key={i}
              className="relative bg-card border border-border/50 rounded-2xl p-6 group hover:border-secondary/30 transition-colors"
            >
              <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-lg font-bold">
                {i + 1}
              </div>
              <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                {step.icon}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-8 mb-16">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            {t("نصائح للأمان", "Safety tips")}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            t(
              "قابل البائع/المشتري داخل حرم الجامعة في مكان عام",
              "Meet buyers or sellers on campus in a public place",
            ),
            t(
              "عاين الكتاب جيداً قبل الدفع للتأكد من حالته",
              "Inspect the book carefully before paying",
            ),
            t(
              "ادفع نقداً عند الاستلام - لا تحوّل أموالاً مسبقاً",
              "Pay cash on delivery — do not send money in advance",
            ),
            t(
              "تحقق من تطابق الكتاب مع الوصف والصور المعروضة",
              "Make sure the book matches the description and photos",
            ),
            t(
              "أبلغ عن أي سلوك مشبوه أو إعلانات مضللة",
              "Report suspicious behaviour or misleading listings",
            ),
            t("تعامل مع حسابات موثقة قدر الإمكان", "Prefer verified accounts when possible"),
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          {t("جاهز للبدء؟", "Ready to start?")}
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="gap-2 px-8" asChild>
            <Link href="/browse">
              <Search className="h-5 w-5" />
              {t("ابحث عن كتاب", "Find a book")}
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="gap-2 px-8" asChild>
            <Link href="/dashboard/listings/new">
              {t("أضف كتابك للبيع", "List your book for sale")}
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
