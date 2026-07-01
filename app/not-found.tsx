import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">الصفحة غير موجودة</h1>
          <p className="text-muted-foreground text-sm">
            الرابط الذي طلبته غير صالح أو أُزيل. جرّب العودة للرئيسية أو تصفح الكتب.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">الرئيسية</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/browse">تصفح الكتب</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
