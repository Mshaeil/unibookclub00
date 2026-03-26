"use client"

import { useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslate } from "@/components/language-provider"

type Row = {
  id: string
  created_at: string
  status: string
  fulfillment_type: string
  price: number
  buyer_id: string
  seller_id: string
  listing:
    | { id: string; title: string; images: string[] | null }
    | { id: string; title: string; images: string[] | null }[]
    | null
  seller: { id: string; full_name: string | null } | { id: string; full_name: string | null }[] | null
  buyer: { id: string; full_name: string | null } | { id: string; full_name: string | null }[] | null
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

export function OrdersContent({ viewerUserId, rows }: { viewerUserId: string; rows: Row[] }) {
  const t = useTranslate()

  const normalized = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        listing: one(r.listing),
        seller: one(r.seller),
        buyer: one(r.buyer),
      })),
    [rows],
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("طلباتي", "My orders")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("هنا تظهر الحجوزات والطلبات سواء كمشتري أو كبائع.", "See reservations/orders as buyer or seller.")}
        </p>
      </div>

      {normalized.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {t("لا يوجد طلبات بعد.", "No orders yet.")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {normalized.map((r) => {
            const listing = r.listing
            const isBuyer = viewerUserId === r.buyer_id
            return (
              <Card key={r.id} className="hover:bg-muted/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base">
                        <Link href={`/orders/${r.id}`} className="hover:underline">
                          {listing?.title || t("طلب", "Order")}
                        </Link>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {t("الحالة:", "Status:")} {statusLabel[r.status] ?? r.status} •{" "}
                        {new Date(r.created_at).toLocaleString("ar-JO")}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{r.fulfillment_type === "delivery" ? "توصيل" : "استلام جامعة"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-3">
                    <div className="relative h-16 w-12 overflow-hidden rounded-md bg-muted shrink-0">
                      {listing?.images?.[0] ? (
                        <Image
                          src={`/api/file?pathname=${encodeURIComponent(listing.images[0])}`}
                          alt={listing.title || "Listing"}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="text-muted-foreground">
                        {t("السعر:", "Price:")} {r.price} د.أ
                      </p>
                      <p className="text-muted-foreground mt-1">
                        {t("الدور:", "Role:")} {isBuyer ? t("مشتري", "Buyer") : t("بائع", "Seller")}
                      </p>
                    </div>
                    <Link href={`/orders/${r.id}`} className="text-sm font-medium text-primary hover:underline">
                      {t("فتح الفاتورة", "Open invoice")}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

