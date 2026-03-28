"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useTranslate } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, BookOpen, Eye } from "lucide-react"
import { discountPercentLabel, isPromoDiscountActive } from "@/lib/utils/listing-discount"
import { formatJod } from "@/lib/utils"

type Listing = {
  id: string
  title: string
  price: number
  original_price?: number | null
  discount_expires_at?: string | null
  condition: string
  availability: string
  images: string[]
  views_count: number
  created_at: string
  course: { name: string } | null
}

type Props = {
  listings: Listing[]
}

const availabilityColors: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800",
  reserved: "bg-amber-100 text-amber-800",
  sold: "bg-red-100 text-red-800",
}

export function FavoritesContent({ listings: initialListings }: Props) {
  const t = useTranslate()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [listings, setListings] = useState<Listing[]>(initialListings)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const availabilityLabels: Record<string, string> = {
    available: t("متاح", "Available"),
    reserved: t("محجوز", "Reserved"),
    sold: t("مباع", "Sold"),
  }

  async function handleRemoveFavorite(listingId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    setRemovingId(listingId)
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
    setListings((prev) => prev.filter((l) => l.id !== listingId))
    setRemovingId(null)
    router.refresh()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("المفضلة", "Favorites")}</h1>
        <p className="text-muted-foreground">
          {t("الكتب التي أضفتها إلى قائمة المفضلة", "Books you added to favorites")}
        </p>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("لا توجد عناصر في المفضلة", "No favorites found")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("تصفح الكتب وأضف ما يعجبك إلى المفضلة", "Browse books and add what you like")}
            </p>
            <Button asChild>
              <Link href="/browse">{t("تصفح الكتب", "Browse Books")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => {
            const availability = listing.availability || "available"
            const showPromo = isPromoDiscountActive(listing)
            const promoPct = discountPercentLabel(listing)
            return (
              <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <Link href={`/book/${listing.id}`}>
                  <div className="relative aspect-[4/3] bg-muted">
                    {listing.images?.[0] ? (
                      <Image
                        src={`/api/file?pathname=${encodeURIComponent(listing.images[0])}`}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Badge
                      className={`absolute top-2 right-2 ${availabilityColors[availability]}`}
                    >
                      {availabilityLabels[availability]}
                    </Badge>
                    {showPromo && promoPct != null && (
                      <Badge
                        variant="outline"
                        className="absolute bottom-2 right-2 border-destructive/40 text-destructive bg-background/90 text-xs"
                      >
                        −{promoPct}%
                      </Badge>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link href={`/book/${listing.id}`}>
                    <h3 className="font-medium line-clamp-1 mb-1 hover:text-primary">
                      {listing.title}
                    </h3>
                  </Link>
                  {listing.course && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {listing.course.name}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 gap-2">
                    <span className="flex flex-wrap items-baseline gap-2">
                      {showPromo &&
                        listing.original_price != null &&
                        Number(listing.original_price) > Number(listing.price) && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatJod(listing.original_price)} د.أ
                          </span>
                        )}
                      <span className="text-lg font-bold text-primary">{formatJod(listing.price)} د.أ</span>
                    </span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {listing.views_count}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/book/${listing.id}`}>{t("عرض", "View")}</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault()
                        handleRemoveFavorite(listing.id)
                      }}
                      disabled={removingId === listing.id}
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>
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
