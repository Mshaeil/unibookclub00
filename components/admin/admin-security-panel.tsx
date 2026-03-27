"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Loader2 } from "lucide-react"

export function AdminSecurityPanel() {
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function promote() {
    setMessage(null)
    setError(null)
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError("أدخل البريد الإلكتروني")
      return
    }
    setLoading(true)
    try {
      const { data, error: rpcErr } = await supabase.rpc("admin_promote_by_email", {
        target_email: trimmed,
      })
      if (rpcErr) {
        if (/does not exist|PGRST202|42883/i.test(rpcErr.message)) {
          setError(
            "الدالة غير موجودة — نفّذ سكربت scripts/012_messaging_admin_promote.sql في Supabase (قسم SQL).",
          )
        } else {
          setError(rpcErr.message)
        }
        return
      }
      const n = typeof data === "number" ? data : 0
      if (n === 0) {
        setMessage("لم يُعثر على مستخدم بهذا البريد في نظام الدخول (تحقق من التطابق الكامل مع بريد الحساب).")
      } else {
        setMessage(`تم تفعيل صلاحيات المدير لـ ${n} مستخدم. أعد تحميل الصفحة لرؤية التحديث في الجدول.`)
        setEmail("")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تنفيذ العملية حالياً")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5" />
          الأمن — ترقية مدير بالبريد
        </CardTitle>
        <CardDescription>
          أدخل البريد المسجّل في الحساب (نفس بريد تسجيل الدخول). يُحدَّث الدور إلى «مدير» فوراً دون خطوات إضافية.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="promote-admin-email">البريد الإلكتروني</Label>
          <Input
            id="promote-admin-email"
            type="email"
            dir="ltr"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <Button type="button" onClick={() => void promote()} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          تفعيل الأدمن
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  )
}
