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
  FileText,
  MessageSquare,
} from "lucide-react"
import { isValidTenDigitPhone, sanitizePhoneDigits } from "@/lib/utils/phone"
import {
  discountEndsAtFromNow,
  LISTING_DISCOUNT_PCT_VALUES,
  LISTING_DISCOUNT_RECOMMENDED_PCTS,
  priceAfterPercentDiscount,
} from "@/lib/utils/listing-discount"

type Faculty = { id: string; name: string }
type Major = { id: string; faculty_id: string; name: string }
type Course = { id: string; major_id: string; name: string }

type Props = {
  faculties: Faculty[]
  majors: Major[]
  courses: Course[]
}

const conditions = [
  { value: "new", label: "جديد", description: "لم يُستخدم من قبل" },
  { value: "like_new", label: "كالجديد", description: "استخدام خفيف جداً" },
  { value: "good", label: "جيد", description: "بعض علامات الاستخدام" },
  { value: "acceptable", label: "مقبول", description: "علامات استخدام واضحة" },
]

export function NewListingForm({ faculties, majors, courses }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [listBasePrice, setListBasePrice] = useState("")
  const [discountPct, setDiscountPct] = useState(0)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    condition: "good",
    itemType: "original" as "original" | "notes" | "reference" | "summary",
    facultyId: "",
    majorId: "",
    courseId: "",
    whatsapp: "",
    author: "",
    edition: "",
  })

  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Filter majors by faculty
  const filteredMajors = majors.filter(m => m.faculty_id === formData.facultyId)
  // Filter courses by major
  const filteredCourses = courses.filter(c => c.major_id === formData.majorId)

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 5) {
      setError("الحد الأقصى 5 صور")
      return
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))

    setImages(prev => [...prev, ...newImages])
    setError(null)
  }, [images.length])

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate
      if (!formData.title.trim()) throw new Error("يرجى إدخال عنوان العرض (كتاب أو ملخص)")
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
      if (images.length === 0) throw new Error("يرجى إضافة صورة واحدة على الأقل")

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("يرجى تسجيل الدخول")

      // Upload images (to Supabase Storage via /api/upload)
      setUploading(true)
      const uploadedPaths: string[] = []

      for (const img of images) {
        const fd = new FormData()
        fd.append("file", img.file)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        })

        if (!res.ok) throw new Error("فشل رفع الصورة")
        
        const data = await res.json()
        uploadedPaths.push(data.pathname)
      }

      setUploading(false)

      let pdfPath: string | null = null
      if (attachmentFile) {
        const fd = new FormData()
        fd.append("file", attachmentFile)
        const pdfRes = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        })
        if (!pdfRes.ok) throw new Error("فشل رفع المرفق")
        const pdfData = await pdfRes.json()
        pdfPath = pdfData.pathname || null
      }

      // Create listing
      const { error: insertError } = await supabase
        .from("listings")
        .insert({
          seller_id: user.id,
          title: formData.title.trim(),
          description:
            (formData.description.trim() || "") +
              (pdfPath ? `\n\n[PDF_FILE]${pdfPath}[/PDF_FILE]` : "") ||
            null,
          price: finalPrice,
          original_price: originalPriceNum,
          discount_expires_at: discountPct > 0 ? discountEndsAtFromNow() : null,
          item_type: formData.itemType,
          condition: formData.condition,
          faculty_id: formData.facultyId || null,
          major_id: formData.majorId || null,
          course_id: formData.courseId || null,
          whatsapp: waDigits,
          author: formData.author.trim() || null,
          edition: formData.edition.trim() || null,
          images: uploadedPaths,
          status: "pending_review",
        })

      if (insertError) throw new Error(insertError.message)

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
      setLoading(false)
      setUploading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">تم إرسال عرضك بنجاح!</h2>
          <p className="text-muted-foreground">
            سنراجع كتابك أو ملخصك وننشره بعد الاعتماد قريباً
          </p>
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

      {/* Images + PDF + text hint (same tile style) */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label className="text-base font-medium">صور الكتاب أو الملخص *</Label>
            <p className="text-xs text-muted-foreground mt-1">
              صورة واحدة على الأقل مطلوبة. مرفق اختياري (PDF وغيره) للمشتري بعد البيع — ليس شرطاً للنشر.
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {images.map((img, index) => (
              <div key={index} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                <Image
                  src={img.preview}
                  alt={`صورة ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-1 right-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                    رئيسية
                  </span>
                )}
              </div>
            ))}
            {images.length < 5 && (
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
              {attachmentFile && (
                <>
                  <p className="absolute bottom-8 left-1 right-1 text-[10px] text-foreground line-clamp-2 px-0.5">
                    {attachmentFile.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAttachmentFile(null)}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                    aria-label="إزالة المرفق"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => document.getElementById("description")?.focus()}
              className="aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-all duration-300 text-center px-1"
            >
              <MessageSquare className="h-6 w-6 text-muted-foreground mb-1 shrink-0" />
              <span className="text-xs text-muted-foreground leading-tight">وصف نصي</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            حتى 5 صور؛ الصورة الأولى رئيسية. المرفق اختياري. «وصف نصي» ينقلك لحقل الوصف أدناه.
          </p>
        </CardContent>
      </Card>

      {/* Book Info */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان العرض (كتاب / ملخص) *</Label>
            <Input
              id="title"
              placeholder="مثال: مبادئ الحاسوب — ملخص الفصل الأوّل"
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
                placeholder="اسم المؤلف"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edition">الطبعة</Label>
              <Input
                id="edition"
                placeholder="مثال: الطبعة الثالثة"
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
              placeholder="حالة الغلاف، عدد الصفحات، ما يغطيه الملخص، أي ملاحظات للمشتري…"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>نوع المحتوى *</Label>
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
            <Label htmlFor="list-base-price">السعر الأصلي (د.أ) *</Label>
            <Input
              id="list-base-price"
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
                  {priceAfterPercentDiscount(
                    Number(listBasePrice.replace(",", ".")),
                    discountPct,
                  )}{" "}
                  د.أ
                </span>
                {discountPct > 0 && (
                  <span className="text-xs block mt-1">
                    يظهر عرض الخصم للمشترين 24 ساعة (يمكن التمديد من تعديل العرض أو لوحة التحكم).
                  </span>
                )}
              </p>
            )}
          </div>

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
          <Label className="text-base font-medium mb-4 block">حالة النسخة (كتاب أو مطبوع) *</Label>
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
          <Label className="text-base font-medium mb-2 block">ربط بمادة (اختياري)</Label>
          <p className="text-sm text-muted-foreground mb-4">
            ربط عرضك بمادة يجعل الكتب والملخصات تظهر لزملائك في نفس التخصص
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>الكلية</Label>
              <Select
                value={formData.facultyId}
                onValueChange={(v) => setFormData({ ...formData, facultyId: v, majorId: "", courseId: "" })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الكلية" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>التخصص</Label>
              <Select
                value={formData.majorId}
                onValueChange={(v) => setFormData({ ...formData, majorId: v, courseId: "" })}
                disabled={loading || !formData.facultyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التخصص" />
                </SelectTrigger>
                <SelectContent>
                  {filteredMajors.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المادة</Label>
              <Select
                value={formData.courseId}
                onValueChange={(v) => setFormData({ ...formData, courseId: v })}
                disabled={loading || !formData.majorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المادة" />
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
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="flex-1"
        >
          إلغاء
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              {uploading ? "جاري رفع الصور..." : "جاري إرسال العرض..."}
            </>
          ) : (
            "نشر العرض"
          )}
        </Button>
      </div>
    </form>
  )
}
