"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Search, Users } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
import { countFromBigintRpc } from "@/lib/utils"

type HeroStats = {
  availableBooks: number
  sellersCount: number
  soldCount: number
}

export function HeroSection({ stats }: { stats?: HeroStats }) {
  const { language } = useLanguage()
  const supabase = useMemo(() => createClient(), [])
  const [live, setLive] = useState<HeroStats | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [approved, registeredRpc, profiles, sold] = await Promise.all([
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.rpc("get_platform_registered_count"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "sold"),
      ])
      if (cancelled) return
      const rpcN = countFromBigintRpc(registeredRpc.data)
      const registered =
        !registeredRpc.error && rpcN !== null ? rpcN : (profiles.count ?? 0)
      setLive({
        availableBooks: approved.count ?? 0,
        sellersCount: registered,
        soldCount: sold.count ?? 0,
      })
    })()
    return () => {
      cancelled = true
    }
  }, [supabase])

  const availableBooks = live?.availableBooks ?? stats?.availableBooks ?? 0
  const sellersCount = live?.sellersCount ?? stats?.sellersCount ?? 0
  const soldCount = live?.soldCount ?? stats?.soldCount ?? 0
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 transition-colors duration-300 motion-reduce:transition-none">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-24 lg:py-32 relative">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium text-primary">
              {language === "ar" ? "جامعة العلوم التطبيقية" : "Applied Science University"}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.15] text-balance font-display tracking-tight">
            {language === "ar" ? "ملخصاتك وكتبك الجامعية" : "Summaries & university books"}
            <br />
            <span className="text-primary">{language === "ar" ? "في مكان واحد" : "In one place"}</span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty px-1">
            {language === "ar"
              ? "منصة تركّز على الكتب الجامعية والملخصات: بيعها وشراؤها بسهولة داخل جامعة العلوم التطبيقية — تجربة واضحة على الجوال والكمبيوتر."
              : "Focused on university books and summaries: buy and sell them easily at Applied Science University — a clear experience on mobile and desktop."}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto">
            <Button size="lg" className="gap-2 px-6 sm:px-8 text-base transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5" asChild>
              <Link href="/browse">
                <Search className="h-5 w-5" />
                {language === "ar" ? "تصفح الملخصات والكتب" : "Browse summaries & books"}
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-6 sm:px-8 text-base transition-all duration-300 hover:shadow-md hover:-translate-y-0.5" asChild>
              <Link href="/dashboard/listings/new">
                {language === "ar" ? "اعرض كتابك أو ملخصك" : "List book or summary"}
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-8 md:pt-12 max-w-lg mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tabular-nums">{availableBooks}+</div>
              <div className="text-xs sm:text-sm text-muted-foreground leading-tight">
                {language === "ar" ? "كتب وملخصات متاحة" : "Books & summaries"}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary/10">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tabular-nums">{sellersCount}+</div>
              <div className="text-xs sm:text-sm text-muted-foreground leading-tight">{language === "ar" ? "طالب مسجّل" : "Students"}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-accent/10">
                <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tabular-nums">{soldCount}+</div>
              <div className="text-xs sm:text-sm text-muted-foreground leading-tight">{language === "ar" ? "صفقة مكتملة" : "Deals"}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
