"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { FileDown, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslate } from "@/components/language-provider"
import { formatJod } from "@/lib/utils"

type SaleRow = {
  id: string
  reference_code: string
  created_at: string
  listing_id: string
  listingHasPdf?: boolean
  listing:
    | { id: string; title: string; price: number; images: string[] | null; status: string }
    | { id: string; title: string; price: number; images: string[] | null; status: string }[]
    | null
  seller: { id: string; full_name: string | null } | { id: string; full_name: string | null }[] | null
}

type Props = {
  sales: SaleRow[]
  reviewedListingIds: string[]
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

export function PurchasesContent({ sales, reviewedListingIds }: Props) {
  const t = useTranslate()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const reviewed = useMemo(() => new Set(reviewedListingIds), [reviewedListingIds])

  const [ratingByListing, setRatingByListing] = useState<Record<string, number>>({})
  const [commentByListing, setCommentByListing] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  async function submitReview(listingId: string, sellerId: string) {
    const rating = ratingByListing[listingId] ?? 5
    const comment = (commentByListing[listingId] ?? "").trim()
    setSubmittingId(listingId)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSubmittingId(null)
      return
    }
    const { error } = await supabase.from("seller_reviews").insert({
      seller_id: sellerId,
      reviewer_id: user.id,
      listing_id: listingId,
      rating,
      comment: comment || null,
    })
    setSubmittingId(null)
    if (error) {
      window.alert(error.message)
      return
    }
    router.refresh()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("مشترياتك", "Your purchases")}</h1>
        <p className="text-muted-foreground mt-1">
          {t(
            "يظهر هنا ما سجّله البائع عندما يطابق بريدك أو رقم التواصل بيانات ملفك. بعد التقييم يمكنك تحميل ملف PDF إن وُجد.",
            "Purchases appear when the seller’s record matches your login email or profile phone. After you rate, you can download any attached PDF.",
          )}
        </p>
      </div>

      {sales.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("لا توجد مشتريات مسجّلة بعد.", "No recorded purchases yet.")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sales.map((sale) => {
            const listing = one(sale.listing)
            const seller = one(sale.seller)
            if (!listing || !seller) return null
            const img = listing.images?.[0]
            const already = reviewed.has(listing.id)
            const stars = ratingByListing[listing.id] ?? 5

            return (
              <Card key={sale.id}>
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    {img ? (
                      <Image
                        src={`/api/file?pathname=${encodeURIComponent(img)}`}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2">{listing.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {t("البائع:", "Seller:")} {seller.full_name || "—"} · {formatJod(listing.price)} د.أ
                    </CardDescription>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("مرجع العملية:", "Reference:")} {sale.reference_code}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/book/${listing.id}`}>{t("عرض الإعلان", "View listing")}</Link>
                  </Button>
                </CardHeader>
                <CardContent className="border-t pt-4 space-y-3">
                  {sale.listingHasPdf && !already && (
                    <p className="text-sm text-amber-700 dark:text-amber-500 bg-amber-500/10 rounded-md px-3 py-2">
                      {t(
                        "يُتاح تحميل ملف PDF بعد إرسال تقييمك للبائع.",
                        "PDF download unlocks after you submit your rating.",
                      )}
                    </p>
                  )}
                  {already ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {t("تم إرسال تقييمك لهذه العملية.", "You already submitted a review for this purchase.")}
                      </p>
                      {sale.listingHasPdf && (
                        <Button variant="default" className="gap-2" asChild>
                          <a href={`/api/listings/${listing.id}/pdf`} target="_blank" rel="noreferrer">
                            <FileDown className="h-4 w-4" />
                            {t("تحميل PDF", "Download PDF")}
                          </a>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium">{t("تقييم البائع", "Rate the seller")}</p>
                      <div className="flex gap-1" role="group" aria-label={t("النجوم", "Stars")}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="p-1 rounded-md hover:bg-muted transition-colors"
                            onClick={() =>
                              setRatingByListing((prev) => ({ ...prev, [listing.id]: n }))
                            }
                            aria-pressed={stars === n}
                          >
                            <Star
                              className={`h-7 w-7 ${
                                n <= stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <Textarea
                        placeholder={t("ملاحظاتك (اختياري)", "Your note (optional)")}
                        value={commentByListing[listing.id] ?? ""}
                        onChange={(e) =>
                          setCommentByListing((prev) => ({
                            ...prev,
                            [listing.id]: e.target.value,
                          }))
                        }
                        rows={3}
                      />
                      <Button
                        onClick={() => submitReview(listing.id, seller.id)}
                        disabled={submittingId === listing.id}
                        className="gap-2"
                      >
                        <Star className="h-4 w-4" />
                        {submittingId === listing.id
                          ? t("جاري الإرسال...", "Sending...")
                          : t("إرسال التقييم", "Submit review")}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
