"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ReportReason } from "@/lib/types/database"
import { useLanguage, useTranslate } from "@/components/language-provider"
import { discountPercentLabel, isPromoDiscountActive } from "@/lib/utils/listing-discount"
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Flag,
  GraduationCap,
  Heart,
  MessageCircle,
  MessagesSquare,
  Share2,
  Star,
  Tag,
  Truck,
  User,
} from "lucide-react"

type ListingDetails = {
  id: string
  title: string
  description: string | null
  author: string | null
  edition: string | null
  price: number
  original_price?: number | null
  discount_expires_at?: string | null
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
  original_price?: number | null
  discount_expires_at?: string | null
  condition: "new" | "like_new" | "good" | "acceptable"
  availability: "available" | "reserved" | "sold"
  images: string[]
  course: {
    code?: string
    name_ar?: string
    name?: string
  } | null
}

const conditionColors = {
  new: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  like_new: "bg-green-500/10 text-green-600 border-green-500/20",
  good: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  acceptable: "bg-amber-500/10 text-amber-600 border-amber-500/20"
}

const statusColors = {
  available: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  reserved: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  sold: "bg-red-500/10 text-red-600 border-red-500/20"
}

interface BookDetailsProps {
  listing: ListingDetails
  relatedListings: RelatedListing[]
  viewer?: {
    userId: string | null
    isSeller: boolean
    canRateSeller: boolean
  }
}

