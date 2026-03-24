"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  BookOpen, 
  Eye, 
  Heart, 
  Clock, 
  CheckCircle, 
  XCircle,
  ShoppingBag,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { useLanguage, useTranslate } from "@/components/language-provider"

type Listing = {
  id: string
  title: string
  price: number
  condition: string
  status: string
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

  async function handleMarkAsSold(listingId: string) {
    const ok = window.confirm("تأكيد تحويل الإعلان إلى تم البيع؟")
    if (!ok) return

    const { error } = await supabase
      .from("listings")
      .update({ status: "sold", availability: "sold" })
      .eq("id", listingId)

    if (error) {
      console.error("Failed to mark listing as sold:", error)
      window.alert("تعذر تحديث حالة الإعلان إلى تم البيع")
      return
    }

    router.refresh()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("مرحباً،", "Welcome,")} {profile?.full_name || t("المستخدم", "User")}
          </h1>
          <p className="text-muted-foreground">{t("إدارة إعلاناتك ومتابعة أداء كتبك", "Manage your listings and track performance")}</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/listings/new">
            <Plus className="h-4 w-4" />
            {t("أضف كتاباً جديداً", "Add New Book")}
          </Link>
        </Button>
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
        <CardHeader>
          <CardTitle>{t("إعلاناتي", "My Listings")}</CardTitle>
          <CardDescription>{t("جميع الكتب التي قمت بعرضها للبيع", "All books you listed for sale")}</CardDescription>
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
                
                return (
                  <div 
                    key={listing.id} 
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
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
                              {listing.course.name_ar ?? listing.course.name_en ?? listing.course.name ?? "-"}
                            </p>
                          )}
                        </div>
                        <Badge variant={status.variant} className="flex-shrink-0 gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-primary">{listing.price} {language === "ar" ? "د.أ" : "JOD"}</span>
                        <span>{conditionLabels[listing.condition]}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {listing.views_count}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(listing.created_at), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {listing.status !== "sold" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleMarkAsSold(listing.id)}
                        >
                          <ShoppingBag className="h-4 w-4" />
                          {t("تم البيع", "Mark Sold")}
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
