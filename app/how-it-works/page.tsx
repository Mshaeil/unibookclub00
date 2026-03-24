import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
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
  UserPlus
} from "lucide-react"
import Link from "next/link"

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">دليل المستخدم</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance">
              كيف يعمل الموقع؟
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              خطوات بسيطة للبدء في بيع أو شراء كتبك الجامعية
            </p>
          </div>

          {/* For Sellers */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <BookPlus className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">للبائعين</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative bg-card border border-border/50 rounded-2xl p-6 group hover:border-primary/30 transition-colors">
                <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                  1
                </div>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <UserPlus className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">سجّل حسابك</h3>
                <p className="text-muted-foreground text-sm">
                  أنشئ حسابك باستخدام بريدك الجامعي للتحقق من هويتك كطالب في جامعة العلوم التطبيقية
                </p>
              </div>

              <div className="relative bg-card border border-border/50 rounded-2xl p-6 group hover:border-primary/30 transition-colors">
                <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                  2
                </div>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Camera className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">أضف كتابك</h3>
                <p className="text-muted-foreground text-sm">
                  صوّر كتابك من عدة زوايا، أضف المعلومات المطلوبة مثل المادة والحالة والسعر
                </p>
              </div>

              <div className="relative bg-card border border-border/50 rounded-2xl p-6 group hover:border-primary/30 transition-colors">
                <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                  3
                </div>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <ClipboardCheck className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">انتظر المراجعة</h3>
                <p className="text-muted-foreground text-sm">
                  سنراجع إعلانك للتأكد من مطابقته للمعايير. عادةً يستغرق الأمر أقل من 24 ساعة
                </p>
              </div>

              <div className="relative bg-card border border-border/50 rounded-2xl p-6 group hover:border-primary/30 transition-colors">
                <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                  4
                </div>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Handshake className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">بع واستلم</h3>
                <p className="text-muted-foreground text-sm">
                  تواصل مع المشترين المهتمين، اتفق على موعد ومكان التسليم، واستلم المال
                </p>
              </div>
            </div>
          </div>

          {/* For Buyers */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">للمشترين</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative bg-card border border-border/50 rounded-2xl p-6 group hover:border-secondary/30 transition-colors">
                <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-lg font-bold">
                  1
                </div>
                <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <Building2 className="h-7 w-7 text-secondary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">اختر كليتك</h3>
                <p className="text-muted-foreground text-sm">
                  استخدم الفلاتر لتحديد كليتك وتخصصك لعرض الكتب المناسبة لك
                </p>
              </div>

              <div className="relative bg-card border border-border/50 rounded-2xl p-6 group hover:border-secondary/30 transition-colors">
                <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-lg font-bold">
                  2
                </div>
                <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <Search className="h-7 w-7 text-secondary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">ابحث عن كتابك</h3>
                <p className="text-muted-foreground text-sm">
                  استخدم البحث أو تصفح الكتب حسب المادة. قارن الأسعار والحالات
                </p>
              </div>

              <div className="relative bg-card border border-border/50 rounded-2xl p-6 group hover:border-secondary/30 transition-colors">
                <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-lg font-bold">
                  3
                </div>
                <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-7 w-7 text-secondary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">تواصل مع البائع</h3>
                <p className="text-muted-foreground text-sm">
                  راسل البائع عبر المنصة أو واتساب. استفسر عن التفاصيل وتفاوض إن أمكن
                </p>
              </div>

              <div className="relative bg-card border border-border/50 rounded-2xl p-6 group hover:border-secondary/30 transition-colors">
                <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-lg font-bold">
                  4
                </div>
                <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <MapPin className="h-7 w-7 text-secondary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">استلم الكتاب</h3>
                <p className="text-muted-foreground text-sm">
                  اتفق على موعد ومكان مناسب. عاين الكتاب وادفع عند الاستلام
                </p>
              </div>
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-8 mb-16">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">نصائح للأمان</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">قابل البائع/المشتري داخل حرم الجامعة في مكان عام</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">عاين الكتاب جيداً قبل الدفع للتأكد من حالته</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">ادفع نقداً عند الاستلام - لا تحوّل أموالاً مسبقاً</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">تحقق من تطابق الكتاب مع الوصف والصور المعروضة</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">أبلغ عن أي سلوك مشبوه أو إعلانات مضللة</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">تعامل مع حسابات موثقة قدر الإمكان</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              جاهز للبدء؟
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="gap-2 px-8" asChild>
                <Link href="/#books">
                  <Search className="h-5 w-5" />
                  ابحث عن كتاب
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 px-8" asChild>
                <Link href="/dashboard/listings/new">
                  أضف كتابك للبيع
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
