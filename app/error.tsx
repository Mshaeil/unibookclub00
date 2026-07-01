"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useTranslate } from "@/components/language-provider"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslate()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{t("حدث خطأ غير متوقع", "Something went wrong")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("نعتذر عن الإزعاج. يمكنك إعادة المحاولة أو العودة للرئيسية.", "Sorry for the inconvenience. Try again or go home.")}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button type="button" onClick={() => reset()}>
              {t("إعادة المحاولة", "Try again")}
            </Button>
            <Button asChild variant="outline">
              <Link href="/">{t("الرئيسية", "Home")}</Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
