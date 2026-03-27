"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Truck, User, MessageCircle, Phone, RefreshCw, Star } from "lucide-react"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

type OrderRow = {
  id: string
  listing_id: string
  seller_id: string
  buyer_id: string
  status: string
  fulfillment_type: string
  delivery_note: string | null
  price: number
  points_earned: number
  created_at: string
  updated_at: string
  listing:
    | {
        id: string
        title?: string
        price?: number
        images?: string[] | null
        availability?: string
        status?: string
        seller?: { id: string; full_name: string | null; phone: string | null; whatsapp: string | null } | null
      }
    | { id: string }[]
    | null
}

type EventRow = {
  id: string
  actor_id: string
  from_status: string | null
  to_status: string
  note: string | null
  created_at: string
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

const statusLabel: Record<string, string> = {
  reserved: "محجوز",
  in_delivery: "قيد التسليم",
  delivered: "تم التسليم",
  received: "تم الاستلام",
  cancelled: "ملغي",
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  reserved: "secondary",
  in_delivery: "default",
  delivered: "outline",
  received: "default",
  cancelled: "destructive",
}

export function OrderInvoice({
  viewerUserId,
  order,
  events,
  pointsBalance,
  existingReview,
  redeemedPoints,
}: {
  viewerUserId: string
  order: OrderRow
  events: EventRow[]
  pointsBalance: number
  existingReview: { id: string; rating: number; comment: string | null } | null
  redeemedPoints: number
}) {
  const supabase = useMemo(() => createClient(), [])
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ratingValue, setRatingValue] = useState<number>(existingReview?.rating ?? 5)
  const [ratingComment, setRatingComment] = useState<string>(existingReview?.comment ?? "")
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [redeemDraft, setRedeemDraft] = useState("")
  const [redeemSubmitting, setRedeemSubmitting] = useState(false)
  const [orderState, setOrderState] = useState<OrderRow>(order)
  const [eventsState, setEventsState] = useState<EventRow[]>(events)
  const [pointsBalanceState, setPointsBalanceState] = useState<number>(pointsBalance)
  const [existingReviewState, setExistingReviewState] = useState<{ id: string; rating: number; comment: string | null } | null>(
    existingReview,
  )
  const [redeemedPointsState, setRedeemedPointsState] = useState<number>(redeemedPoints)

  useEffect(() => setOrderState(order), [order])
  useEffect(() => setEventsState(events), [events])
  useEffect(() => setPointsBalanceState(pointsBalance), [pointsBalance])
  useEffect(() => setExistingReviewState(existingReview), [existingReview])
  useEffect(() => setRedeemedPointsState(redeemedPoints), [redeemedPoints])

  useEffect(() => {
    const channel = supabase
      .channel(`order-live-${order.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${order.id}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const n = payload.new as Record<string, unknown>
          setOrderState((prev) => ({
            ...prev,
            status: (n.status as string) || prev.status,
            points_earned: typeof n.points_earned === "number" ? (n.points_earned as number) : prev.points_earned,
            updated_at: (n.updated_at as string) || prev.updated_at,
          }))
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_events", filter: `order_id=eq.${order.id}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const n = payload.new as Record<string, unknown>
          const next: EventRow = {
            id: String(n.id),
            actor_id: String(n.actor_id),
            from_status: (n.from_status as string | null) ?? null,
            to_status: String(n.to_status),
            note: (n.note as string | null) ?? null,
            created_at: String(n.created_at),
          }
          setEventsState((prev) => (prev.some((e) => e.id === next.id) ? prev : [...prev, next]))
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase, order.id])

  const listing = one(orderState.listing) as
    | {
        id: string
        title?: string
        images?: string[] | null
        seller?: { id: string; full_name: string | null; phone: string | null; whatsapp: string | null } | null
      }
    | null
  const seller = listing?.seller ?? null

  const isBuyer = viewerUserId === orderState.buyer_id
  const isSeller = viewerUserId === orderState.seller_id

  const canCancel = orderState.status !== "received" && orderState.status !== "cancelled"
  const canSellerSetInDelivery = isSeller && orderState.status === "reserved"
  const canSellerSetDelivered = isSeller && (orderState.status === "reserved" || orderState.status === "in_delivery")
  const canBuyerSetReceived = isBuyer && (orderState.status === "delivered" || orderState.status === "in_delivery")
  const canRate = isBuyer && orderState.status === "received" && !existingReviewState
  const canRedeem = isBuyer && orderState.status !== "received" && orderState.status !== "cancelled"

  async function setStatus(next: string) {
    setError(null)
    setSubmitting(true)
    try {
      const { error: rpcErr } = await supabase.rpc("order_set_status", {
        p_order_id: orderState.id,
        p_next_status: next,
        p_note: note.trim() || null,
      })
      if (rpcErr) {
        const msg = rpcErr.message || "فشل تحديث الحالة"
        if (/does not exist|PGRST202|42883/i.test(msg)) {
          setError("ميزة الطلبات غير مفعّلة في قاعدة البيانات بعد. نفّذ scripts/020_orders_cart_points.sql في Supabase SQL Editor.")
        } else if (/invalid_transition/i.test(msg)) {
          setError("الانتقال بين الحالات غير مسموح حالياً. جرّب تحديث الصفحة ثم إعادة المحاولة.")
        } else {
          setError(msg)
        }
        return
      }
      setOrderState((prev) => ({ ...prev, status: next }))
      setNote("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحديث حالة الطلب حالياً")
    } finally {
      setSubmitting(false)
    }
  }

  const whatsappDigits = (seller?.whatsapp || seller?.phone || "").replace(/\D/g, "")

  const discountJod = Math.min(orderState.price, Math.max(0, redeemedPointsState / 100))
  const payable = Math.max(0, Number(orderState.price) - discountJod)

  async function redeemPoints() {
    const n = Number(redeemDraft)
    if (!Number.isFinite(n) || n <= 0) return
    setError(null)
    setRedeemSubmitting(true)
    try {
      const { data: used, error: rpcErr } = await supabase.rpc("redeem_points_for_order", {
        p_order_id: orderState.id,
        p_points: Math.floor(n),
      })
      if (rpcErr) {
        const msg = rpcErr.message || "فشل استخدام النقاط"
        if (/does not exist|PGRST202|42883/i.test(msg)) {
          setError("ميزة الخصم بالنقاط غير مفعّلة في قاعدة البيانات بعد. نفّذ scripts/021_points_redemption.sql في Supabase SQL Editor.")
        } else if (/insufficient_points/i.test(msg)) {
          setError("رصيد النقاط غير كافٍ.")
        } else if (/redeem_limit_reached/i.test(msg)) {
          setError("لا يمكن استخدام نقاط أكثر على هذا الطلب.")
        } else {
          setError(msg)
        }
        return
      }
      if (typeof used === "number" && used > 0) {
        setRedeemedPointsState((prev) => prev + used)
        setPointsBalanceState((prev) => Math.max(0, prev - used))
        setRedeemDraft("")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر استخدام النقاط حالياً")
    } finally {
      setRedeemSubmitting(false)
    }
  }

  async function submitReview() {
    if (!listing?.id) return
    setError(null)
    setRatingSubmitting(true)
    const { error: insErr } = await supabase.from("seller_reviews").insert({
      seller_id: orderState.seller_id,
      reviewer_id: viewerUserId,
      listing_id: orderState.listing_id,
      rating: ratingValue,
      comment: ratingComment.trim() || null,
    })
    setRatingSubmitting(false)
    if (insErr) {
      setError(insErr.message)
      return
    }
    setExistingReviewState({ id: crypto.randomUUID(), rating: ratingValue, comment: ratingComment.trim() || null })
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الفاتورة / الطلب</h1>
          <p className="text-muted-foreground mt-1">
            رقم الطلب: <span className="font-mono">{orderState.id}</span>
          </p>
        </div>
        <Badge variant={statusVariant[orderState.status] ?? "secondary"}>{statusLabel[orderState.status] ?? orderState.status}</Badge>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل الطلب</CardTitle>
            <CardDescription>اتفاق خارج الموقع — الدفع يتم بين الطرفين.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {listing ? (
              <div className="flex gap-3 rounded-lg border p-3">
                <div className="relative h-16 w-12 overflow-hidden rounded-md bg-muted shrink-0">
                  {listing.images?.[0] ? (
                    <Image
                      src={`/api/file?pathname=${encodeURIComponent(listing.images[0])}`}
                      alt={listing.title || "Listing"}
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/book/${listing.id}`} className="font-medium hover:underline line-clamp-1">
                    {listing.title || "—"}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">
                    السعر: {orderState.price} د.أ
                  </p>
                  {redeemedPointsState > 0 ? (
                    <p className="text-sm text-muted-foreground mt-1">
                      خصم بالنقاط: −{discountJod.toFixed(2)} د.أ (‏{redeemedPointsState} نقطة)
                      <br />
                      <span className="font-medium text-foreground">المبلغ بعد الخصم: {payable.toFixed(2)} د.أ</span>
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">تعذر تحميل بيانات الإعلان.</p>
            )}

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">طريقة الاستلام</p>
                <p className="font-medium flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  {orderState.fulfillment_type === "delivery" ? "خدمة توصيل" : "استلام داخل الجامعة"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">التاريخ</p>
                <p className="font-medium">{new Date(orderState.created_at).toLocaleString("ar-JO")}</p>
              </div>
            </div>

            {orderState.delivery_note ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">ملاحظة</p>
                <p className="text-sm whitespace-pre-wrap">{orderState.delivery_note}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                تواصل
              </CardTitle>
              <CardDescription>التواصل خارج الموقع عبر واتساب/الهاتف.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="text-muted-foreground">البائع</p>
                <p className="font-medium">{seller?.full_name || "—"}</p>
              </div>
              <div className="grid gap-2">
                <Button asChild className="gap-2" disabled={!whatsappDigits}>
                  <a href={whatsappDigits ? `https://wa.me/${whatsappDigits}` : "#"} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    واتساب
                  </a>
                </Button>
                <Button asChild variant="outline" className="gap-2" disabled={!seller?.phone}>
                  <a href={seller?.phone ? `tel:${seller.phone}` : "#"}>
                    <Phone className="h-4 w-4" />
                    اتصال
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تحديث الحالة</CardTitle>
              <CardDescription>حسب دورك (بائع/مشتري) تظهر الأزرار المتاحة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>ملاحظة (اختياري)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="resize-none"
                  placeholder="مثال: سأكون عند بوابة الجامعة…"
                  disabled={submitting}
                />
              </div>

              <div className="grid gap-2">
                {canSellerSetInDelivery ? (
                  <Button onClick={() => setStatus("in_delivery")} disabled={submitting} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    بدء الترتيب/التسليم
                  </Button>
                ) : null}
                {canSellerSetDelivered ? (
                  <Button onClick={() => setStatus("delivered")} disabled={submitting} variant="outline">
                    تم التسليم
                  </Button>
                ) : null}
                {canBuyerSetReceived ? (
                  <Button onClick={() => setStatus("received")} disabled={submitting}>
                    تم الاستلام
                  </Button>
                ) : null}
                {canCancel ? (
                  <Button onClick={() => setStatus("cancelled")} disabled={submitting} variant="destructive">
                    إلغاء الطلب
                  </Button>
                ) : null}
              </div>

              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="font-medium">نقاطك</p>
                <p className="text-muted-foreground mt-1" dir="ltr">
                  {pointsBalanceState} pts
                </p>
                {orderState.status === "received" ? (
                  <p className="text-muted-foreground mt-1">
                    تم كسب {orderState.points_earned} نقطة من هذه العملية.
                  </p>
                ) : (
                  <p className="text-muted-foreground mt-1">
                    تُضاف النقاط بعد تأكيد «تم الاستلام».
                  </p>
                )}
              </div>

              <div className="rounded-md border p-3 text-sm space-y-2">
                <p className="font-medium">خصم بالنقاط</p>
                <p className="text-muted-foreground">
                  100 نقطة = 1.00 د.أ. {canRedeem ? "يمكنك استخدام النقاط الآن." : "غير متاح بعد إغلاق الطلب."}
                </p>
                <div className="flex gap-2">
                  <input
                    className="flex-1 h-10 rounded-md border bg-background px-3 text-sm"
                    inputMode="numeric"
                    placeholder="مثال: 200"
                    value={redeemDraft}
                    onChange={(e) => setRedeemDraft(e.target.value.replace(/[^\d]/g, ""))}
                    disabled={!canRedeem || redeemSubmitting}
                  />
                  <Button onClick={redeemPoints} disabled={!canRedeem || redeemSubmitting || !redeemDraft}>
                    {redeemSubmitting ? "..." : "استخدم"}
                  </Button>
                </div>
                {redeemedPointsState > 0 ? (
                  <p className="text-muted-foreground">
                    تم استخدام {redeemedPointsState} نقطة على هذا الطلب.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تقييم البائع</CardTitle>
              <CardDescription>يظهر بعد تأكيد الاستلام.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {existingReviewState ? (
                <div className="rounded-md border p-3 text-sm">
                  <p className="font-medium">تم إرسال تقييمك</p>
                  <p className="text-muted-foreground mt-1">النجوم: {existingReviewState.rating} / 5</p>
                  {existingReviewState.comment ? (
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{existingReviewState.comment}</p>
                  ) : null}
                </div>
              ) : canRate ? (
                <>
                  <div className="space-y-2">
                    <Label>عدد النجوم</Label>
                    <Select
                      value={String(ratingValue)}
                      onValueChange={(v) => setRatingValue(Number(v))}
                      disabled={ratingSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 نجوم</SelectItem>
                        <SelectItem value="4">4 نجوم</SelectItem>
                        <SelectItem value="3">3 نجوم</SelectItem>
                        <SelectItem value="2">2 نجوم</SelectItem>
                        <SelectItem value="1">1 نجمة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>تعليق (اختياري)</Label>
                    <Textarea
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      rows={3}
                      className="resize-none"
                      placeholder="اكتب رأيك عن البائع…"
                      disabled={ratingSubmitting}
                    />
                  </div>
                  <Button onClick={submitReview} disabled={ratingSubmitting} className="gap-2">
                    <Star className="h-4 w-4" />
                    {ratingSubmitting ? "جاري الإرسال..." : "إرسال التقييم"}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isBuyer ? "يمكنك تقييم البائع بعد «تم الاستلام»." : "التقييم متاح للمشتري فقط."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>سجل الحالة</CardTitle>
              <CardDescription>آخر التحديثات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {eventsState.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا يوجد سجل بعد.</p>
              ) : (
                <div className="space-y-2">
                  {eventsState.slice().reverse().slice(0, 8).map((e) => (
                    <div key={e.id} className="text-sm rounded-md border p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{statusLabel[e.to_status] ?? e.to_status}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleString("ar-JO")}
                        </span>
                      </div>
                      {e.note ? <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{e.note}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

