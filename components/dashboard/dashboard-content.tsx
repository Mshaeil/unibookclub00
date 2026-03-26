"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plus,
  BookOpen,
  Eye,
  Heart,
  Clock,
  CheckCircle,
  XCircle,
  ShoppingBag,
  MessageSquare,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Percent,
  AlertTriangle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { useLanguage, useTranslate } from "@/components/language-provider"
import { isValidTenDigitPhone, sanitizePhoneDigits } from "@/lib/utils/phone"
import {
  discountEndsAtFromNow,
  discountPercentLabel,
  isDiscountWindowExpired,
  isPositiveListingDiscountPercent,
  isPromoDiscountActive,
  LISTING_DISCOUNT_PCT_VALUES,
  LISTING_DISCOUNT_RECOMMENDED_PCTS,
} from "@/lib/utils/listing-discount"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Listing = {
  id: string
  title: string
  price: number
  original_price?: number | null
  discount_expires_at?: string | null
  condition: string
  status: string
  availability?: string
  rejection_reason?: string | null
  images: string[]
  views_count: number
  created_at: string
  course: {
    name_ar?: string
    name_en?: string
    name?: string
  } | null
}

type DashboardContentProps = {
  profile: {
    full_name: string | null
    role: string
  } | null
  listings: Listing[]
  showStats?: boolean
  stats: {
    totalListings: number
    activeListings: number
    pendingListings: number
    soldListings: number
    totalViews: number
    totalFavorites: number
  }
}

