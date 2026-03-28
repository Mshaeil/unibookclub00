"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { 
  Search, 
  Filter, 
  BookOpen, 
  Eye, 
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useLanguage, useTranslate } from "@/components/language-provider"
import { discountPercentLabel, isPromoDiscountActive } from "@/lib/utils/listing-discount"
import { formatJod } from "@/lib/utils"
import { staggerStyle } from "@/lib/motion"

type Listing = {
  id: string
  title: string
  price: number
  original_price?: number | null
  discount_expires_at?: string | null
  condition: string
  item_type: string
  availability: "available" | "reserved" | "sold"
  negotiable: boolean
  images: string[]
  views_count: number
  created_at: string
  author: string | null
  seller: {
    full_name: string | null
  } | null
  course: {
    code: string
    name_ar: string
    name_en?: string
    name?: string
    major: {
      name_ar: string
      faculty: {
        name_ar: string
      } | null
    } | null
  } | null
}

type Faculty = { id: string; name_ar?: string; name_en?: string; name?: string }
type Major = { id: string; faculty_id: string; name_ar?: string; name_en?: string; name?: string }
type Course = {
  id: string
  major_id: string
  code?: string
  name_ar?: string
  name_en?: string
  name?: string
}

/** Jordanian Dinar — same symbol in both languages */
const CURRENCY_JOD = "د.أ"

function pickLocalizedName(
  lang: "ar" | "en",
  row: { name_ar?: string | null; name_en?: string | null; name?: string | null },
) {
  if (lang === "en") {
    return row.name_en ?? row.name ?? row.name_ar ?? "-"
  }
  return row.name_ar ?? row.name ?? row.name_en ?? "-"
}

const ALL_VALUE = "__all__"

type Filters = {
  search: string
  faculty: string
  major: string
  course: string
  itemType: string
  condition: string
  minPrice?: number
  maxPrice?: number
  sort: string
}

type Props = {
  listings: Listing[]
  topSellers: { seller_id: string; full_name: string; sold_count: number }[]
  totalCount: number
  currentPage: number
  perPage: number
  faculties: Faculty[]
  majors: Major[]
  courses: Course[]
  filters: Filters
}

const conditionColors: Record<string, string> = {
  new: "bg-green-100 text-green-800",
  like_new: "bg-blue-100 text-blue-800",
  good: "bg-yellow-100 text-yellow-800",
  acceptable: "bg-gray-100 text-gray-800",
}

const availabilityColors: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800",
  reserved: "bg-amber-100 text-amber-800",
  sold: "bg-red-100 text-red-800",
}

