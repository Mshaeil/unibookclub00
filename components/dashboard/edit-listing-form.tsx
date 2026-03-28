"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  Loader2, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle,
  Trash2,
  FileText,
  MessageSquare,
} from "lucide-react"
import { isValidTenDigitPhone, sanitizePhoneDigits } from "@/lib/utils/phone"
import {
  closestListingDiscountPercent,
  discountEndsAtFromNow,
  LISTING_DISCOUNT_PCT_VALUES,
  LISTING_DISCOUNT_RECOMMENDED_PCTS,
  priceAfterPercentDiscount,
} from "@/lib/utils/listing-discount"
import { formatJod } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Listing = {
  id: string
  title: string
  description: string | null
  price: number
  original_price?: number | null
  discount_expires_at?: string | null
  condition: string
  item_type: string
  course_id: string | null
  whatsapp: string | null
  author: string | null
  edition: string | null
  images: string[]
  status: string
}

type Faculty = { id: string; name: string }
type Major = { id: string; faculty_id: string; name: string }
type Course = { id: string; major_id: string; name: string }

type Props = {
  listing: Listing
  faculties: Faculty[]
  majors: Major[]
  courses: Course[]
  initialFacultyId: string
  initialMajorId: string
}

const conditions = [
  { value: "new", label: "جديد", description: "لم يُستخدم من قبل" },
  { value: "like_new", label: "كالجديد", description: "استخدام خفيف جداً" },
  { value: "good", label: "جيد", description: "بعض علامات الاستخدام" },
  { value: "acceptable", label: "مقبول", description: "علامات استخدام واضحة" },
]

