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
  Trash2
} from "lucide-react"
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
  condition: string
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

  const [formData, setFormData] = useState({
    title: listing.title,
    description: listing.description || "",
    price: listing.price.toString(),
    condition: listing.condition,
    facultyId: initialFacultyId,
    majorId: initialMajorId,
    courseId: listing.course_id || "",
    whatsapp: listing.whatsapp || "",
    author: listing.author || "",
    edition: listing.edition || "",
  })

  const [existingImages, setExistingImages] = useState<string[]>(listing.images || [])
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([])
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
      if (!formData.price || parseFloat(formData.price) <= 0) throw new Error("يرجى إدخال سعر صحيح")
      if (!formData.whatsapp.trim()) throw new Error("يرجى إدخال رقم واتساب")
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

      // Update listing
      const { error: updateError } = await supabase
        .from("listings")
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          condition: formData.condition,
          faculty_id: formData.facultyId || null,
          major_id: formData.majorId || null,
          course_id: formData.courseId || null,
          whatsapp: formData.whatsapp.trim() || null,
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
    } catch (err) {
      setError("فشل حذف الإعلان")
      setDeleting(false)
    }
  }

  async function handleMarkAsSold() {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: "sold" })
        .eq("id", listing.id)

      if (error) throw error

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError("فشل تحديث الحالة")
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">تم تحديث الإعلان بنجاح!</h2>
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

      {/* Images */}
      <Card>
        <CardContent className="pt-6">
          <Label className="text-base font-medium mb-4 block">صور الكتاب *</Label>
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
              <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">إضافة صورة</span>
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
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">السعر (د.أ) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.5"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">رقم واتساب *</Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="07XXXXXXXX"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
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
                  <SelectItem key={m.id} value={m.id}>{m.name_ar}</SelectItem>
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

        {listing.status === "approved" && (
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleMarkAsSold}
            disabled={loading || deleting}
          >
            تم البيع
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" disabled={loading || deleting}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف الإعلان؟</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.
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
