"use client"

import { 
  UserPlus, 
  BookPlus, 
  ClipboardCheck, 
  Handshake,
  Search,
  Building2,
  Phone,
  ShoppingBag
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export function HowItWorks() {
  const { language } = useLanguage()
  return (
    <section className="py-16 md:py-20 bg-muted/30 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === "ar" ? "كيف تعمل المنصة؟" : "How Does the Platform Work?"}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {language === "ar"
              ? "خطوات بسيطة لبيع أو شراء الكتب والملخصات الجامعية"
              : "Simple steps to buy or sell university books and summaries"}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* For Sellers */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookPlus className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{language === "ar" ? "للبائعين" : "For Sellers"}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{language === "ar" ? "سجّل حسابك" : "Create your account"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "باستخدام بريدك الجامعي للتوثيق" : "Use your university email for verification"}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BookPlus className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                      {language === "ar" ? "أضف كتابك أو ملخصك" : "Add your book or summary"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "صور واضحة ونوع العنصر (كتاب أصلي، ملخص، ملزمة…) ومعلومات دقيقة"
                      : "Clear photos, item type (book, summary, notes…), and accurate details"}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardCheck className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{language === "ar" ? "انتظر المراجعة" : "Wait for review"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "نراجع عرض الكتاب أو الملخص خلال 24 ساعة"
                      : "We review your book or summary listing within 24 hours"}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Handshake className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{language === "ar" ? "بع لطلاب الجامعة" : "Sell to university students"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "بعد البيع من لوحة التحكم سجّل بيانات المشتري كما في حسابه. يمكنك إظهار سعر قبل وبعد الخصم في عرض الكتاب أو الملخص."
                      : "After the sale, record the buyer from your dashboard as on their profile. You can show original and discounted prices on your listing."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* For Buyers */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{language === "ar" ? "للمشترين" : "For Buyers"}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-secondary" />
                    <span className="font-medium text-foreground">
                      {language === "ar" ? "اختر كليتك" : "Pick your faculty"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "فلتر عروض الكتب والملخصات حسب الكلية والتخصص"
                      : "Filter books and summaries by faculty and major"}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Search className="h-4 w-4 text-secondary" />
                    <span className="font-medium text-foreground">
                      {language === "ar" ? "ابحث عن المادة" : "Find your course"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "استخدم البحث والفلاتر للعثور على الكتاب أو الملخص المناسب"
                      : "Use search and filters to find the right book or summary"}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-4 w-4 text-secondary" />
                    <span className="font-medium text-foreground">
                      {language === "ar" ? "تواصل مع البائع" : "Contact the seller"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "تواصل مع البائع عبر واتساب لاستكمال شراء الكتاب أو الملخص"
                      : "Contact the seller on WhatsApp to complete your purchase"}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Handshake className="h-4 w-4 text-secondary" />
                    <span className="font-medium text-foreground">
                      {language === "ar" ? "استلم وقيّم وحمّل PDF" : "Receive, rate, download PDF"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "تظهر مشترياتك عندما يطابق رقمك ما سجّله البائع. بعد التقييم يمكنك تحميل أي ملف مرفق بعرض الكتاب أو الملخص من «مشترياتك»."
                      : "Purchases appear when your profile phone matches what the seller entered. After you rate the seller, you can download attachments from «Your purchases»."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-primary/5 border border-primary/10 rounded-xl p-6">
          <h4 className="font-semibold text-foreground mb-3">
            {language === "ar" ? "معلومات مهمة:" : "Good to know:"}
          </h4>
          <ul className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {language === "ar"
                ? "المنصة مخصّصة لطلاب جامعة العلوم التطبيقية — للكتب والملخصات الجامعية"
                : "For ASU students — university books and summaries"}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {language === "ar"
                ? "التسليم داخل الجامعة أو حسب اتفاقك مع البائع/المشتري"
                : "Handoff on campus or as you agree with the other party"}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {language === "ar" ? "لا عمولة على المنصة" : "No platform commission"}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {language === "ar"
                ? "الدفع مباشرة بين البائع والمشتري"
                : "Payment is directly between buyer and seller"}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {language === "ar"
                ? "تنسيق أرقام التواصل تلقائياً لمطابقة «مشترياتك» مع ما سجّله البائع"
                : "Phone numbers are normalized to match purchases with seller records"}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {language === "ar"
                ? "تحميل المرفقات (مثل PDF) بعد إتمام البيع والتقييم فقط"
                : "Download attachments (e.g. PDF) only after sale and rating"}
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
