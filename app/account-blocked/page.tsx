import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AccountBlockedPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const sp = await searchParams
  const t = sp.type === "banned" ? "banned" : "suspended"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/30">
      <div className="max-w-md w-full rounded-2xl border bg-card p-8 text-center space-y-4 shadow-sm">
        <h1 className="text-xl font-bold">
          {t === "banned" ? "تم حظر حسابك" : "حسابك موقوف مؤقتاً"}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t === "banned"
            ? "لا يمكنك استخدام المنصة. إذا كان ذلك خطأ، تواصل مع الدعم عبر البريد الرسمي للموقع."
            : "تم تعليق حسابك من قبل الإدارة. يمكن إعادة التفعيل لاحقاً — للاستفسار تواصل مع الدعم."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Button asChild variant="default">
            <Link href="/">العودة للرئيسية</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">تسجيل الدخول (حساب آخر)</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
