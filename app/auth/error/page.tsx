import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, AlertTriangle } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">حدث خطأ</CardTitle>
          <CardDescription className="text-base">
            عذراً، حدث خطأ أثناء المصادقة. يرجى المحاولة مرة أخرى.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/login">تسجيل الدخول</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">العودة للرئيسية</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
