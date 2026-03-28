"use client"

import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { 
  BookOpen, 
  MapPin, 
  User, 
  MessageCircle,
  GraduationCap,
  Tag,
  Truck,
  Clock
} from "lucide-react"
import { formatJod } from "@/lib/utils"

export interface Book {
  id: number
  title: string
  course: string
  faculty: string
  major: string
  price: number
  originalPrice?: number
  condition: "new" | "like_new" | "good" | "acceptable"
  bookType: "original" | "notes" | "reference" | "summary"
  image: string
  seller: string
  sellerVerified?: boolean
  location: string
  deliveryType: "campus" | "meetup" | "delivery"
  status: "available" | "reserved" | "sold"
  negotiable?: boolean
  hasNotes?: boolean
  updatedAt: string
}

interface BookCardProps {
  book: Book
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

const deliveryLabels = {
  campus: "داخل الجامعة",
  meetup: "استلام يدوي",
  delivery: "توصيل"
}

const deliveryIcons = {
  campus: GraduationCap,
  meetup: MapPin,
  delivery: Truck
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

export function BookCard({ book }: BookCardProps) {
  const DeliveryIcon = deliveryIcons[book.deliveryType]
  const isUnavailable = book.status !== "available"

  return (
    <Card
      className={`ubc-market-card group overflow-hidden border-border/50 transition-shadow duration-300 hover:border-primary/30 hover:shadow-xl ${isUnavailable ? "opacity-75" : ""}`}
    >
      <Link href={`/book/${book.id}`}>
        <div
          className={`ubc-market-card-media relative aspect-[4/3] overflow-hidden bg-muted ${isUnavailable ? "ubc-no-media-zoom" : ""}`}
        >
          <Image
            src={book.image}
            alt={book.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          
          {/* Status Overlay */}
          {isUnavailable && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="outline" className={`text-base px-4 py-1 ${statusColors[book.status]}`}>
                {statusLabels[book.status]}
              </Badge>
            </div>
          )}
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <Badge 
              variant="outline" 
              className={conditionColors[book.condition]}
            >
              {conditionLabels[book.condition]}
            </Badge>
            {book.status === "available" && (
              <Badge variant="outline" className={statusColors[book.status]}>
                {statusLabels[book.status]}
              </Badge>
            )}
          </div>

          {/* Book Type Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-background/90 text-foreground text-xs">
              {bookTypeLabels[book.bookType]}
            </Badge>
          </div>
        </div>
      </Link>

      <CardContent className="p-4 space-y-3">
        {/* Faculty & Major */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <GraduationCap className="w-3.5 h-3.5" />
          <span className="truncate">{book.faculty}</span>
          <span className="text-border">|</span>
          <span className="truncate">{book.major}</span>
        </div>

        {/* Course */}
        <div className="flex items-center gap-2 text-sm text-primary font-medium">
          <BookOpen className="w-4 h-4" />
          <span className="truncate">{book.course}</span>
        </div>

        {/* Title */}
        <Link href={`/book/${book.id}`}>
          <h3 className="font-semibold text-foreground line-clamp-2 text-base leading-tight hover:text-primary transition-colors">
            {book.title}
          </h3>
        </Link>

        {/* Seller & Delivery */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>{book.seller}</span>
            {book.sellerVerified && (
              <svg className="w-3.5 h-3.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <DeliveryIcon className="w-3.5 h-3.5" />
            <span>{deliveryLabels[book.deliveryType]}</span>
          </div>
        </div>

        {/* Price Section */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              {formatJod(book.price)}
            </span>
            <span className="text-sm text-muted-foreground">د.أ</span>
            {book.originalPrice != null && book.originalPrice > 0 && (
              <span className="text-sm text-muted-foreground line-through">
                {formatJod(book.originalPrice)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {book.negotiable && (
              <Badge variant="outline" className="text-xs bg-accent/10 text-accent-foreground border-accent/20">
                <Tag className="w-3 h-3 ml-1" />
                قابل للتفاوض
              </Badge>
            )}
          </div>
        </div>

        {/* Notes indicator */}
        {book.hasNotes && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <Clock className="w-3.5 h-3.5" />
            <span>يحتوي على ملاحظات</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
        <Button 
          className="flex-1" 
          disabled={isUnavailable}
          asChild={!isUnavailable}
        >
          {isUnavailable ? (
            <span>غير متاح</span>
          ) : (
            <Link href={`/book/${book.id}`}>عرض التفاصيل</Link>
          )}
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          disabled={isUnavailable}
          className="flex-shrink-0"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
