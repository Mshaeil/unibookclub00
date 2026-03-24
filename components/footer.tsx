import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Logo & Description */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
                <BookOpen className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold">UniBookClub</span>
                <span className="text-xs text-sidebar-foreground/70">جامعة العلوم التطبيقية</span>
              </div>
            </Link>
            <p className="text-sidebar-foreground/70 max-w-md text-sm leading-relaxed">
              منصة حصرية لطلاب جامعة العلوم التطبيقية لبيع وشراء الكتب الجامعية. 
              نهدف لتسهيل الوصول إلى المراجع الدراسية بأسعار مناسبة.
            </p>
            <p className="text-sm text-sidebar-foreground/70">
              البريد الرسمي:{" "}
              <a href="mailto:support@unibookclub.com" className="hover:text-sidebar-foreground underline underline-offset-4">
                support@unibookclub.com
              </a>
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">روابط سريعة</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                الرئيسية
              </Link>
              <Link href="/browse" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                تصفح الكتب
              </Link>
              <Link href="#faculties" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                الكليات
              </Link>
              <Link href="/dashboard/listings/new" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                أضف كتابك
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold">المساعدة</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/how-it-works" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                كيف يعمل الموقع؟
              </Link>
              <Link href="/faq" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                الأسئلة الشائعة
              </Link>
              <Link href="/contact" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                تواصل معنا
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-sidebar-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-sidebar-foreground/60">
          <p>© 2024 UniBookClub. جميع الحقوق محفوظة.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-sidebar-foreground transition-colors">
              سياسة الاستخدام
            </Link>
            <Link href="/faq" className="hover:text-sidebar-foreground transition-colors">
              الأسئلة الشائعة
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
