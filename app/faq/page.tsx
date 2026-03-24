import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"

const faqCategories = [
  {
    title: "أسئلة عامة",
    questions: [
      {
        q: "ما هي منصة UniBookClub؟",
        a: "UniBookClub هي منصة حصرية لطلاب جامعة العلوم التطبيقية لبيع وشراء الكتب الجامعية المستعملة. نهدف إلى توفير مكان آمن وموثوق لتبادل الكتب بين الطلاب."
      },
      {
        q: "هل المنصة مجانية؟",
        a: "نعم، المنصة مجانية 100%. لا نتقاضى أي عمولة أو رسوم على عمليات البيع أو الشراء. جميع الخدمات متاحة مجاناً لطلاب الجامعة."
      },
      {
        q: "هل يمكن لأي شخص استخدام المنصة؟",
        a: "المنصة حصرية لطلاب جامعة العلوم التطبيقية فقط. يتطلب التسجيل استخدام البريد الإلكتروني الجامعي للتحقق من الهوية."
      },
      {
        q: "كيف يتم التسليم والدفع؟",
        a: "يتم الاتفاق على موعد ومكان التسليم بين البائع والمشتري مباشرة. نوصي بالتسليم داخل حرم الجامعة. الدفع يتم نقداً عند الاستلام."
      }
    ]
  },
  {
    title: "للبائعين",
    questions: [
      {
        q: "كيف أبيع كتابي على المنصة؟",
        a: "1) سجّل حسابك باستخدام بريدك الجامعي\n2) اضغط على 'أضف كتابك'\n3) أدخل معلومات الكتاب والصور\n4) انتظر مراجعة الإعلان (خلال 24 ساعة)\n5) بعد الموافقة، سيظهر إعلانك للمشترين"
      },
      {
        q: "ما المعلومات المطلوبة لإضافة كتاب؟",
        a: "تحتاج إلى: عنوان الكتاب، المادة والتخصص، صور واضحة، السعر، حالة الكتاب، طريقة التسليم المفضلة، ووصف مختصر."
      },
      {
        q: "كيف أحدد سعر مناسب لكتابي؟",
        a: "ننصح بتسعير الكتاب بناءً على حالته وسعره الأصلي. عادةً الكتب المستعملة تُباع بـ 30-60% من السعر الأصلي حسب الحالة."
      },
      {
        q: "ماذا يحدث إذا تم بيع الكتاب؟",
        a: "بعد إتمام البيع، يمكنك تحديث حالة الإعلان إلى 'تم البيع' من صفحة إعلانك. هذا يساعد المشترين الآخرين على معرفة أن الكتاب لم يعد متاحاً."
      }
    ]
  },
  {
    title: "للمشترين",
    questions: [
      {
        q: "كيف أبحث عن كتاب معين؟",
        a: "استخدم شريط البحث أو الفلاتر الذكية للبحث حسب الكلية، التخصص، المادة، أو اسم الكتاب مباشرة."
      },
      {
        q: "كيف أتواصل مع البائع؟",
        a: "من صفحة تفاصيل الكتاب، يمكنك الضغط على 'تواصل مع البائع' للمراسلة عبر المنصة، أو استخدام زر 'واتساب' للتواصل المباشر."
      },
      {
        q: "هل يمكنني التفاوض على السعر؟",
        a: "نعم، إذا كان الإعلان يحمل علامة 'قابل للتفاوض'. يمكنك التواصل مع البائع ومناقشة السعر مباشرة."
      },
      {
        q: "ماذا لو كان الكتاب مختلفاً عن الوصف؟",
        a: "ننصح دائماً بمعاينة الكتاب قبل الشراء. إذا وجدت أن الكتاب يختلف جوهرياً عن الوصف، يمكنك الإبلاغ عن الإعلان."
      }
    ]
  },
  {
    title: "الأمان والثقة",
    questions: [
      {
        q: "كيف تضمنون أمان المعاملات؟",
        a: "جميع المستخدمين طلاب موثقون من الجامعة. ننصح بالتسليم داخل حرم الجامعة في أماكن عامة. لا تقم بتحويل أموال قبل استلام الكتاب."
      },
      {
        q: "ماذا أفعل إذا واجهت مشكلة؟",
        a: "يمكنك التبليغ عن أي إعلان أو مستخدم من خلال زر 'تبليغ'. سيقوم فريقنا بمراجعة البلاغ واتخاذ الإجراء المناسب."
      },
      {
        q: "هل معلوماتي الشخصية آمنة؟",
        a: "نعم، نحافظ على خصوصية معلوماتك الشخصية ولا نشاركها مع أي طرف ثالث. رقم هاتفك يظهر فقط للمشترين المهتمين."
      }
    ]
  }
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">مركز المساعدة</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              الأسئلة الشائعة
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              إجابات على أكثر الأسئلة شيوعاً حول استخدام منصة UniBookClub
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="max-w-3xl mx-auto space-y-8">
            {faqCategories.map((category, idx) => (
              <div key={idx} className="bg-card border border-border/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">{category.title}</h2>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, qIdx) => (
                    <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                      <AccordionTrigger className="text-right hover:no-underline">
                        <span className="text-foreground font-medium">{item.q}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground whitespace-pre-line text-right">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="max-w-3xl mx-auto mt-12 text-center p-8 bg-primary/5 rounded-2xl border border-primary/10">
            <h3 className="text-xl font-bold text-foreground mb-2">لم تجد إجابة سؤالك؟</h3>
            <p className="text-muted-foreground mb-4">
              تواصل معنا وسنرد عليك في أقرب وقت
            </p>
            <a 
              href="/contact" 
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              تواصل معنا
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