export function BookDetails({ listing, relatedListings, viewer }: BookDetailsProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const t = useTranslate()
  const supabase = useMemo(() => createClient(), [])
  const [currentImage, setCurrentImage] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason>("other")
  const [reportDetails, setReportDetails] = useState("")
  const [ratingValue, setRatingValue] = useState(5)
  const [ratingComment, setRatingComment] = useState("")
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [openingChat, setOpeningChat] = useState(false)
  const availability = listing.availability || "available"
  const showPromoDiscount = isPromoDiscountActive(listing)
  const promoPct = discountPercentLabel(listing)

  const conditionLabels = useMemo(
    () => ({
      new: t("جديد", "New"),
      like_new: t("شبه جديد", "Like new"),
      good: t("جيد", "Good"),
      acceptable: t("مقبول", "Acceptable"),
    }),
    [t],
  )
  const bookTypeLabels = useMemo(
    () => ({
      original: t("كتاب أصلي", "Original book"),
      notes: t("ملزمة", "Notes"),
      reference: t("مرجع", "Reference"),
      summary: t("ملخص", "Summary"),
    }),
    [t],
  )
  const statusLabels = useMemo(
    () => ({
      available: t("متاح", "Available"),
      reserved: t("محجوز", "Reserved"),
      sold: t("مباع", "Sold"),
    }),
    [t],
  )
  const reportReasonLabels = useMemo(
    () => ({
      inappropriate: t("محتوى غير لائق", "Inappropriate content"),
      spam: t("إعلان مزعج", "Spam"),
      fake: t("إعلان وهمي", "Fake listing"),
      offensive: t("محتوى مسيء", "Offensive content"),
      other: t("سبب آخر", "Other"),
    }),
    [t],
  )

  const listingDescription = useMemo(() => {
    const empty = t("لا يوجد وصف إضافي", "No additional description")
    return (
      (listing.description || empty)
        .replace(/\s*\[PDF_FILE\][\s\S]*?\[\/PDF_FILE\]\s*/, "")
        .trim() || empty
    )
  }, [listing.description, t])

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
      window.alert(t("يرجى تسجيل الدخول أولاً", "Please sign in first"))
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
      window.alert(t("يرجى تسجيل الدخول أولاً", "Please sign in first"))
      return
    }

    setReporting(true)

    // Reports require reporter_id to exist in profiles.
    // Read-only check avoids touching profiles and triggering RLS on writes.
    const { data: profileRow, error: profileReadError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle()

    if (profileReadError) {
      setReporting(false)
      window.alert(
        `${t("تعذر التحقق من الحساب:", "Could not verify account:")} ${profileReadError.message}`,
      )
      return
    }
    if (!profileRow) {
      setReporting(false)
      window.alert(
        t(
          "لا يمكن إرسال البلاغ حالياً لأن ملفك الشخصي غير مكتمل. حدّث بيانات الحساب أولاً.",
          "You cannot submit a report until your profile is complete. Update your account first.",
        ),
      )
      return
    }

    const { data: insertedReport, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        listing_id: listing.id,
        reason: reportReason,
        details: reportDetails.trim() || null,
      })
      .select("id")
      .single()
    let inserted = insertedReport
    let insertError = error

    if (insertError?.code === "42703" || /reporter_id/i.test(insertError?.message || "")) {
      const fallbackInsert = await supabase
        .from("reports")
        .insert({
          user_id: user.id,
          listing_id: listing.id,
          reason: reportReason,
          details: reportDetails.trim() || null,
        })
        .select("id")
        .single()
      inserted = fallbackInsert.data
      insertError = fallbackInsert.error
    }
    setReporting(false)

    if (insertError || !inserted) {
      window.alert(
        `${t("فشل إرسال التبليغ:", "Failed to submit report:")} ${insertError?.message || t("تعذر حفظ البلاغ", "Could not save report")}`,
      )
      return
    }

    setReportDialogOpen(false)
    setReportReason("other")
    setReportDetails("")
    router.refresh()
    window.alert(t("تم إرسال التبليغ بنجاح", "Report submitted successfully"))
  }

  async function handleRateSeller() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.alert(t("يرجى تسجيل الدخول أولاً", "Please sign in first"))
      return
    }
    if (!listing.seller?.id || user.id === listing.seller.id) {
      window.alert(t("لا يمكن تقييم نفسك", "You cannot rate yourself"))
      return
    }

    setRatingSubmitting(true)
    const { error } = await supabase.from("seller_reviews").insert({
      seller_id: listing.seller.id,
      reviewer_id: user.id,
      listing_id: listing.id,
      rating: ratingValue,
      comment: ratingComment.trim() || null,
    })
    setRatingSubmitting(false)
    if (error) {
      window.alert(
        `${t("فشل حفظ التقييم:", "Failed to save rating:")} ${error.message}`,
      )
      return
    }

    window.alert(t("تم إرسال تقييم البائع بنجاح", "Seller rating submitted"))
    setRatingComment("")
    setRatingValue(5)
  }

  const waDigits = (
    listing.whatsapp ||
    listing.seller?.whatsapp ||
    listing.seller?.phone ||
    ""
  ).replace(/\D/g, "")
  const canWhatsApp = waDigits.length >= 10

  async function openDirectChat() {
    setOpeningChat(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setOpeningChat(false)
      setContactDialogOpen(false)
      const next = encodeURIComponent(`/dashboard/messages?listing=${listing.id}`)
      router.push(`/login?redirect=${next}`)
      return
    }
    if (user.id === listing.seller?.id) {
      setOpeningChat(false)
      window.alert(t("لا يمكن مراسلة نفسك", "You cannot message yourself"))
      return
    }
    const { error: rpcErr } = await supabase.rpc("get_or_create_conversation", {
      p_listing_id: listing.id,
    })
    setOpeningChat(false)
    setContactDialogOpen(false)
    if (rpcErr) {
      if (/does not exist|PGRST202|42883/i.test(rpcErr.message)) {
        window.alert(
          t(
            "المحادثات غير مفعّلة بعد على الخادم. أبلغ الإدارة لتشغيل سكربت قاعدة البيانات.",
            "Messaging is not enabled on the server yet. Ask the admin to run the database script.",
          ),
        )
      } else {
        window.alert(rpcErr.message)
      }
      return
    }
    router.push(`/dashboard/messages?listing=${listing.id}`)
  }

  async function handleShare() {
    const shareUrl = typeof window !== "undefined" ? window.location.href : ""
    const shareTitle = listing.title
    const shareText = `${t("شاهد إعلان الكتاب:", "Check out this book listing:")} ${listing.title}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        return
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        window.alert(t("تم نسخ رابط الإعلان", "Listing link copied"))
        return
      }

      window.alert(
        t("المشاركة غير مدعومة في هذا المتصفح", "Sharing is not supported in this browser"),
      )
    } catch (err) {
      // User canceled share sheet is not an error we should surface.
      if (err instanceof DOMException && err.name === "AbortError") {
        return
      }
      window.alert(t("تعذر مشاركة الرابط", "Could not share the link"))
    }
  }

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary transition-colors">
            {t("الرئيسية", "Home")}
          </Link>
          <ChevronLeft className="w-4 h-4" />
          <Link href="/browse" className="hover:text-primary transition-colors">
            {t("الكتب", "Books")}
          </Link>
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
                <DialogHeader>
                  <DialogTitle className="sr-only">
                    {t("عرض صورة الكتاب", "View book image")}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    {t("صورة مكبرة للكتاب الحالي", "Enlarged image of the current book")}
                  </DialogDescription>
                </DialogHeader>
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
                    {t("قابل للتفاوض", "Negotiable")}
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
                    {listing.course
                      ? [
                          listing.course.code,
                          language === "en"
                            ? (listing.course.name ?? listing.course.name_ar)
                            : (listing.course.name_ar ?? listing.course.name),
                        ]
                          .filter(Boolean)
                          .join(" - ")
                      : null}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>
                    {[
                      language === "en"
                        ? (listing.course?.major?.faculty?.name ??
                          listing.course?.major?.faculty?.name_ar)
                        : (listing.course?.major?.faculty?.name_ar ??
                          listing.course?.major?.faculty?.name),
                      language === "en"
                        ? (listing.course?.major?.name ?? listing.course?.major?.name_ar)
                        : (listing.course?.major?.name_ar ?? listing.course?.major?.name),
                    ]
                      .filter(Boolean)
                      .join(" - ")}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-baseline gap-3">
                  {showPromoDiscount &&
                    listing.original_price != null &&
                    Number(listing.original_price) > Number(listing.price) && (
                      <span className="text-2xl text-muted-foreground line-through decoration-destructive/60">
                        {listing.original_price} د.أ
                      </span>
                    )}
                  <span className="text-4xl font-bold text-primary">{listing.price}</span>
                  <span className="text-lg text-muted-foreground">د.أ</span>
                  {showPromoDiscount &&
                    listing.original_price != null &&
                    Number(listing.original_price) > Number(listing.price) && (
                      <Badge variant="outline" className="text-destructive border-destructive/30">
                        {promoPct != null
                          ? t(`خصم ${promoPct}%`, `${promoPct}% off`)
                          : t("خصم", "Discount")}
                      </Badge>
                    )}
                </div>
                {showPromoDiscount && listing.discount_expires_at && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {t("عرض الخصم ساري حتى", "Promo price until")}{" "}
                    {new Date(listing.discount_expires_at).toLocaleString(
                      language === "en" ? "en-US" : "ar-JO",
                      { dateStyle: "short", timeStyle: "short" },
                    )}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">{t("الوصف", "Description")}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {listingDescription}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <span className="text-xs text-muted-foreground">{t("المؤلف", "Author")}</span>
                <p className="font-medium text-foreground">{listing.author || "-"}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <span className="text-xs text-muted-foreground">{t("الطبعة", "Edition")}</span>
                <p className="font-medium text-foreground">{listing.edition || "-"}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <span className="text-xs text-muted-foreground">{t("التخصص", "Major")}</span>
                <p className="font-medium text-foreground">
                  {language === "en"
                    ? (listing.course?.major?.name ?? listing.course?.major?.name_ar ?? "-")
                    : (listing.course?.major?.name_ar ?? listing.course?.major?.name ?? "-")}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <span className="text-xs text-muted-foreground">{t("المادة", "Course")}</span>
                <p className="font-medium text-foreground">
                  {language === "en"
                    ? (listing.course?.name ?? listing.course?.name_ar ?? "-")
                    : (listing.course?.name_ar ?? listing.course?.name ?? "-")}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <span className="text-xs text-muted-foreground">
                  {t("رقم واتساب", "WhatsApp")}
                </span>
                <p className="font-medium text-foreground">{listing.whatsapp || listing.seller?.whatsapp || "-"}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 space-y-1">
                <span className="text-xs text-muted-foreground">{t("الحالة", "Status")}</span>
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
                        <span className="font-semibold text-foreground">
                          {listing.seller?.full_name || t("مستخدم", "User")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>
                          {listing.seller?.phone ||
                            t("لا يوجد رقم هاتف", "No phone number")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {availability === "sold" && viewer?.canRateSeller && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">
                    {t("تقييم البائع بعد إتمام العملية", "Rate the seller after the sale")}
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="rating-stars">{t("عدد النجوم", "Stars")}</Label>
                    <Select value={String(ratingValue)} onValueChange={(v) => setRatingValue(Number(v))}>
                      <SelectTrigger id="rating-stars">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">{t("5 نجوم", "5 stars")}</SelectItem>
                        <SelectItem value="4">{t("4 نجوم", "4 stars")}</SelectItem>
                        <SelectItem value="3">{t("3 نجوم", "3 stars")}</SelectItem>
                        <SelectItem value="2">{t("2 نجوم", "2 stars")}</SelectItem>
                        <SelectItem value="1">{t("1 نجمة", "1 star")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating-comment">
                      {t("تقييمك (اختياري)", "Your review (optional)")}
                    </Label>
                    <Textarea
                      id="rating-comment"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder={t("شارك تجربتك مع البائع...", "Share your experience with the seller...")}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleRateSeller} disabled={ratingSubmitting} className="gap-2">
                    <Star className="h-4 w-4" />
                    {ratingSubmitting
                      ? t("جاري الإرسال...", "Sending...")
                      : t("إرسال التقييم", "Submit rating")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {availability === "available" && viewer?.isSeller && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold">{t("إتمام البيع", "Complete the sale")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        "بعد أن تتفق مع المشتري وتستلم المبلغ، سجّل بياناته من",
                        "After you agree with the buyer and receive payment, record their details from",
                      )}{" "}
                      <Link href="/dashboard" className="font-medium text-primary underline">
                        {t("لوحة التحكم → إعلاناتي", "Dashboard → My listings")}
                      </Link>{" "}
                      {t(
                        "عبر زر «تم البيع» بجانب الإعلان. المشتري يظهر له الطلب في «مشترياته» ويمكنه تقييمك.",
                        'using the "Mark as sold" button next to the listing. The buyer will see the order in "My purchases" and can rate you.',
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}
              <div className="flex gap-3">
                <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                  <Button
                    type="button"
                    size="lg"
                    className="flex-1 gap-2 transition-all duration-300 hover:shadow-md active:scale-[0.98]"
                    disabled={availability !== "available"}
                    onClick={() => availability === "available" && setContactDialogOpen(true)}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {availability === "available"
                      ? t("تواصل مع البائع", "Contact seller")
                      : statusLabels[availability]}
                  </Button>
                  <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>{t("تواصل مع البائع", "Contact seller")}</DialogTitle>
                      <DialogDescription>
                        {t(
                          "اختر طريقة التواصل. المحادثة داخل المنصة تُنقل عبر HTTPS وتُخزَّن مشفّرة على الخادم.",
                          "Choose how to reach the seller. In-app chat uses HTTPS and encrypted storage on the server.",
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 py-2">
                      {canWhatsApp ? (
                        <Button className="w-full gap-2 h-12" asChild>
                          <a
                            href={`https://wa.me/${waDigits}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setContactDialogOpen(false)}
                          >
                            <MessageCircle className="w-5 h-5" />
                            {t("واتساب", "WhatsApp")}
                          </a>
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center">
                          {t("لا يتوفر رقم واتساب لهذا الإعلان.", "No WhatsApp number for this listing.")}
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full gap-2 h-12"
                        onClick={() => void openDirectChat()}
                        disabled={openingChat || viewer?.isSeller}
                      >
                        {openingChat ? (
                          <span className="text-sm">{t("جاري الفتح…", "Opening…")}</span>
                        ) : (
                          <>
                            <MessagesSquare className="w-5 h-5" />
                            {t("محادثة مباشرة في المنصة", "In-app chat")}
                          </>
                        )}
                      </Button>
                      {viewer?.isSeller && (
                        <p className="text-xs text-muted-foreground text-center">
                          {t("أنت بائع هذا الإعلان.", "You are the seller of this listing.")}
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  disabled={availability !== "available"}
                  onClick={handleFavorite}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
                  {isWishlisted
                    ? t("تمت الإضافة", "Saved")
                    : t("أضف للمفضلة", "Add to favorites")}
                </Button>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                  {t("مشاركة", "Share")}
                </Button>
                <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-muted-foreground"
                    >
                      <Flag className="w-4 h-4" />
                      {t("تبليغ", "Report")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>{t("تبليغ عن الإعلان", "Report listing")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="report-reason">{t("سبب التبليغ", "Reason")}</Label>
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
                        <Label htmlFor="report-details">
                          {t("تفاصيل إضافية (اختياري)", "Additional details (optional)")}
                        </Label>
                        <Textarea
                          id="report-details"
                          placeholder={t(
                            "اكتب تفاصيل إضافية إن وجدت...",
                            "Add more details if needed...",
                          )}
                          value={reportDetails}
                          onChange={(e) => setReportDetails(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                          {t("إلغاء", "Cancel")}
                        </Button>
                        <Button onClick={handleReportSubmit} disabled={reporting}>
                          {reporting
                            ? t("جاري الإرسال...", "Sending...")
                            : t("إرسال التبليغ", "Submit report")}
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
                  <span>
                    {listing.views_count}{" "}
                    {t(
                      "مشاهدة",
                      listing.views_count === 1 ? "view" : "views",
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {t("آخر تحديث:", "Last updated:")}{" "}
                    {new Date(listing.updated_at).toLocaleDateString(
                      language === "en" ? "en-US" : "ar-JO",
                    )}
                  </span>
                </div>
              </div>
              <span>
                {t("رقم الإعلان:", "Listing ID:")} #{listing.id.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">
            {t("إعلانات مشابهة", "Similar listings")}
          </h2>
          {relatedListings.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                {t("لا توجد إعلانات مشابهة حالياً", "No similar listings yet")}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedListings.map((related) => {
                const relPct = discountPercentLabel(related)
                return (
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
                      {related.course
                        ? [
                            related.course.code,
                            language === "en"
                              ? (related.course.name ?? related.course.name_ar)
                              : (related.course.name_ar ?? related.course.name),
                          ]
                            .filter(Boolean)
                            .join(" - ") || "-"
                        : "-"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-baseline gap-2">
                      {isPromoDiscountActive(related) &&
                        related.original_price != null &&
                        Number(related.original_price) > Number(related.price) && (
                          <span className="text-sm text-muted-foreground line-through">
                            {related.original_price} د.أ
                          </span>
                        )}
                      <p className="text-primary font-semibold">
                        {related.price} د.أ
                      </p>
                      {isPromoDiscountActive(related) && relPct != null && (
                        <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                          −{relPct}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