export function DashboardContent({ profile, listings, stats, showStats = true }: DashboardContentProps) {
  const { language } = useLanguage()
  const t = useTranslate()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [saleTarget, setSaleTarget] = useState<Listing | null>(null)
  const [buyerName, setBuyerName] = useState("")
  const [buyerPhone, setBuyerPhone] = useState("")
  const [buyerAccount, setBuyerAccount] = useState("")
  const [saleSubmitting, setSaleSubmitting] = useState(false)
  const [saleError, setSaleError] = useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkPercent, setBulkPercent] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const conditionLabels: Record<string, string> = {
    new: t("جديد", "New"),
    like_new: t("كالجديد", "Like new"),
    good: t("جيد", "Good"),
    acceptable: t("مقبول", "Acceptable"),
  }
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle }> = {
    pending_review: { label: t("قيد المراجعة", "Pending review"), variant: "secondary", icon: Clock },
    approved: { label: t("نشط", "Active"), variant: "default", icon: CheckCircle },
    rejected: { label: t("مرفوض", "Rejected"), variant: "destructive", icon: XCircle },
    sold: { label: t("مباع", "Sold"), variant: "outline", icon: ShoppingBag },
  }

  async function handleDeleteListing(listingId: string) {
    const ok = window.confirm("هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.")
    if (!ok) return

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId)

    if (error) {
      console.error("Failed to delete listing:", error)
      return
    }

    router.refresh()
  }

  function openSaleDialog(listing: Listing) {
    setSaleTarget(listing)
    setBuyerName("")
    setBuyerPhone("")
    setBuyerAccount("")
    setSaleError(null)
  }

  async function submitRecordedSale() {
    if (!saleTarget) return
    if (!buyerName.trim() || !buyerPhone.trim()) {
      setSaleError(
        t("يرجى إدخال اسم المشتري ورقم التواصل", "Please enter buyer name and contact number"),
      )
      return
    }

    const phoneDigits = sanitizePhoneDigits(buyerPhone, 10)
    if (!isValidTenDigitPhone(phoneDigits)) {
      setSaleError(t("رقم التواصل غير صالح", "Invalid contact number"))
      return
    }

    setSaleSubmitting(true)
    setSaleError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaleSubmitting(false)
      setSaleError(t("يرجى تسجيل الدخول", "Please sign in"))
      return
    }

    const referenceCode = `SALE-${saleTarget.id.replace(/-/g, "").toUpperCase()}`
    const { error: saleErrorInsert } = await supabase.from("sales").insert({
      listing_id: saleTarget.id,
      seller_id: user.id,
      buyer_id: null,
      buyer_name: buyerName.trim(),
      buyer_phone: phoneDigits,
      buyer_email: null,
      buyer_account: buyerAccount.trim() || null,
      reference_code: referenceCode,
    })

    if (saleErrorInsert) {
      setSaleSubmitting(false)
      setSaleError(saleErrorInsert.message)
      return
    }

    const { error: listingError } = await supabase
      .from("listings")
      .update({ status: "sold", availability: "sold" })
      .eq("id", saleTarget.id)
      .eq("seller_id", user.id)

    setSaleSubmitting(false)
    if (listingError) {
      setSaleError(listingError.message)
      return
    }

    setSaleTarget(null)
    window.alert(
      t(`تم تسجيل البيع. مرجع العملية: ${referenceCode}`, `Sale recorded. Reference: ${referenceCode}`),
    )
    router.refresh()
  }

  const dateLocale = language === "ar" ? ar : enUS

  async function applyBulkDiscountToAll() {
    const pct = parseInt(bulkPercent, 10)
    if (!isPositiveListingDiscountPercent(pct)) {
      setBulkError(
        t("اختر نسبة خصم من القائمة (10٪ إلى 50٪)", "Pick a discount from the list (10%–50%)"),
      )
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setBulkError(t("يرجى تسجيل الدخول", "Please sign in"))
      return
    }
    const targets = listings.filter(
      (l) => l.status === "approved" && (l.availability || "available") !== "sold",
    )
    if (targets.length === 0) {
      setBulkError(t("لا توجد إعلانات نشطة لتطبيق الخصم", "No active listings to discount"))
      return
    }
    setBulkLoading(true)
    setBulkError(null)
    try {
      const expires = discountEndsAtFromNow()
      await Promise.all(
        targets.map(async (l) => {
          const base = Number(l.price)
          const newPrice = Math.max(0.01, Math.round(base * (1 - pct / 100) * 100) / 100)
          const { error } = await supabase
            .from("listings")
            .update({
              original_price: base,
              price: newPrice,
              discount_expires_at: expires,
            })
            .eq("id", l.id)
            .eq("seller_id", user.id)
          if (error) throw error
        }),
      )
      setBulkOpen(false)
      setBulkPercent("")
      router.refresh()
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : t("فشل التطبيق", "Apply failed"))
    } finally {
      setBulkLoading(false)
    }
  }

  const hasBulkTargets = listings.some(
    (l) => l.status === "approved" && (l.availability || "available") !== "sold",
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <Dialog open={Boolean(saleTarget)} onOpenChange={(open) => !open && setSaleTarget(null)}>
        <DialogContent className="sm:max-w-md" dir={language === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>
              {t("تسجيل بيع — بيانات المشتري", "Record sale — buyer details")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "أنت البائع: أدخل من اشتري منك بعد إتمام الصفقة. رقم التواصل يجب أن يطابق بيانات المشتري في حسابه ليظهر له الطلب في «مشترياته».",
                "Enter the buyer after the deal. Their contact number must match their profile so the purchase appears in their list.",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {saleError && (
              <p className="text-sm text-destructive">{saleError}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="dash-buyer-name">{t("اسم المشتري", "Buyer name")} *</Label>
              <Input
                id="dash-buyer-name"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder={t("الاسم كما اتفقتما", "Name as agreed")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dash-buyer-phone">{t("رقم التواصل", "Contact number")} *</Label>
              <Input
                id="dash-buyer-phone"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(sanitizePhoneDigits(e.target.value, 10))}
                inputMode="numeric"
                maxLength={10}
                placeholder="0791234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dash-buyer-account">{t("حساب الدفع (اختياري)", "Payment account (optional)")}</Label>
              <Textarea
                id="dash-buyer-account"
                value={buyerAccount}
                onChange={(e) => setBuyerAccount(e.target.value)}
                placeholder={t("رقم حساب بنكي، محفظة، أو أي ملاحظة داخلية لك", "Bank account, wallet, or your internal note")}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setSaleTarget(null)}>
              {t("إلغاء", "Cancel")}
            </Button>
            <Button type="button" onClick={submitRecordedSale} disabled={saleSubmitting}>
              {saleSubmitting ? t("جاري الحفظ...", "Saving...") : t("تأكيد البيع", "Confirm sale")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-md" dir={language === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>
              {t("خصم على جميع إعلاناتك النشطة", "Discount all active listings")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "يُطبَّق على كل إعلان معتمد وغير مباع: السعر الحالي يصبح «قبل الخصم»، والسعر الجديد = السعر الحالي ناقص النسبة التي تدخلها. يظهر عرض الخصم للمشترين لمدة 24 ساعة.",
                "Applies to each approved, unsold listing: current price becomes the “was” price, new price is current minus your percent. Promo shows to buyers for 24 hours.",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="bulk-pct">{t("نسبة الخصم", "Discount")}</Label>
            <Select
              value={bulkPercent === "" ? undefined : bulkPercent}
              onValueChange={(v) => setBulkPercent(v)}
              disabled={bulkLoading}
            >
              <SelectTrigger id="bulk-pct">
                <SelectValue placeholder={t("اختر النسبة", "Select percent")} />
              </SelectTrigger>
              <SelectContent>
                {LISTING_DISCOUNT_PCT_VALUES.filter((p) => p > 0).map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {LISTING_DISCOUNT_RECOMMENDED_PCTS.has(p)
                      ? `${p}% (${t("يُنصح به", "recommended")})`
                      : `${p}%`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {bulkError && <p className="text-sm text-destructive">{bulkError}</p>}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setBulkOpen(false)} disabled={bulkLoading}>
              {t("إلغاء", "Cancel")}
            </Button>
            <Button type="button" onClick={applyBulkDiscountToAll} disabled={bulkLoading}>
              {bulkLoading ? t("جاري التطبيق...", "Applying...") : t("تطبيق", "Apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("مرحباً،", "Welcome,")} {profile?.full_name || t("المستخدم", "User")}
          </h1>
          <p className="text-muted-foreground">{t("إدارة إعلاناتك ومتابعة أداء كتبك", "Manage your listings and track performance")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2 transition-all duration-300 hover:shadow-md">
            <Link href="/dashboard/messages">
              <MessageSquare className="h-4 w-4" />
              {t("الرسائل", "Messages")}
            </Link>
          </Button>
          <Button asChild className="gap-2 transition-all duration-300 hover:shadow-md">
            <Link href="/dashboard/listings/new">
              <Plus className="h-4 w-4" />
              {t("أضف كتاباً جديداً", "Add New Book")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalListings}</p>
                  <p className="text-xs text-muted-foreground">{t("إجمالي الإعلانات", "Total Listings")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeListings}</p>
                  <p className="text-xs text-muted-foreground">{t("إعلانات نشطة", "Active Listings")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingListings}</p>
                  <p className="text-xs text-muted-foreground">{t("قيد المراجعة", "Pending Review")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.soldListings}</p>
                  <p className="text-xs text-muted-foreground">{t("تم بيعها", "Sold")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalViews}</p>
                  <p className="text-xs text-muted-foreground">{t("إجمالي المشاهدات", "Total Views")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalFavorites}</p>
                  <p className="text-xs text-muted-foreground">{t("في المفضلة", "In Favorites")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Listings */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{t("إعلاناتي", "My Listings")}</CardTitle>
            <CardDescription>
              {t("جميع الكتب التي قمت بعرضها للبيع", "All books you listed for sale")}
            </CardDescription>
          </div>
          {hasBulkTargets && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={() => {
                setBulkError(null)
                setBulkOpen(true)
              }}
            >
              <Percent className="h-4 w-4" />
              {t("خصم على جميع كتبي (%)", "Discount all my books (%)")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("لا يوجد إعلانات بعد", "No listings yet")}</h3>
              <p className="text-muted-foreground mb-4">{t("ابدأ ببيع كتبك الجامعية الآن", "Start selling your books now")}</p>
              <Button asChild>
                <Link href="/dashboard/listings/new">
                  <Plus className="ml-2 h-4 w-4" />
                  {t("أضف كتابك الأول", "Add your first book")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => {
                const status = statusConfig[listing.status] || statusConfig.pending_review
                const StatusIcon = status.icon
                const promoActive = isPromoDiscountActive(listing)
                const promoExpired = isDiscountWindowExpired(listing)
                const pct = discountPercentLabel(listing)

                return (
                  <div
                    key={listing.id}
                    className="flex flex-col gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                    {/* Image */}
                    <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {listing.images?.[0] ? (
                        <Image
                          src={`/api/file?pathname=${encodeURIComponent(listing.images[0])}`}
                          alt={listing.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium truncate">{listing.title}</h3>
                          {listing.course && (
                            <p className="text-sm text-muted-foreground">
                              {language === "ar"
                            ? (listing.course.name_ar ?? listing.course.name_en ?? listing.course.name ?? "-")
                            : (listing.course.name_en ?? listing.course.name_ar ?? listing.course.name ?? "-")}
                            </p>
                          )}
                        </div>
                        <Badge variant={status.variant} className="flex-shrink-0 gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                        <span className="flex flex-wrap items-baseline gap-2">
                          {promoActive &&
                            listing.original_price != null &&
                            Number(listing.original_price) > Number(listing.price) && (
                              <span className="line-through text-muted-foreground decoration-destructive/50">
                                {listing.original_price} د.أ
                              </span>
                            )}
                          <span className="font-semibold text-primary">{listing.price} د.أ</span>
                          {promoActive && pct != null && (
                            <Badge variant="outline" className="text-destructive border-destructive/40 text-xs">
                              −{pct}%
                            </Badge>
                          )}
                        </span>
                        <span>{conditionLabels[listing.condition]}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {listing.views_count}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(listing.created_at), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </span>
                      </div>
                      {listing.status === "rejected" && listing.rejection_reason?.trim() && (
                        <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              {t("سبب الرفض", "Rejection reason")}
                            </p>
                            <p className="text-destructive/90 whitespace-pre-wrap">{listing.rejection_reason}</p>
                          </div>
                        </div>
                      )}
                      {listing.discount_expires_at && promoActive && (
                        <p className="text-xs text-muted-foreground">
                          {t("عرض الخصم ينتهي", "Discount promo ends")}{" "}
                          <span className="font-medium text-foreground">
                            {formatDistanceToNow(new Date(listing.discount_expires_at), {
                              addSuffix: true,
                              locale: dateLocale,
                            })}
                          </span>
                        </p>
                      )}
                      {promoExpired && (
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          {t(
                            "انتهت مهلة عرض الخصم للمشترين؛ يظهر السعر الحالي فقط في التصفح. جدّد من تعديل الإعلان (خيار 24 ساعة) أو خصم الجماعي.",
                            "The discount promo window ended for buyers; only the current price shows in browse. Renew from edit (24h option) or bulk discount.",
                          )}
                        </p>
                      )}
                    </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-3 -mx-4 px-4 -mb-1">
                      {listing.status !== "sold" && listing.status === "approved" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => openSaleDialog(listing)}
                        >
                          <ShoppingBag className="h-4 w-4" />
                          {t("تم البيع", "Mark sold")}
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/book/${listing.id}`}>
                              <ExternalLink className="ml-2 h-4 w-4" />
                              {t("عرض الإعلان", "View Listing")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/listings/${listing.id}/edit`}>
                              <Edit className="ml-2 h-4 w-4" />
                              {t("تعديل", "Edit")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteListing(listing.id)}
                          >
                            <Trash2 className="ml-2 h-4 w-4" />
                            {t("حذف", "Delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