export function EditListingForm({ 
  listing, 
  faculties, 
  majors, 
  courses,
  initialFacultyId,
  initialMajorId 
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const initialOriginal =
    listing.original_price != null && Number(listing.original_price) > Number(listing.price)
      ? Number(listing.original_price)
      : null
  const initialBase = initialOriginal ?? listing.price
  const initialPct =
    initialOriginal != null
      ? closestListingDiscountPercent(initialOriginal, listing.price)
      : 0
  const [listBasePrice, setListBasePrice] = useState(String(initialBase))
  const [discountPct, setDiscountPct] = useState(initialPct)
  const [renewDiscount24h, setRenewDiscount24h] = useState(false)
  const [formData, setFormData] = useState({
    title: listing.title,
    description: (listing.description || "").replace(/\s*\[PDF_FILE\][\s\S]*?\[\/PDF_FILE\]\s*/, "").trim(),
    condition: listing.condition,
    itemType: (listing.item_type || "original") as "original" | "notes" | "reference" | "summary",
    facultyId: initialFacultyId,
    majorId: initialMajorId,
    courseId: listing.course_id || "",
    whatsapp: sanitizePhoneDigits(listing.whatsapp || "", 10),
    author: listing.author || "",
    edition: listing.edition || "",
  })

  const [existingImages, setExistingImages] = useState<string[]>(listing.images || [])
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([])
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [existingPdfPath, setExistingPdfPath] = useState<string | null>(
    listing.description?.match(/\[PDF_FILE\](.*?)\[\/PDF_FILE\]/)?.[1] || null
  )
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const filteredMajors = majors.filter(m => m.faculty_id === formData.facultyId)
  const filteredCourses = courses.filter(c => c.major_id === formData.majorId)

  const totalImages = existingImages.length + newImages.length

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (totalImages + files.length > 5) {
      setError("الحد الأقصى 5 صور")
      return
    }

    const newImgs = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))

    setNewImages(prev => [...prev, ...newImgs])
    setError(null)
  }, [totalImages])

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeNewImage = (index: number) => {
    setNewImages(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!formData.title.trim()) throw new Error("يرجى إدخال عنوان الكتاب")
      const base = parseFloat(listBasePrice.replace(",", "."))
      if (!Number.isFinite(base) || base <= 0) throw new Error("يرجى إدخال السعر الأصلي بشكل صحيح")
      const finalPrice = priceAfterPercentDiscount(base, discountPct)
      if (!Number.isFinite(finalPrice) || finalPrice < 0) {
        throw new Error("تعذر احتساب السعر بعد الخصم")
      }
      const originalPriceNum = discountPct > 0 ? base : null
      const waDigits = sanitizePhoneDigits(formData.whatsapp, 10)
      if (!isValidTenDigitPhone(waDigits)) {
        throw new Error("رقم التواصل غير صالح")
      }
      if (totalImages === 0) throw new Error("يرجى إضافة صورة واحدة على الأقل")

      // Upload new images
      const uploadedPaths: string[] = [...existingImages]

      for (const img of newImages) {
        const fd = new FormData()
        fd.append("file", img.file)

        const res = await fetch("/api/upload", { method: "POST", body: fd })
        if (!res.ok) throw new Error("فشل رفع الصورة")
        
        const data = await res.json()
        uploadedPaths.push(data.pathname)
      }

      let finalPdfPath = existingPdfPath
      if (attachmentFile) {
        const fd = new FormData()
        fd.append("file", attachmentFile)
        const pdfRes = await fetch("/api/upload", { method: "POST", body: fd })
        if (!pdfRes.ok) throw new Error("فشل رفع المرفق")
        const pdfData = await pdfRes.json()
        finalPdfPath = pdfData.pathname || null
      }

      const cleanDescription = (formData.description || "").replace(
        /\s*\[PDF_FILE\][\s\S]*?\[\/PDF_FILE\]\s*/,
        "",
      ).trim()

      let discountExpiresAt: string | null = null
      if (discountPct > 0 && originalPriceNum != null) {
        if (renewDiscount24h) {
          discountExpiresAt = discountEndsAtFromNow()
        } else if (initialOriginal == null) {
          discountExpiresAt = discountEndsAtFromNow()
        } else {
          discountExpiresAt = listing.discount_expires_at ?? discountEndsAtFromNow()
        }
      }

      // Update listing
      const { error: updateError } = await supabase
        .from("listings")
        .update({
          title: formData.title.trim(),
          description:
            (cleanDescription || "") +
              (finalPdfPath ? `\n\n[PDF_FILE]${finalPdfPath}[/PDF_FILE]` : "") ||
            null,
          price: finalPrice,
          original_price: originalPriceNum,
          discount_expires_at: discountExpiresAt,
          item_type: formData.itemType,
          condition: formData.condition,
          faculty_id: formData.facultyId || null,
          major_id: formData.majorId || null,
          course_id: formData.courseId || null,
          whatsapp: waDigits,
          author: formData.author.trim() || null,
          edition: formData.edition.trim() || null,
          images: uploadedPaths,
          status: listing.status === "rejected" ? "pending_review" : listing.status,
        })
        .eq("id", listing.id)

      if (updateError) throw new Error(updateError.message)

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
      setLoading(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listing.id)

      if (error) throw error

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("فشل حذف العرض")
      setDeleting(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">تم تحديث عرضك بنجاح!</h2>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Images + PDF + text hint */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label className="text-base font-medium">صور الكتاب أو الملخص *</Label>
            <p className="text-xs text-muted-foreground mt-1">
              صور مطلوبة. مرفق اختياري (PDF، Word، عرض، ZIP…) — ليس شرطاً للنشر.
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {existingImages.map((path, index) => (
              <div key={`existing-${index}`} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                <Image
                  src={`/api/file?pathname=${encodeURIComponent(path)}`}
                  alt={`صورة ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
                {index === 0 && newImages.length === 0 && (
                  <span className="absolute bottom-1 right-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                    رئيسية
                  </span>
                )}
              </div>
            ))}
            {newImages.map((img, index) => (
              <div key={`new-${index}`} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                <Image
                  src={img.preview}
                  alt={`صورة جديدة ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {totalImages < 5 && (
              <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors text-center px-1">
                <Upload className="h-6 w-6 text-muted-foreground mb-1 shrink-0" />
                <span className="text-xs text-muted-foreground leading-tight">صور</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            )}
            <div className="relative aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/25 transition-all duration-300 hover:border-primary hover:bg-muted/50">
              <label className="flex h-full w-full flex-col items-center justify-center cursor-pointer text-center px-1 py-2">
                <FileText className="h-6 w-6 text-muted-foreground mb-1 shrink-0" />
                <span className="text-xs text-muted-foreground leading-tight">مرفق</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,text/plain"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              {existingPdfPath && !attachmentFile && (
                <a
                  href={`/api/file?pathname=${encodeURIComponent(existingPdfPath)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-7 left-1 right-1 text-[10px] text-primary underline line-clamp-2"
                >
                  ملف محفوظ
                </a>
              )}
              {(existingPdfPath || attachmentFile) && (
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentFile(null)
                    setExistingPdfPath(null)
                  }}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                  aria-label="إزالة المرفق"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              {attachmentFile && (
                <p className="absolute bottom-8 left-1 right-1 text-[10px] text-foreground line-clamp-2 px-0.5">
                  {attachmentFile.name}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => document.getElementById("description")?.focus()}
              className="aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors text-center px-1"
            >
              <MessageSquare className="h-6 w-6 text-muted-foreground mb-1 shrink-0" />
              <span className="text-xs text-muted-foreground leading-tight">وصف نصي</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Book Info */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان الكتاب *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">المؤلف</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edition">الطبعة</Label>
              <Input
                id="edition"
                value={formData.edition}
                onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">الوصف النصي</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>نوع العنصر *</Label>
            <Select
              value={formData.itemType}
              onValueChange={(v) =>
                setFormData({
                  ...formData,
                  itemType: v as "original" | "notes" | "reference" | "summary",
                })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">كتاب أصلي</SelectItem>
                <SelectItem value="notes">ملزمة</SelectItem>
                <SelectItem value="reference">مرجع</SelectItem>
                <SelectItem value="summary">ملخص</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-list-base-price">السعر الأصلي (د.أ) *</Label>
            <Input
              id="edit-list-base-price"
              type="number"
              min="0"
              step="0.5"
              inputMode="decimal"
              value={listBasePrice}
              onChange={(e) => setListBasePrice(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>الخصم</Label>
            <Select
              value={String(discountPct)}
              onValueChange={(v) => setDiscountPct(Number(v))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {LISTING_DISCOUNT_PCT_VALUES.map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {p === 0
                      ? "بدون خصم"
                      : LISTING_DISCOUNT_RECOMMENDED_PCTS.has(p)
                        ? `${p}% (يُنصح به)`
                        : `${p}%`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {listBasePrice && Number(listBasePrice.replace(",", ".")) > 0 && (
              <p className="text-sm text-muted-foreground">
                السعر بعد الخصم:{" "}
                <span className="font-semibold text-primary">
                  {formatJod(
                    priceAfterPercentDiscount(
                      Number(listBasePrice.replace(",", ".")),
                      discountPct,
                    ),
                  )}{" "}
                  د.أ
                </span>
              </p>
            )}
          </div>

          {discountPct > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-border/80 bg-muted/40 p-3">
              <Checkbox
                id="edit-renew-discount"
                checked={renewDiscount24h}
                onCheckedChange={(c) => setRenewDiscount24h(c === true)}
                disabled={loading}
              />
              <Label htmlFor="edit-renew-discount" className="text-sm font-normal cursor-pointer leading-snug">
                تجديد عرض الخصم لمدة <strong>24 ساعة</strong> من الآن
              </Label>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="whatsapp">رقم التواصل *</Label>
            <Input
              id="whatsapp"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel-national"
              value={formData.whatsapp}
              onChange={(e) =>
                setFormData({ ...formData, whatsapp: sanitizePhoneDigits(e.target.value, 10) })
              }
              disabled={loading}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Condition */}
      <Card>
        <CardContent className="pt-6">
          <Label className="text-base font-medium mb-4 block">حالة الكتاب *</Label>
          <RadioGroup
            value={formData.condition}
            onValueChange={(v) => setFormData({ ...formData, condition: v })}
            className="grid grid-cols-2 gap-3"
          >
            {conditions.map((c) => (
              <label
                key={c.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  formData.condition === c.value 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={c.value} className="mt-0.5" />
                <div>
                  <p className="font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Course */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Label className="text-base font-medium block">ربط بمادة</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              value={formData.facultyId}
              onValueChange={(v) => setFormData({ ...formData, facultyId: v, majorId: "", courseId: "" })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="الكلية" />
              </SelectTrigger>
              <SelectContent>
                {faculties.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={formData.majorId}
              onValueChange={(v) => setFormData({ ...formData, majorId: v, courseId: "" })}
              disabled={loading || !formData.facultyId}
            >
              <SelectTrigger>
                <SelectValue placeholder="التخصص" />
              </SelectTrigger>
              <SelectContent>
                {filteredMajors.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={formData.courseId}
              onValueChange={(v) => setFormData({ ...formData, courseId: v })}
              disabled={loading || !formData.majorId}
            >
              <SelectTrigger>
                <SelectValue placeholder="المادة" />
              </SelectTrigger>
              <SelectContent>
                {filteredCourses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading || deleting} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            "حفظ التغييرات"
          )}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" disabled={loading || deleting}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف هذا العرض؟</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف عرض الكتاب أو الملخص؟ لا يمكن التراجع.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "حذف"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </form>
  )
}
