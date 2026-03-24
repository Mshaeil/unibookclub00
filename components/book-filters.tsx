"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ChevronDown,
  ArrowUpDown
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const faculties = [
  { value: "all", label: "جميع الكليات" },
  { value: "it", label: "كلية تكنولوجيا المعلومات" },
  { value: "engineering", label: "كلية الهندسة" },
  { value: "business", label: "كلية إدارة الأعمال" },
  { value: "design", label: "كلية التصميم" },
  { value: "pharmacy", label: "كلية الصيدلة" },
]

const majors = {
  all: [{ value: "all", label: "جميع التخصصات" }],
  it: [
    { value: "all", label: "جميع التخصصات" },
    { value: "software", label: "هندسة البرمجيات" },
    { value: "cs", label: "علوم الحاسوب" },
    { value: "cyber", label: "الأمن السيبراني" },
    { value: "ai", label: "الذكاء الاصطناعي" },
  ],
  engineering: [
    { value: "all", label: "جميع التخصصات" },
    { value: "civil", label: "الهندسة المدنية" },
    { value: "electrical", label: "الهندسة الكهربائية" },
    { value: "mechanical", label: "الهندسة الميكانيكية" },
  ],
  business: [
    { value: "all", label: "جميع التخصصات" },
    { value: "accounting", label: "المحاسبة" },
    { value: "marketing", label: "التسويق" },
    { value: "finance", label: "التمويل" },
    { value: "management", label: "إدارة الأعمال" },
  ],
  design: [
    { value: "all", label: "جميع التخصصات" },
    { value: "graphic", label: "التصميم الجرافيكي" },
    { value: "interior", label: "التصميم الداخلي" },
  ],
  pharmacy: [
    { value: "all", label: "جميع التخصصات" },
    { value: "pharmacy", label: "الصيدلة" },
  ],
}

const courses = {
  all: [{ value: "all", label: "جميع المواد" }],
  software: [
    { value: "all", label: "جميع المواد" },
    { value: "ds", label: "Data Structures" },
    { value: "oop", label: "Object Oriented Programming" },
    { value: "db", label: "Database Systems" },
    { value: "web", label: "Web Development" },
  ],
  cs: [
    { value: "all", label: "جميع المواد" },
    { value: "algo", label: "Algorithms" },
    { value: "os", label: "Operating Systems" },
    { value: "networks", label: "Computer Networks" },
  ],
  cyber: [
    { value: "all", label: "جميع المواد" },
    { value: "security", label: "Network Security" },
    { value: "crypto", label: "Cryptography" },
  ],
  ai: [
    { value: "all", label: "جميع المواد" },
    { value: "ml", label: "Machine Learning" },
    { value: "dl", label: "Deep Learning" },
  ],
  civil: [
    { value: "all", label: "جميع المواد" },
    { value: "structural", label: "Structural Analysis" },
    { value: "concrete", label: "Reinforced Concrete" },
  ],
  accounting: [
    { value: "all", label: "جميع المواد" },
    { value: "financial", label: "Financial Accounting" },
    { value: "managerial", label: "Managerial Accounting" },
  ],
}

export interface BookFiltersState {
  search: string
  faculty: string
  major: string
  course: string
  condition: string
  bookType: string
  deliveryType: string
  status: string
  priceRange: [number, number]
  sortBy: string
}

interface BookFiltersProps {
  onFiltersChange?: (filters: BookFiltersState) => void
}

