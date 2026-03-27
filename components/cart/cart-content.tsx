"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { addToCart, readCart, removeFromCart } from "@/lib/cart"
import { ShoppingCart, Trash2 } from "lucide-react"
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile"

type ListingRow = {
  id: string
  title: string
  price: number
  images: string[] | null
  availability: string
  status: string
  seller_id: string
}

type FulfillmentType = "campus_pickup" | "delivery"

export function CartContent() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [ids, setIds] = useState<string[]>([])
  const [rows, setRows] = useState<ListingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("campus_pickup")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const items = readCart()
    setIds(items.map((i) => i.listingId))
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      const items = readCart()
      const listingIds = items.map((i) => i.listingId)
      setIds(listingIds)
      if (listingIds.length === 0) {
        setRows([])
        setLoading(false)
        return
      }

      const { data, error: qErr } = await supabase
        .from("listings")
        .select("id, title, price, images, availability, status, seller_id")
        .in("id", listingIds)

      setLoading(false)
      if (qErr) {
        setError(qErr.message)
        setRows([])
        return
      }

      const map = new Map((data || []).map((r) => [r.id, r as ListingRow]))
      setRows(listingIds.map((id) => map.get(id)).filter(Boolean) as ListingRow[])
    }
    void load()
  }, [supabase])

  function remove(id: string) {
    removeFromCart(id)
    setIds((prev) => prev.filter((x) => x !== id))
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  async function reserveFirst() {
    setError(null)
    setSubmitting(true)
    const first = rows[0]
    if (!first) {
      setSubmitting(false)
      return
    }
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      setSubmitting(false)
      router.push("/login?redirect=/cart")
      return
    }

    const ensured = await ensureUserProfile(supabase, auth.user)
    if (!ensured.ok) {
      setSubmitting(false)
      setError(
        ensured.error.includes("row-level security")
          ? "تعذّر تجهيز حسابك. جرّب تسجيل الخروج والدخول مجدداً أو تواصل مع الدعم."
          : ensured.error,
      )
      return
    }

    const { data: orderId, error: rpcErr } = await supabase.rpc("create_order_reserve_listing", {
      p_listing_id: first.id,
      p_fulfillment_type: fulfillment,
      p_note: note.trim() || null,
    })

    setSubmitting(false)
    if (rpcErr || !orderId) {
      const msg = rpcErr?.message || "فشل الحجز"
      if (/does not exist|PGRST202|42883/i.test(msg)) {
        setError("ميزة الحجز غير مفعّلة في قاعدة البيانات بعد. نفّذ scripts/020_orders_cart_points.sql في Supabase SQL Editor.")
      } else {
        setError(msg)
      }
      return
    }

    removeFromCart(first.id)
    router.push(`/orders/${orderId}`)
    router.refresh()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">السلة</h1>
          <p className="text-muted-foreground mt-1">
            أضف الكتب التي تريدها، ثم احجز لفتح صفحة الفاتورة والتواصل.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/browse">
            <ShoppingCart className="h-4 w-4" />
            تصفح المزيد
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>العناصر</CardTitle>
            <CardDescription>{ids.length} عنصر</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {loading ? (
              <div className="space-y-3">
                <div className="h-16 bg-muted rounded-md animate-pulse" />
                <div className="h-16 bg-muted rounded-md animate-pulse" />
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">سلتك فارغة.</p>
            ) : (
              rows.map((r) => (
                <div key={r.id} className="flex gap-3 rounded-lg border p-3">
                  <div className="relative h-16 w-12 overflow-hidden rounded-md bg-muted shrink-0">
                    {r.images?.[0] ? (
                      <Image
                        src={`/api/file?pathname=${encodeURIComponent(r.images[0])}`}
                        alt={r.title}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/book/${r.id}`} className="font-medium hover:underline line-clamp-1">
                      {r.title}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">{r.price} د.أ</p>
                    {(r.status !== "approved" || r.availability !== "available") && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        هذا العرض غير متاح للحجز الآن (قد يكون محجوزاً/مباعاً).
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label="remove">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الحجز</CardTitle>
            <CardDescription>سيتم حجز أول عنصر في السلة حالياً (نسخة أولى).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>طريقة الاستلام</Label>
              <Select value={fulfillment} onValueChange={(v) => setFulfillment(v as FulfillmentType)} disabled={submitting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="campus_pickup">استلام داخل الجامعة</SelectItem>
                  <SelectItem value="delivery">خدمة توصيل (اختياري)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ملاحظة (اختياري)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="resize-none"
                placeholder="مثال: أقدر أستلم عند بوابة الجامعة الساعة 2…"
                disabled={submitting}
              />
            </div>
            <Button onClick={reserveFirst} disabled={submitting || rows.length === 0} className="w-full">
              {submitting ? "جاري الحجز..." : "حجز وفتح الفاتورة"}
            </Button>
            <p className="text-xs text-muted-foreground">
              ملاحظة: يلزم تنفيذ سكربت قاعدة البيانات للطلبات قبل تفعيل الحجز.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

