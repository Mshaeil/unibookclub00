import type { Metadata } from 'next'
import { Tajawal, Cairo } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import { DeferredVitals } from "@/components/deferred-vitals"
import { NavigationProgress } from "@/components/navigation-progress"
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
  title: {
    default: 'UniBookClub — سوق الكتب والملخصات | جامعة العلوم التطبيقية',
    template: '%s | UniBookClub',
  },
  description:
    'سوق طلابي لبيع وشراء الكتب الجامعية والملخصات داخل جامعة العلوم التطبيقية — تصفّح، احجز، وتواصل بأمان.',
  keywords: [
    'كتب جامعية',
    'ملخصات',
    'جامعة العلوم التطبيقية',
    'UniBookClub',
    'سوق طلابي',
  ],
  openGraph: {
    type: 'website',
    locale: 'ar_JO',
    siteName: 'UniBookClub',
    title: 'UniBookClub — سوق الكتب والملخصات',
    description:
      'بيع وشراء الكتب والملخصات الجامعية — تجربة حديثة وسريعة لطلاب جامعة العلوم التطبيقية.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UniBookClub',
    description: 'سوق الكتب والملخصات لطلاب جامعة العلوم التطبيقية',
  },
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
          <NavigationProgress />
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
        <DeferredVitals />
      </body>
    </html>
  )
}
