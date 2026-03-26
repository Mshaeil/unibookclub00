"use client"

import Link from "next/link"
import { BookOpen } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export function Footer() {
  const { language } = useLanguage()
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
                <span className="text-xs text-sidebar-foreground/70">
                  {language === "ar" ? "جامعة العلوم التطبيقية" : "Applied Science University"}
                </span>
              </div>
            </Link>
            <p className="text-sidebar-foreground/70 max-w-md text-sm leading-relaxed">
              {language === "ar"
                ? "منصة لطلاب جامعة العلوم التطبيقية تركّز على بيع وشراء الكتب الجامعية والملخصات — تصفّح حسب الكلية والمادة بسهولة."
                : "For ASU students: buy and sell university books and summaries — browse by faculty and course."}
            </p>
            <p className="text-sm text-sidebar-foreground/70">
              {language === "ar" ? "البريد الرسمي:" : "Official email:"}{" "}
              <a href="mailto:support@unibookclub.com" className="hover:text-sidebar-foreground underline underline-offset-4">
                support@unibookclub.com
              </a>
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">{language === "ar" ? "روابط سريعة" : "Quick links"}</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                {language === "ar" ? "الرئيسية" : "Home"}
              </Link>
              <Link href="/browse" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                {language === "ar" ? "تصفح الكتب والملخصات" : "Browse books & summaries"}
              </Link>
              <Link href="#faculties" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                {language === "ar" ? "الكليات" : "Faculties"}
              </Link>
              <Link href="/dashboard/listings/new" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                {language === "ar" ? "اعرض كتاباً أو ملخصاً" : "List book or summary"}
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold">{language === "ar" ? "المساعدة" : "Help"}</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/how-it-works" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                {language === "ar" ? "كيف يعمل الموقع؟" : "How it works?"}
              </Link>
              <Link href="/faq" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                {language === "ar" ? "الأسئلة الشائعة" : "FAQ"}
              </Link>
              <Link href="/contact" className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                {language === "ar" ? "تواصل معنا" : "Contact us"}
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-sidebar-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-sidebar-foreground/60">
          <p>© 2024 UniBookClub. {language === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-sidebar-foreground transition-colors">
              {language === "ar" ? "سياسة الاستخدام" : "Terms"}
            </Link>
            <Link href="/faq" className="hover:text-sidebar-foreground transition-colors">
              {language === "ar" ? "الأسئلة الشائعة" : "FAQ"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
