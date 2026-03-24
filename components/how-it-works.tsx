"use client"

import { 
  UserPlus, 
  BookPlus, 
  ClipboardCheck, 
  Handshake,
  Search,
  Building2,
  MessageSquare,
  ShoppingBag
} from "lucide-react"

export function HowItWorks() {
  return (
    <section className="py-16 md:py-20 bg-muted/30 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            كيف تعمل المنصة؟
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            خطوات بسيطة للبدء في البيع أو الشراء
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* For Sellers */}
          <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookPlus className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">للبائعين</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">سجّل حسابك</span>
                  </div>
                  <p className="text-sm text-muted-foreground">باستخدام بريدك الجامعي للتوثيق</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BookPlus className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">أضف كتابك</span>
                  </div>
                  <p className="text-sm text-muted-foreground">صور واضحة ومعلومات دقيقة عن الكتاب</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardCheck className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">انتظر المراجعة</span>
                  </div>
                  <p className="text-sm text-muted-foreground">نراجع الإعلان خلال 24 ساعة</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Handshake className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">بع لطلاب الجامعة</span>
                  </div>
                  <p className="text-sm text-muted-foreground">تواصل مع المشترين وأتمم الصفقة</p>
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
              <h3 className="text-xl font-bold text-foreground">للمشترين</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-secondary" />
                    <span className="font-medium text-foreground">اختر كليتك</span>
                  </div>
                  <p className="text-sm text-muted-foreground">فلتر حسب الكلية والتخصص</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Search className="h-4 w-4 text-secondary" />
                    <span className="font-medium text-foreground">ابحث عن المادة</span>
                  </div>
                  <p className="text-sm text-muted-foreground">استخدم الفلاتر الذكية للعثور على كتابك</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-secondary" />
                    <span className="font-medium text-foreground">تواصل مع البائع</span>
                  </div>
                  <p className="text-sm text-muted-foreground">عبر واتساب أو المحادثة الداخلية</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Handshake className="h-4 w-4 text-secondary" />
                    <span className="font-medium text-foreground">استلم الكتاب</span>
                  </div>
                  <p className="text-sm text-muted-foreground">داخل الجامعة أو حسب الاتفاق</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-primary/5 border border-primary/10 rounded-xl p-6">
          <h4 className="font-semibold text-foreground mb-3">معلومات مهمة:</h4>
          <ul className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              المنصة حصرية لطلاب جامعة العلوم التطبيقية
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              التسليم يتم داخل الجامعة أو حسب اتفاق الطرفين
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              لا تتقاضى المنصة أي عمولة
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              الدفع يتم مباشرة بين البائع والمشتري
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
