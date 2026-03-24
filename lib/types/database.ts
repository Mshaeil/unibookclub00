// Database types for UniBookClub

export type ListingStatus = 'pending_review' | 'approved' | 'rejected' | 'sold'
export type BookCondition = 'new' | 'like_new' | 'good' | 'acceptable'
export type ListingAvailability = 'available' | 'reserved' | 'sold'
export type ListingItemType = 'original' | 'notes' | 'reference' | 'summary'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'
export type ReportReason = 'inappropriate' | 'spam' | 'fake' | 'offensive' | 'other'
export type UserRole = 'user' | 'admin'

export interface Faculty {
  id: string
  name_ar: string
  name_en: string | null
  icon: string | null
  created_at: string
  updated_at: string
}

export interface Major {
  id: string
  faculty_id: string
  name_ar: string
  name_en: string | null
  created_at: string
  updated_at: string
  faculty?: Faculty
}

export interface Course {
  id: string
  major_id: string
  code: string | null
  name_ar: string
  name_en: string | null
  created_at: string
  updated_at: string
  major?: Major
}

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  whatsapp: string | null
  faculty_id: string | null
  major_id: string | null
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
  faculty?: Faculty
  major?: Major
}

export interface Listing {
  id: string
  seller_id: string
  title: string
  description: string | null
  author: string | null
  edition: string | null
  price: number
  condition: BookCondition
  item_type: ListingItemType
  negotiable: boolean
  availability: ListingAvailability
  course_id: string | null
  faculty_id: string | null
  major_id: string | null
  whatsapp: string | null
  images: string[]
  status: ListingStatus
  rejection_reason: string | null
  views_count: number
  created_at: string
  updated_at: string
  seller?: Profile
  course?: Course
  faculty?: Faculty
  major?: Major
}

export interface Favorite {
  id: string
  user_id: string
  listing_id: string
  created_at: string
  listing?: Listing
}

export interface Report {
  id: string
  reporter_id: string
  listing_id: string
  reason: ReportReason
  details: string | null
  status: ReportStatus
  admin_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  reporter?: Profile
  listing?: Listing
  resolver?: Profile
}

// Condition labels in Arabic
export const conditionLabels: Record<BookCondition, string> = {
  new: 'جديد',
  like_new: 'شبه جديد',
  good: 'جيد',
  acceptable: 'مقبول',
}

// Status labels in Arabic
export const statusLabels: Record<ListingStatus, string> = {
  pending_review: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  sold: 'مباع',
}

// Report reason labels in Arabic
export const reportReasonLabels: Record<ReportReason, string> = {
  inappropriate: 'محتوى غير لائق',
  spam: 'إعلان مزعج',
  fake: 'إعلان وهمي',
  offensive: 'محتوى مسيء',
  other: 'سبب آخر',
}

// Report status labels in Arabic
export const reportStatusLabels: Record<ReportStatus, string> = {
  pending: 'قيد المراجعة',
  reviewed: 'تمت المراجعة',
  resolved: 'تم الحل',
  dismissed: 'تم الرفض',
}
