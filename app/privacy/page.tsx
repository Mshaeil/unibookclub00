import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Shield } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "سياسة الخصوصية",
  description: "كيف تجمع UniBookClub بياناتك وتحميها وتستخدمها.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">قانوني</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">سياسة الخصوصية</h1>
            <p className="text-muted-foreground">آخر تحديث: يوليو 2026</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-8">
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">1. مقدمة</h2>
                <p className="text-muted-foreground leading-relaxed">
                  نحن في UniBookClub نحترم خصوصيتك. توضّح هذه السياسة أنواع البيانات التي نجمعها عند استخدامك
                  للمنصة، وكيف نستخدمها ونحميها.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">2. البيانات التي نجمعها</h2>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>معلومات الحساب: الاسم، البريد الجامعي، رقم التواصل، الكلية والتخصص</li>
                  <li>بيانات الإعلانات: العناوين، الأوصاف، الصور، والملفات المرفقة</li>
                  <li>بيانات المعاملات: الحجوزات، الطلبات، التقييمات، وسجل النقاط</li>
                  <li>بيانات تقنية: نوع المتصفح، عنوان IP تقريبي، وسجلات الأخطاء لتحسين الخدمة</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">3. كيف نستخدم بياناتك</h2>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>إنشاء حسابك وإدارة جلسة الدخول</li>
                  <li>عرض الإعلانات وربط البائعين بالمشترين</li>
                  <li>إرسال رسائل تفعيل الحساب واستعادة كلمة المرور</li>
                  <li>منع الاحتيال وإساءة الاستخدام (مثل CAPTCHA)</li>
                  <li>تحسين أداء المنصة ودعم المستخدمين</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">4. مشاركة البيانات</h2>
                <p className="text-muted-foreground leading-relaxed">
                  لا نبيع بياناتك الشخصية. قد نشارك الحد الأدنى اللازم مع مزودي الخدمة الموثوقين فقط لتشغيل
                  المنصة (مثل Supabase للاستضافة وقاعدة البيانات، Resend للبريد، Cloudflare Turnstile
                  للتحقق الأمني، وVercel للاستضافة). عند إتمام حجز، تُشارك بيانات التواصل الضرورية بين
                  البائع والمشتري لإتمام الصفقة.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">5. التخزين والأمان</h2>
                <p className="text-muted-foreground leading-relaxed">
                  نخزّن البيانات في بنية سحابية مع سياسات وصول (RLS) على مستوى قاعدة البيانات. الملفات
                  الحساسة (مثل PDF) لا تُعرض علناً وتتطلب تحقق ملكية قبل التحميل. مع ذلك، لا يوجد نظام
                  آمن بنسبة 100% — نعمل باستمرار على تحسين الحماية.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">6. ملفات تعريف الارتباط والتخزين المحلي</h2>
                <p className="text-muted-foreground leading-relaxed">
                  نستخدم ملفات تعريف الارتباط لجلسة الدخول وتفضيلات اللغة. قد نستخدم التخزين المحلي
                  لسلة التسوق على جهازك. يمكنك مسحها من إعدادات المتصفح.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">7. حقوقك</h2>
                <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                  <li>طلب تصحيح بيانات حسابك من صفحة الحساب</li>
                  <li>طلب حذف حسابك عبر التواصل مع الدعم</li>
                  <li>الاعتراض على معالجة بياناتك لأغراض غير ضرورية للخدمة</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">8. الاحتفاظ بالبيانات</h2>
                <p className="text-muted-foreground leading-relaxed">
                  نحتفظ ببياناتك طالما حسابك نشط أو حسب ما يقتضيه القانون. قد نحتفظ بسجلات المعاملات
                  لفترة معقولة لحل النزاعات ومنع الاحتيال.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">9. التعديلات</h2>
                <p className="text-muted-foreground leading-relaxed">
                  قد نحدّث هذه السياسة. سننشر النسخة المحدّثة على هذه الصفحة مع تاريخ التعديل.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">10. التواصل</h2>
                <p className="text-muted-foreground leading-relaxed">
                  لأي استفسار حول الخصوصية، راسلنا عبر{" "}
                  <Link href="/contact" className="text-primary hover:underline">
                    صفحة التواصل
                  </Link>{" "}
                  أو البريد{" "}
                  <a href="mailto:support@unibookclub.com" className="text-primary hover:underline">
                    support@unibookclub.com
                  </a>
                  . راجع أيضاً{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    سياسة الاستخدام
                  </Link>
                  .
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
