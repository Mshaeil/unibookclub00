"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "next-themes"
import { useLanguage, useTranslate } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  BookOpen,
  Menu,
  Plus,
  User,
  X,
  LogOut,
  LayoutDashboard,
  Heart,
  Settings,
  Shield,
  MoreVertical,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react"
import type { AuthChangeEvent, Session, User as SupabaseUser } from "@supabase/supabase-js"
import { ensureUserProfile } from "@/lib/auth/ensure-user-profile"

type Profile = {
  full_name: string | null
  role: "user" | "admin"
}

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])
  const { resolvedTheme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const t = useTranslate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const loadingFailsafe = window.setTimeout(() => {
      if (mounted) setLoading(false)
    }, 3500)

    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!mounted) return
        setUser(user)
        // Never block topbar on profile sync/read.
        setLoading(false)

        if (user) {
          void ensureUserProfile(supabase, user)
          const { data } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", user.id)
            .maybeSingle()
          if (mounted) setProfile(data ?? null)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        // Avoid hard-failing UI on transient Supabase auth storage lock contention.
        if (!/lock:sb-.*-auth-token/i.test(msg)) {
          console.error("[Header] auth init error:", e)
        }
        if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      } finally {
        window.clearTimeout(loadingFailsafe)
        if (mounted) setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      try {
        if (!mounted) return
        setUser(session?.user ?? null)
        if (!session?.user) {
          setProfile(null)
          return
        }
        // Avoid blocking on ensureUserProfile; fetch first, then sync if missing.
        const { data } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", session.user.id)
          .maybeSingle()
        if (mounted) setProfile(data ?? null)

        if (!data) {
          try {
            await ensureUserProfile(supabase, session.user)
            const { data: dataAfterSync } = await supabase
              .from("profiles")
              .select("full_name, role")
              .eq("id", session.user.id)
              .maybeSingle()
            if (mounted) setProfile(dataAfterSync ?? null)
          } catch {
            // If sync fails, the UI will continue showing null profile until the next auth refresh.
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (!/lock:sb-.*-auth-token/i.test(msg)) {
          console.error("[Header] auth state error:", e)
        }
        if (mounted) setProfile(null)
      }
    })

    return () => {
      mounted = false
      window.clearTimeout(loadingFailsafe)
      subscription.unsubscribe()
    }
  }, [supabase])

  function handleLanguageChange(nextLang: "ar" | "en") {
    setLanguage(nextLang)
  }

  async function handleLogout() {
    setMobileMenuOpen(false)
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false)
  }

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileMenuOpen])

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  }

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-primary transition-transform duration-300 hover:scale-105">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="truncate text-base sm:text-lg font-bold text-foreground">UniBookClub</span>
              <span className="truncate text-[10px] sm:text-xs text-muted-foreground">
                {t("جامعة العلوم التطبيقية", "Applied Science University")}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="ubc-nav-underline text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              {t("الرئيسية", "Home")}
            </Link>
            <Link
              href="/browse"
              className="ubc-nav-underline text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {t("تصفح الكتب والملخصات", "Browse books & summaries")}
            </Link>
            <Link
              href="/#faculties"
              className="ubc-nav-underline text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {t("الكليات", "Faculties")}
            </Link>
            <Link
              href="/how-it-works"
              className="ubc-nav-underline text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {t("كيف يعمل", "How it works")}
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="h-9 w-24 animate-pulse bg-muted rounded-md" />
            ) : user ? (
              <>
                <Button asChild variant="ghost" size="icon" aria-label={t("السلة", "Cart")}>
                  <Link href="/cart">
                    <ShoppingCart className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="sm" className="gap-2">
                  <Link href="/dashboard/listings/new">
                    <Plus className="h-4 w-4" />
                    {t("اعرض كتاباً أو ملخصاً", "List book or summary")}
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(profile?.full_name ?? null)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(profile?.full_name ?? null)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">
                          {profile?.full_name || t("المستخدم", "User")}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="ml-2 h-4 w-4" />
                        {t("لوحة التحكم", "Dashboard")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/orders" className="cursor-pointer">
                        <ShoppingBag className="ml-2 h-4 w-4" />
                        {t("طلباتي", "My orders")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/cart" className="cursor-pointer">
                        <ShoppingCart className="ml-2 h-4 w-4" />
                        {t("السلة", "Cart")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/purchases" className="cursor-pointer">
                        <ShoppingBag className="ml-2 h-4 w-4" />
                        {t("مشترياتك", "Your purchases")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites" className="cursor-pointer">
                        <Heart className="ml-2 h-4 w-4" />
                        {t("المفضلة", "Favorites")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="cursor-pointer">
                        <Settings className="ml-2 h-4 w-4" />
                        {t("إعدادات الحساب", "Account settings")}
                      </Link>
                    </DropdownMenuItem>
                    {profile?.role === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer">
                            <Shield className="ml-2 h-4 w-4" />
                            {t("لوحة الإدارة", "Admin")}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                      <LogOut className="ml-2 h-4 w-4" />
                      {t("تسجيل الخروج", "Log out")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={t("الإعدادات", "Settings")}>
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => handleLanguageChange(language === "ar" ? "en" : "ar")}>
                      {t("تبديل اللغة", "Toggle language")} ({language === "ar" ? "AR" : "EN"})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={toggleTheme}>
                      {resolvedTheme === "dark" ? t("الوضع الفاتح", "Light mode") : t("الوضع الداكن", "Dark mode")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="icon" aria-label={t("السلة", "Cart")}>
                  <Link href="/cart">
                    <ShoppingCart className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href="/login">
                    <User className="h-4 w-4" />
                    {t("تسجيل الدخول", "Log in")}
                  </Link>
                </Button>
                <Button asChild size="sm" className="gap-2">
                  <Link href="/register">
                    <Plus className="h-4 w-4" />
                    {t("اعرض كتاباً أو ملخصاً", "List book or summary")}
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={t("الإعدادات", "Settings")}>
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => handleLanguageChange(language === "ar" ? "en" : "ar")}>
                      {t("تبديل اللغة", "Toggle language")} ({language === "ar" ? "AR" : "EN"})
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={toggleTheme}>
                      {resolvedTheme === "dark" ? t("الوضع الفاتح", "Light mode") : t("الوضع الداكن", "Dark mode")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden max-h-[calc(100vh-4rem)] overflow-y-auto py-4 space-y-4 border-t border-border/50">
            <nav className="flex flex-col gap-3">
              <Link href="/" onClick={closeMobileMenu} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                {t("الرئيسية", "Home")}
              </Link>
              <Link href="/browse" onClick={closeMobileMenu} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {t("تصفح الكتب والملخصات", "Browse books & summaries")}
              </Link>
              <Link href="/#faculties" onClick={closeMobileMenu} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {t("الكليات", "Faculties")}
              </Link>
              <Link href="/how-it-works" onClick={closeMobileMenu} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {t("كيف يعمل", "How it works")}
              </Link>
            </nav>
            <div className="flex flex-col gap-2 pt-2">
              {user ? (
                <>
                  <Button asChild size="sm" className="w-full gap-2">
                    <Link href="/dashboard/listings/new" onClick={closeMobileMenu}>
                      <Plus className="h-4 w-4" />
                      {t("اعرض كتاباً أو ملخصاً", "List book or summary")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full gap-2">
                    <Link href="/dashboard" onClick={closeMobileMenu}>
                      <LayoutDashboard className="h-4 w-4" />
                      {t("لوحة التحكم", "Dashboard")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full gap-2">
                    <Link href="/dashboard/orders" onClick={closeMobileMenu}>
                      <ShoppingBag className="h-4 w-4" />
                      {t("طلباتي", "My orders")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full gap-2">
                    <Link href="/cart" onClick={closeMobileMenu}>
                      <ShoppingCart className="h-4 w-4" />
                      {t("السلة", "Cart")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full gap-2">
                    <Link href="/dashboard/purchases" onClick={closeMobileMenu}>
                      <ShoppingBag className="h-4 w-4" />
                      {t("مشترياتك", "Your purchases")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full gap-2">
                    <Link href="/favorites" onClick={closeMobileMenu}>
                      <Heart className="h-4 w-4" />
                      {t("المفضلة", "Favorites")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full gap-2">
                    <Link href="/account" onClick={closeMobileMenu}>
                      <Settings className="h-4 w-4" />
                      {t("إعدادات الحساب", "Account settings")}
                    </Link>
                  </Button>
                  {profile?.role === "admin" && (
                    <Button asChild variant="outline" size="sm" className="w-full gap-2">
                      <Link href="/admin" onClick={closeMobileMenu}>
                        <Shield className="h-4 w-4" />
                        {t("لوحة الإدارة", "Admin")}
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="w-full gap-2 text-destructive" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    {t("تسجيل الخروج", "Log out")}
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm" className="w-full gap-2">
                    <Link href="/cart" onClick={closeMobileMenu}>
                      <ShoppingCart className="h-4 w-4" />
                      {t("السلة", "Cart")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full gap-2">
                    <Link href="/login" onClick={closeMobileMenu}>
                      <User className="h-4 w-4" />
                      {t("تسجيل الدخول", "Log in")}
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="w-full gap-2">
                    <Link href="/register" onClick={closeMobileMenu}>
                      <Plus className="h-4 w-4" />
                      {t("اعرض كتاباً أو ملخصاً", "List book or summary")}
                    </Link>
                  </Button>
                </>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <MoreVertical className="h-4 w-4" />
                    {t("الإعدادات", "Settings")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => {
                    handleLanguageChange(language === "ar" ? "en" : "ar")
                    closeMobileMenu()
                  }}>
                    {t("تبديل اللغة", "Toggle language")} ({language === "ar" ? "AR" : "EN"})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    toggleTheme()
                    closeMobileMenu()
                  }}>
                    {resolvedTheme === "dark" ? t("الوضع الفاتح", "Light mode") : t("الوضع الداكن", "Dark mode")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