export function BookFilters({ onFiltersChange }: BookFiltersProps) {
  const [search, setSearch] = useState("")
  const [faculty, setFaculty] = useState("all")
  const [major, setMajor] = useState("all")
  const [course, setCourse] = useState("all")
  const [condition, setCondition] = useState("all")
  const [bookType, setBookType] = useState("all")
  const [deliveryType, setDeliveryType] = useState("all")
  const [status, setStatus] = useState("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50])
  const [sortBy, setSortBy] = useState("newest")
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const availableMajors = majors[faculty as keyof typeof majors] || majors.all
  const availableCourses = courses[major as keyof typeof courses] || courses.all

  const handleFacultyChange = (value: string) => {
    setFaculty(value)
    setMajor("all")
    setCourse("all")
    notifyChange({ faculty: value, major: "all", course: "all" })
  }

  const handleMajorChange = (value: string) => {
    setMajor(value)
    setCourse("all")
    notifyChange({ major: value, course: "all" })
  }

  const handleCourseChange = (value: string) => {
    setCourse(value)
    notifyChange({ course: value })
  }

  const handleConditionChange = (value: string) => {
    setCondition(value)
    notifyChange({ condition: value })
  }

  const handleBookTypeChange = (value: string) => {
    setBookType(value)
    notifyChange({ bookType: value })
  }

  const handleDeliveryTypeChange = (value: string) => {
    setDeliveryType(value)
    notifyChange({ deliveryType: value })
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    notifyChange({ status: value })
  }

  const handlePriceChange = (value: number[]) => {
    const newRange: [number, number] = [value[0], value[1]]
    setPriceRange(newRange)
    notifyChange({ priceRange: newRange })
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    notifyChange({ sortBy: value })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    notifyChange({ search: value })
  }

  const notifyChange = (updates: Partial<BookFiltersState>) => {
    onFiltersChange?.({
      search,
      faculty,
      major,
      course,
      condition,
      bookType,
      deliveryType,
      status,
      priceRange,
      sortBy,
      ...updates,
    })
  }

  const clearFilters = () => {
    setSearch("")
    setFaculty("all")
    setMajor("all")
    setCourse("all")
    setCondition("all")
    setBookType("all")
    setDeliveryType("all")
    setStatus("all")
    setPriceRange([0, 50])
    setSortBy("newest")
    onFiltersChange?.({
      search: "",
      faculty: "all",
      major: "all",
      course: "all",
      condition: "all",
      bookType: "all",
      deliveryType: "all",
      status: "all",
      priceRange: [0, 50],
      sortBy: "newest",
    })
  }

  const hasActiveFilters = search || faculty !== "all" || major !== "all" || 
    course !== "all" || condition !== "all" || bookType !== "all" || 
    deliveryType !== "all" || status !== "all" || priceRange[0] > 0 || priceRange[1] < 50

  const activeFiltersCount = [
    search, 
    faculty !== "all", 
    major !== "all", 
    course !== "all", 
    condition !== "all",
    bookType !== "all",
    deliveryType !== "all",
    status !== "all",
    priceRange[0] > 0 || priceRange[1] < 50
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن كتاب، مادة، مؤلف، أو دكتور..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button
          variant="outline"
          className="md:hidden gap-2"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* Main Filters */}
      <div className={`grid gap-4 md:grid-cols-4 ${showMobileFilters ? 'grid' : 'hidden md:grid'}`}>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">الكلية</Label>
          <Select value={faculty} onValueChange={handleFacultyChange}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الكلية" />
            </SelectTrigger>
            <SelectContent>
              {faculties.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">التخصص</Label>
          <Select value={major} onValueChange={handleMajorChange} disabled={faculty === "all"}>
            <SelectTrigger>
              <SelectValue placeholder="اختر التخصص" />
            </SelectTrigger>
            <SelectContent>
              {availableMajors.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">المادة</Label>
          <Select value={course} onValueChange={handleCourseChange} disabled={major === "all"}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المادة" />
            </SelectTrigger>
            <SelectContent>
              {availableCourses.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">الترتيب</Label>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger>
              <ArrowUpDown className="h-4 w-4 ml-2" />
              <SelectValue placeholder="ترتيب حسب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">الأحدث</SelectItem>
              <SelectItem value="oldest">الأقدم</SelectItem>
              <SelectItem value="price_low">السعر: الأقل</SelectItem>
              <SelectItem value="price_high">السعر: الأعلى</SelectItem>
              <SelectItem value="views">الأكثر مشاهدة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Filters */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            فلاتر متقدمة
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">حالة الكتاب</Label>
              <Select value={condition} onValueChange={handleConditionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="حالة الكتاب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="new">جديد</SelectItem>
                  <SelectItem value="like_new">شبه جديد</SelectItem>
                  <SelectItem value="good">جيد</SelectItem>
                  <SelectItem value="acceptable">مقبول</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">نوع الكتاب</Label>
              <Select value={bookType} onValueChange={handleBookTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="نوع الكتاب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="original">كتاب أصلي</SelectItem>
                  <SelectItem value="notes">ملزمة</SelectItem>
                  <SelectItem value="reference">مرجع</SelectItem>
                  <SelectItem value="summary">ملخص</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">طريقة التسليم</Label>
              <Select value={deliveryType} onValueChange={handleDeliveryTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="طريقة التسليم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الطرق</SelectItem>
                  <SelectItem value="campus">داخل الجامعة</SelectItem>
                  <SelectItem value="meetup">استلام يدوي</SelectItem>
                  <SelectItem value="delivery">توصيل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">التوفر</Label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="حالة التوفر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="available">متاح فقط</SelectItem>
                  <SelectItem value="reserved">محجوز</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                السعر: {priceRange[0]} - {priceRange[1]} د.أ
              </Label>
              <Slider
                value={priceRange}
                onValueChange={handlePriceChange}
                max={50}
                min={0}
                step={1}
                className="mt-3"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            مسح الفلاتر ({activeFiltersCount})
          </Button>
        </div>
      )}
    </div>
  )
}
