"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ChevronLeft } from "lucide-react"

type Listing = {
  id: string
  title: string
  price: number
  condition: string
  availability: string
  images: string[]
  course?: { code?: string; name_ar?: string; name?: string } | null
}

const conditionLabels: Record<string, string> = {
  new: "جديد",
  like_new: "كالجديد",
  good: "جيد",
  acceptable: "مقبول",
}

const availabilityLabels: Record<string, string> = {
  available: "متاح",
  reserved: "محجوز",
  sold: "مباع",
}

type Props = {
  listings: Listing[]
}

export function BooksSection({ listings }: Props) {
  const displayListings = listings.slice(0, 8)
  const availableCount = listings.filter((l) => (l.availability || "available") === "available").length

  return (
    <section id="books" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {availableCount} كتاب متاح
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
            اعثر على كتابك
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
            تصفح الكتب المتاحة حسب الكلية والتخصص والمادة
          </p>
        </div>

        {displayListings.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayListings.map((listing) => {
                const availability = listing.availability || "available"
                return (
                  <Link key={listing.id} href={`/book/${listing.id}`}>
                    <Card className="h-full hover:shadow-md transition-shadow overflow-hidden">
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
                        <Badge className="absolute top-2 right-2">
                          {conditionLabels[listing.condition] ?? listing.condition}
                        </Badge>
                        <Badge variant="secondary" className="absolute top-2 left-2">
                          {availabilityLabels[availability]}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium line-clamp-1 mb-1">{listing.title}</h3>
                        {listing.course && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {listing.course.name_ar ?? listing.course.name ?? "-"}
                          </p>
                        )}
                        <p className="text-lg font-bold text-primary mt-2">{listing.price} د.أ</p>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>

            <div className="text-center mt-12">
              <Button variant="outline" size="lg" asChild className="gap-2">
                <Link href="/browse">
                  تصفح كل الكتب
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-muted/30 rounded-2xl border border-border/50">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              لا توجد كتب متاحة حالياً
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              تصفح الصفحة لاحقاً أو أضف كتبك للبيع
            </p>
            <Button asChild>
              <Link href="/browse">تصفح الكتب</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
