import type { Metadata } from 'next'
import { Tajawal, Cairo } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import { DeferredVitals } from "@/components/deferred-vitals"
import './globals.css'

const tajawal = Tajawal({ 
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: true,
});

const cairo = Cairo({ 
  subsets: ["arabic", "latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: 'UniBookClub — كتب وملخصات جامعة العلوم التطبيقية',
  description:
    'منصة لطلاب جامعة العلوم التطبيقية: بيع وشراء الكتب الجامعية والملخصات بسهولة — تصفح حسب الكلية والمادة.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${tajawal.variable} ${cairo.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
        <DeferredVitals />
      </body>
    </html>
  )
}
