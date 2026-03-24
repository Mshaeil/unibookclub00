"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { reportReasonLabels, type ReportReason } from "@/lib/types/database"
import { 
  ArrowRight,
  BookOpen, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Flag,
  GraduationCap,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Tag,
  Truck,
  User
} from "lucide-react"

type ListingDetails = {
  id: string
  title: string
  description: string | null
  author: string | null
  edition: string | null
  price: number
  condition: "new" | "like_new" | "good" | "acceptable"
  item_type: "original" | "notes" | "reference" | "summary"
  negotiable: boolean
  availability: "available" | "reserved" | "sold"
  whatsapp: string | null
  images: string[]
  views_count: number
  updated_at: string
  seller: {
    id: string
    full_name: string | null
    phone: string | null
    whatsapp: string | null
  } | null
  course: {
    id: string
    code?: string
    name_ar?: string
    name?: string
    major: {
      id: string
      name_ar?: string
      name?: string
      faculty: {
        id: string
        name_ar?: string
        name?: string
      } | null
    } | null
  } | null
}

type RelatedListing = {
  id: string
  title: string
  price: number
  condition: "new" | "like_new" | "good" | "acceptable"
  availability: "available" | "reserved" | "sold"
  images: string[]
  course: {
    code?: string
    name_ar?: string
    name?: string
  } | null
}

const conditionLabels = {
  new: "جديد",
  like_new: "شبه جديد",
  good: "جيد",
  acceptable: "مقبول"
}

const conditionColors = {
  new: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  like_new: "bg-green-500/10 text-green-600 border-green-500/20",
  good: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  acceptable: "bg-amber-500/10 text-amber-600 border-amber-500/20"
}

const bookTypeLabels = {
  original: "كتاب أصلي",
  notes: "ملزمة",
  reference: "مرجع",
  summary: "ملخص"
}

const statusLabels = {
  available: "متاح",
  reserved: "محجوز",
  sold: "تم البيع"
}

const statusColors = {
  available: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  reserved: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  sold: "bg-red-500/10 text-red-600 border-red-500/20"
}

interface BookDetailsProps {
  listing: ListingDetails
  relatedListings: RelatedListing[]
}

