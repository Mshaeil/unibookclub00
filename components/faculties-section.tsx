"use client"

import { Card, CardContent } from "@/components/ui/card"
import { 
  Monitor, 
  Wrench, 
  Briefcase, 
  Palette, 
  Pill,
  GraduationCap
} from "lucide-react"

const faculties = [
  {
    id: "it",
    name: "كلية تكنولوجيا المعلومات",
    nameEn: "Faculty of IT",
    icon: Monitor,
    booksCount: 87,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    majors: ["هندسة البرمجيات", "علوم الحاسوب", "الأمن السيبراني", "الذكاء الاصطناعي"]
  },
  {
    id: "engineering",
    name: "كلية الهندسة",
    nameEn: "Faculty of Engineering",
    icon: Wrench,
    booksCount: 65,
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    majors: ["الهندسة المدنية", "الهندسة الكهربائية", "الهندسة الميكانيكية"]
  },
  {
    id: "business",
    name: "كلية إدارة الأعمال",
    nameEn: "Faculty of Business",
    icon: Briefcase,
    booksCount: 92,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    majors: ["المحاسبة", "التسويق", "التمويل", "إدارة الأعمال"]
  },
  {
    id: "design",
    name: "كلية التصميم",
    nameEn: "Faculty of Design",
    icon: Palette,
    booksCount: 43,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    majors: ["التصميم الجرافيكي", "التصميم الداخلي"]
  },
  {
    id: "pharmacy",
    name: "كلية الصيدلة",
    nameEn: "Faculty of Pharmacy",
    icon: Pill,
    booksCount: 56,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    majors: ["الصيدلة"]
  },
]

export function FacultiesSection() {
  return (
    <section id="faculties" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">الكليات</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
            تصفح حسب كليتك
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
            اختر كليتك للوصول السريع إلى الكتب المتاحة في تخصصك
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {faculties.map((faculty) => (
            <Card 
              key={faculty.id}
              className="group cursor-pointer border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${faculty.color}`}>
                    <faculty.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{faculty.name}</h3>
                      <p className="text-sm text-muted-foreground">{faculty.nameEn}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {faculty.majors.slice(0, 3).map((major) => (
                        <span 
                          key={major}
                          className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
                        >
                          {major}
                        </span>
                      ))}
                      {faculty.majors.length > 3 && (
                        <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                          +{faculty.majors.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
