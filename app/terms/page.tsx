import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FileText } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">قانوني</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              سياسة الاستخدام
            </h1>
            <p className="text-muted-foreground">
              آخر تحديث: يناير 2024
            </p>
          </div>

          {/* Content */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-8">
              
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">1. مقدمة</h2>
                <p className="text-muted-foreground leading-relaxed">
                  مرحباً بك في منصة UniBookClub. باستخدامك للمنصة، فإنك توافق على الالتزام بهذه الشروط والأحكام. 
                  يرجى قراءتها بعناية قبل استخدام خدماتنا.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">2. الأهلية</h2>
                <p className="text-muted-foreground leading-relaxed">
                  المنصة متاحة حصرياً لطلاب جامعة العلوم التطبيقية. يجب أن تكون طالباً مسجلاً حالياً في الجامعة 
                  للتسجيل واستخدام خدمات المنصة. يتطلب التسجيل استخدام البريد الإلكتروني الجامعي.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">3. حسابك</h2>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>أنت مسؤول عن الحفاظ على سرية معلومات حسابك</li>
                  <li>يجب تقديم معلومات دقيقة وصحيحة عند التسجيل</li>
                  <li>يحق لنا تعليق أو إنهاء حسابك في حال مخالفة الشروط</li>
                  <li>لا يُسمح بإنشاء أكثر من حساب واحد لكل شخص</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">4. قواعد البيع</h2>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>يُسمح ببيع الكتب الجامعية والمراجع الدراسية فقط</li>
                  <li>يجب أن تكون الصور والوصف دقيقة وتعكس الحالة الفعلية للكتاب</li>
                  <li>يُمنع بيع الكتب المسروقة أو المقرصنة</li>
                  <li>يجب تحديث حالة الإعلان عند بيع الكتاب</li>
                  <li>الأسعار يجب أن تكون معقولة ومنصفة</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">5. المحتوى الممنوع</h2>
                <p className="text-muted-foreground leading-relaxed">
                  يُمنع منعاً باتاً نشر أو بيع:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>كتب مسروقة أو نسخ غير قانونية</li>
                  <li>مواد غير دراسية أو غير مرتبطة بالجامعة</li>
                  <li>محتوى مسيء أو غير لائق</li>
                  <li>إعلانات مضللة أو كاذبة</li>
                  <li>أي مواد تنتهك حقوق الملكية الفكرية</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">6. التعاملات المالية</h2>
                <p className="text-muted-foreground leading-relaxed">
                  المنصة لا تتدخل في التعاملات المالية بين البائع والمشتري. جميع المعاملات المالية تتم مباشرة 
                  بين الطرفين. ننصح بالدفع نقداً عند الاستلام والتسليم في أماكن عامة داخل الجامعة.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">7. إخلاء المسؤولية</h2>
                <p className="text-muted-foreground leading-relaxed">
                  المنصة توفر مكاناً للتواصل بين البائعين والمشترين فقط. لا نتحمل مسؤولية:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>جودة أو حالة الكتب المعروضة</li>
                  <li>أي نزاعات بين البائع والمشتري</li>
                  <li>عدم إتمام عمليات البيع</li>
                  <li>أي أضرار ناتجة عن استخدام المنصة</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">8. الخصوصية</h2>
                <p className="text-muted-foreground leading-relaxed">
                  نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. لمزيد من المعلومات، يرجى مراجعة 
                  <a href="/privacy" className="text-primary hover:underline"> سياسة الخصوصية</a>.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">9. التعديلات</h2>
                <p className="text-muted-foreground leading-relaxed">
                  نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية. 
                  استمرارك في استخدام المنصة بعد التعديلات يعني موافقتك عليها.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">10. التواصل</h2>
                <p className="text-muted-foreground leading-relaxed">
                  لأي استفسارات حول هذه الشروط، يرجى التواصل معنا عبر صفحة 
                  <a href="/contact" className="text-primary hover:underline"> اتصل بنا</a>.
                </p>
              </section>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