export function BookDetails({ listing, relatedListings }: BookDetailsProps) {
  const supabase = useMemo(() => createClient(), [])
  const [currentImage, setCurrentImage] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason>("other")
  const [reportDetails, setReportDetails] = useState("")
  const availability = listing.availability || "available"

  useEffect(() => {
    async function checkFavoriteState() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listing.id)
        .maybeSingle()

      setIsWishlisted(Boolean(data))
    }

    checkFavoriteState()
  }, [listing.id, supabase])

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % listing.images.length)
  }

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + listing.images.length) % listing.images.length)
  }

  async function handleFavorite() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.alert("يرجى تسجيل الدخول أولاً")
      return
    }

    if (isWishlisted) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listing.id)
      setIsWishlisted(false)
      return
    }

    await supabase
      .from("favorites")
      .insert({ user_id: user.id, listing_id: listing.id })
    setIsWishlisted(true)
  }

  async function handleReportSubmit() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.alert("يرجى تسجيل الدخول أولاً")
      return
    }

    setReporting(true)
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      listing_id: listing.id,
      reason: reportReason,
      details: reportDetails.trim() || null,
    })
    setReporting(false)

    if (error) {
      window.alert("فشل إرسال التبليغ")
      return
    }

    setReportDialogOpen(false)
    setReportReason("other")
    setReportDetails("")
    window.alert("تم إرسال التبليغ بنجاح")
  }

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
          <ChevronLeft className="w-4 h-4" />
          <Link href="/browse" className="hover:text-primary transition-colors">الكتب</Link>
          <ChevronLeft className="w-4 h-4" />
          <span className="text-foreground truncate max-w-[200px]">{listing.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image Gallery */}
          <div className="space-y-4">
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted cursor-zoom-in group">
                  {listing.images[currentImage] ? (
                    <Image
                      src={`/api/file?pathname=${encodeURIComponent(listing.images[currentImage])}`}
                      alt={listing.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Navigation Arrows */}
                  {listing.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {/* Status Badge */}
                  <Badge 
                    variant="outline" 
                    className={`absolute top-4 right-4 ${statusColors[availability]}`}
                  >
                    {statusLabels[availability]}
                  </Badge>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <div className="relative aspect-[4/3]">
                  {listing.images[currentImage] ? (
                    <Image
                      src={`/api/file?pathname=${encodeURIComponent(listing.images[currentImage])}`}
                      alt={listing.title}
                      fill
                      className="object-contain"
                    />
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>

            {/* Thumbnails */}
            {listing.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {listing.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 ${
                      currentImage === idx ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={`/api/file?pathname=${encodeURIComponent(img)}`} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={conditionColors[listing.condition]}>
                  {conditionLabels[listing.condition]}
                </Badge>
                <Badge variant="secondary">
                  {bookTypeLabels[listing.item_type]}
                </Badge>
                {listing.negotiable && (
                  <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20">
                    <Tag className="w-3 h-3 ml-1" />
                    قابل للتفاوض
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">
                {listing.title}
              </h1>

              {/* Course & Faculty */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">
                    {listing.course ? [listing.course.code, listing.course.name_ar ?? listing.course.name].filter(Boolean).join(" - ") : null}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>
                    {[listing.course?.major?.faculty?.name_ar ?? listing.course?.major?.faculty?.name, listing.course?.major?.name_ar ?? listing.course?.major?.name].filter(Boolean).join(" - ")}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">{listing.price}</span>
                <span className="text-lg text-muted-foreground">د.أ</span>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">الوصف</h3>
              <p className="text-muted-foreground leading-relaxed">
                {listing.description || "لا يوجد وصف إضافي"}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <span className="text-xs text-muted-foreground">المؤلف</span>
                <p className="font-medium text-foreground">{listing.author || "-"}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <span className="text-xs text-muted-foreground">الطبعة</span>
                <p className="font-medium text-foreground">{listing.edition || "-"}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <span className="text-xs text-muted-foreground">التخصص</span>
                <p className="font-medium text-foreground">{listing.course?.major?.name_ar ?? listing.course?.major?.name ?? "-"}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <span className="text-xs text-muted-foreground">المادة</span>
                <p className="font-medium text-foreground">{listing.course?.name_ar ?? listing.course?.name ?? "-"}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <span className="text-xs text-muted-foreground">رقم واتساب</span>
                <p className="font-medium text-foreground">{listing.whatsapp || listing.seller?.whatsapp || "-"}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <span className="text-xs text-muted-foreground">الحالة</span>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  <p className="font-medium text-foreground">{statusLabels[availability]}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Seller Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{listing.seller?.full_name || "مستخدم"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{listing.seller?.phone || "لا يوجد رقم هاتف"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  disabled={availability !== "available" || !(listing.whatsapp || listing.seller?.whatsapp || listing.seller?.phone)}
                  asChild
                >
                  <a
                    href={`https://wa.me/${(listing.whatsapp || listing.seller?.whatsapp || listing.seller?.phone || "").replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {availability === "available" ? "تواصل مع البائع" : statusLabels[availability]}
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  disabled={availability !== "available"}
                  onClick={handleFavorite}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
                  {isWishlisted ? "تمت الإضافة" : "أضف للمفضلة"}
                </Button>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Share2 className="w-4 h-4" />
                  مشاركة
                </Button>
                <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-muted-foreground"
                    >
                      <Flag className="w-4 h-4" />
                      تبليغ
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>تبليغ عن الإعلان</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="report-reason">سبب التبليغ</Label>
                        <Select value={reportReason} onValueChange={(v) => setReportReason(v as ReportReason)}>
                          <SelectTrigger id="report-reason">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(reportReasonLabels) as ReportReason[]).map((r) => (
                              <SelectItem key={r} value={r}>
                                {reportReasonLabels[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="report-details">تفاصيل إضافية (اختياري)</Label>
                        <Textarea
                          id="report-details"
                          placeholder="اكتب تفاصيل إضافية إن وجدت..."
                          value={reportDetails}
                          onChange={(e) => setReportDetails(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                          إلغاء
                        </Button>
                        <Button onClick={handleReportSubmit} disabled={reporting}>
                          {reporting ? "جاري الإرسال..." : "إرسال التبليغ"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{listing.views_count} مشاهدة</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>آخر تحديث: {new Date(listing.updated_at).toLocaleDateString("ar-JO")}</span>
                </div>
              </div>
              <span>رقم الإعلان: #{listing.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">إعلانات مشابهة</h2>
          {relatedListings.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                لا توجد إعلانات مشابهة حالياً
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedListings.map((related) => (
                <Link key={related.id} href={`/book/${related.id}`} className="rounded-lg border bg-card overflow-hidden hover:shadow-sm transition-shadow">
                  <div className="relative aspect-[4/3] bg-muted">
                    {related.images?.[0] ? (
                      <Image
                        src={`/api/file?pathname=${encodeURIComponent(related.images[0])}`}
                        alt={related.title}
                        fill
                        className="object-cover"
                      />
                    ) : null}
                    <Badge className={`absolute top-2 right-2 ${statusColors[related.availability]}`}>
                      {statusLabels[related.availability]}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <p className="font-medium line-clamp-1">{related.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {related.course ? [related.course.code, related.course.name_ar ?? related.course.name].filter(Boolean).join(" - ") || "-" : "-"}
                    </p>
                    <p className="text-primary font-semibold mt-2">{related.price} د.أ</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