export function BrowseContent({ 
  listings, 
  topSellers,
  totalCount, 
  currentPage, 
  perPage,
  faculties,
  majors,
  courses,
  filters 
}: Props) {
  const { language } = useLanguage()
  const t = useTranslate()
  const router = useRouter()
  const searchParams = useSearchParams()

  const conditionLabels = useMemo(
    () => ({
      new: t("جديد", "New"),
      like_new: t("شبه جديد", "Like new"),
      good: t("جيد", "Good"),
      acceptable: t("مقبول", "Acceptable"),
    }),
    [t],
  )

  const itemTypeLabels = useMemo(
    () => ({
      original: t("كتاب أصلي", "Original book"),
      notes: t("ملزمة", "Notes"),
      reference: t("مرجع", "Reference"),
      summary: t("ملخص", "Summary"),
    }),
    [t],
  )

  const availabilityLabels = useMemo(
    () => ({
      available: t("متاح", "Available"),
      reserved: t("محجوز", "Reserved"),
      sold: t("مباع", "Sold"),
    }),
    [t],
  )

  const [search, setSearch] = useState(filters.search)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const totalPages = Math.ceil(totalCount / perPage)

  const filteredMajors = majors.filter(m => m.faculty_id === filters.faculty)
  const filteredCourses = courses.filter(c => c.major_id === filters.major)

  const toFilterValue = (v: string | undefined) => (v === ALL_VALUE || !v ? "" : v)
  const fromFilterValue = (v: string) => (v ? v : ALL_VALUE)

  const updateFilters = useCallback((updates: Partial<Filters> & { page?: string | number }) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key === "page") {
        if (value !== undefined && value !== "" && value !== null) {
          params.set("page", String(value))
        } else {
          params.delete("page")
        }
        return
      }
      const strVal = typeof value === "string" ? toFilterValue(value) : value
      if (strVal !== undefined && strVal !== "" && strVal !== null) {
        params.set(key, String(strVal))
      } else {
        params.delete(key)
      }
    })
    
    if (!updates.hasOwnProperty("page")) {
      params.delete("page")
    }
    
    router.push(`/browse?${params.toString()}`)
  }, [router, searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search })
  }

  const clearFilters = () => {
    router.push("/browse")
    setSearch("")
  }

  const hasFilters = Boolean(filters.search || filters.faculty || filters.major || 
    filters.course || filters.itemType || filters.condition || filters.minPrice || filters.maxPrice)

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Faculty */}
      <div className="space-y-2">
        <Label>{t("الكلية", "Faculty")}</Label>
        <Select
          value={fromFilterValue(filters.faculty)}
          onValueChange={(v) => updateFilters({ faculty: toFilterValue(v), major: "", course: "" })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("جميع الكليات", "All faculties")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{t("جميع الكليات", "All faculties")}</SelectItem>
            {faculties.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {pickLocalizedName(language, f)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Major */}
      <div className="space-y-2">
        <Label>{t("التخصص", "Major")}</Label>
        <Select
          value={fromFilterValue(filters.major)}
          onValueChange={(v) => updateFilters({ major: toFilterValue(v), course: "" })}
          disabled={!filters.faculty}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("جميع التخصصات", "All majors")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{t("جميع التخصصات", "All majors")}</SelectItem>
            {filteredMajors.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {pickLocalizedName(language, m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Course */}
      <div className="space-y-2">
        <Label>{t("المادة", "Course")}</Label>
        <Select
          value={fromFilterValue(filters.course)}
          onValueChange={(v) => updateFilters({ course: toFilterValue(v) })}
          disabled={!filters.major}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("جميع المواد", "All courses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{t("جميع المواد", "All courses")}</SelectItem>
            {filteredCourses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.code ? `${c.code} - ` : ""}
                {pickLocalizedName(language, c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <Label>{t("الحالة", "Condition")}</Label>
        <Select
          value={fromFilterValue(filters.condition)}
          onValueChange={(v) => updateFilters({ condition: toFilterValue(v) })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("جميع الحالات", "All conditions")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{t("جميع الحالات", "All conditions")}</SelectItem>
            <SelectItem value="new">{conditionLabels.new}</SelectItem>
            <SelectItem value="like_new">{conditionLabels.like_new}</SelectItem>
            <SelectItem value="good">{conditionLabels.good}</SelectItem>
            <SelectItem value="acceptable">{conditionLabels.acceptable}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Item Type */}
      <div className="space-y-2">
        <Label>{t("نوع العنصر", "Item type")}</Label>
        <Select
          value={fromFilterValue(filters.itemType)}
          onValueChange={(v) => updateFilters({ itemType: toFilterValue(v) })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("جميع الأنواع", "All types")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{t("جميع الأنواع", "All types")}</SelectItem>
            <SelectItem value="original">{itemTypeLabels.original}</SelectItem>
            <SelectItem value="notes">{itemTypeLabels.notes}</SelectItem>
            <SelectItem value="reference">{itemTypeLabels.reference}</SelectItem>
            <SelectItem value="summary">{itemTypeLabels.summary}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label>{t("نطاق السعر (د.أ)", "Price range (د.أ)")}</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={t("من", "Min")}
            value={filters.minPrice || ""}
            onChange={(e) => updateFilters({ minPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
            min="0"
          />
          <Input
            type="number"
            placeholder={t("إلى", "Max")}
            value={filters.maxPrice || ""}
            onChange={(e) => updateFilters({ maxPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
            min="0"
          />
        </div>
      </div>

      {hasFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="ml-2 h-4 w-4" />
          {t("مسح الفلاتر", "Clear Filters")}
        </Button>
      )}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {t("تصفح الكتب والملخصات", "Browse books & summaries")}
        </h1>
        <p className="text-muted-foreground">
          {totalCount > 0
            ? `${totalCount} ${t("عرض لكتب وملخصات معتمدة", "approved books & summaries")}`
            : t("ابحث عن الكتب والملخصات لمادتك", "Find books and summaries for your course")}
        </p>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("ابحث عن كتاب أو مؤلف...", "Search by title or author...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button type="submit">{t("بحث", "Search")}</Button>
        </form>

        <div className="flex flex-1 gap-2 min-w-0 sm:flex-initial">
          <Select value={filters.sort} onValueChange={(v) => updateFilters({ sort: v })}>
            <SelectTrigger className="min-w-0 flex-1 sm:w-[160px] sm:flex-initial">
              <SelectValue placeholder={t("الترتيب", "Sort")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">{t("الأحدث", "Latest")}</SelectItem>
              <SelectItem value="price_low">{t("السعر: الأقل", "Price: Low to High")}</SelectItem>
              <SelectItem value="price_high">{t("السعر: الأعلى", "Price: High to Low")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Filters */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>{t("الفلاتر", "Filters")}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h2 className="font-semibold mb-4">{t("الفلاتر", "Filters")}</h2>
                <FilterContent />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h2 className="font-semibold mb-3">{t("أبرز البائعين", "Top Sellers")}</h2>
                {topSellers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("لا يوجد بيانات مبيعات كافية حالياً", "Not enough sales data yet")}</p>
                ) : (
                  <div className="space-y-2">
                    {topSellers.map((seller, index) => (
                      <div key={seller.seller_id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                        <span className="truncate">
                          {index + 1}. {seller.full_name || t("مستخدم", "User")}
                        </span>
                        <Badge variant="outline">{seller.sold_count} {t("مبيع", "sales")}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {listings.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t("لا توجد نتائج", "No results")}</h3>
                <p className="text-muted-foreground mb-4">
                  {hasFilters
                    ? t(
                        "حاول تغيير الفلاتر أو البحث بكلمات مختلفة",
                        "Try changing filters or different search words",
                      )
                    : t("لا توجد كتب أو ملخصات مطابقة", "No matching books or summaries")}
                </p>
                {hasFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    {t("مسح الفلاتر", "Clear Filters")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {listings.map((listing, index) => {
                  const availability = listing.availability || "available"
                  const showPromo = isPromoDiscountActive(listing)
                  const promoPct = discountPercentLabel(listing)
                  return (
                  <Link
                    key={listing.id}
                    href={`/book/${listing.id}`}
                    className="group block touch-manipulation ubc-reveal-item ubc-content-auto"
                    style={staggerStyle(index)}
                  >
                    <Card className="ubc-market-card h-full overflow-hidden border-border/60 shadow-sm hover:shadow-xl">
                      <div className="ubc-market-card-media relative aspect-[4/3] bg-muted">
                        {listing.images?.[0] ? (
                          <Image
                            src={`/api/file?pathname=${encodeURIComponent(listing.images[0])}`}
                            alt={listing.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Badge
                          className={`absolute top-2 right-2 ${conditionColors[listing.condition]}`}
                        >
                          {conditionLabels[listing.condition as keyof typeof conditionLabels] ??
                            listing.condition}
                        </Badge>
                        <Badge
                          className={`absolute top-2 left-2 ${availabilityColors[availability]}`}
                        >
                          {availabilityLabels[availability as keyof typeof availabilityLabels] ??
                            availability}
                        </Badge>
                        {showPromo && promoPct != null && (
                          <Badge
                            variant="outline"
                            className="absolute bottom-2 right-2 border-destructive/40 text-destructive bg-background/90 backdrop-blur-sm text-xs"
                          >
                            −{promoPct}%
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium line-clamp-1 mb-1">{listing.title}</h3>
                        {listing.course && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {listing.course.code ? `${listing.course.code} - ` : ""}{language === "ar" ? (listing.course.name_ar ?? listing.course.name ?? "-") : (listing.course.name_en ?? listing.course.name ?? listing.course.name_ar ?? "-")}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex flex-wrap items-baseline gap-2">
                            {showPromo &&
                              listing.original_price != null &&
                              Number(listing.original_price) > Number(listing.price) && (
                                <span className="text-sm text-muted-foreground line-through">
                                  {formatJod(listing.original_price)} {CURRENCY_JOD}
                                </span>
                              )}
                            <span className="text-lg font-bold text-primary">
                              {formatJod(listing.price)} {CURRENCY_JOD}
                            </span>
                          </div>
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {listing.views_count}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {itemTypeLabels[listing.item_type as keyof typeof itemTypeLabels] ??
                              itemTypeLabels.original}
                          </span>
                          {listing.negotiable && <span>{t("قابل للتفاوض", "Negotiable")}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage <= 1}
                    onClick={() => updateFilters({ page: String(currentPage - 1) } as Partial<Filters>)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    {t("صفحة", "Page")} {currentPage} {t("من", "of")} {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage >= totalPages}
                    onClick={() => updateFilters({ page: String(currentPage + 1) } as Partial<Filters>)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
