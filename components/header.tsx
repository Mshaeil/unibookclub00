"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "next-themes"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BookOpen, Menu, Plus, User, X, LogOut, LayoutDashboard, Heart, Settings, Shield, Sun, Moon } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

type Profile = {
  full_name: string | null
  role: "user" | "admin"
}

export function Header() {
  const router = useRouter()
  const supabase = createClient()
  const { resolvedTheme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single()
        setProfile(data)
      }
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  function handleLanguageChange(nextLang: "ar" | "en") {
    setLanguage(nextLang)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground">UniBookClub</span>
              <span className="text-xs text-muted-foreground">جامعة العلوم التطبيقية</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              الرئيسية
            </Link>
            <Link href="/browse" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              تصفح الكتب
            </Link>
            <Link href="/#faculties" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              الكليات
            </Link>
            <Link href="/how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              كيف يعمل
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center rounded-md border border-border">
              <button
                className={`px-2 py-1 text-xs ${language === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                onClick={() => handleLanguageChange("ar")}
              >
                AR
              </button>
              <button
                className={`px-2 py-1 text-xs ${language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                onClick={() => handleLanguageChange("en")}
              >
                EN
              </button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="تبديل الوضع الداكن والفاتح"
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {loading ? (
              <div className="h-9 w-24 animate-pulse bg-muted rounded-md" />
            ) : user ? (
              <>
                <Button asChild size="sm" className="gap-2">
                  <Link href="/dashboard/listings/new">
                    <Plus className="h-4 w-4" />
                    أضف كتابك
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
                        <p className="text-sm font-medium">{profile?.full_name || "المستخدم"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="ml-2 h-4 w-4" />
                        لوحة التحكم
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites" className="cursor-pointer">
                        <Heart className="ml-2 h-4 w-4" />
                        المفضلة
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="cursor-pointer">
                        <Settings className="ml-2 h-4 w-4" />
                        إعدادات الحساب
                      </Link>
                    </DropdownMenuItem>
                    {profile?.role === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer">
                            <Shield className="ml-2 h-4 w-4" />
                            لوحة الإدارة
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                      <LogOut className="ml-2 h-4 w-4" />
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href="/login">
                    <User className="h-4 w-4" />
                    تسجيل الدخول
                  </Link>
                </Button>
                <Button asChild size="sm" className="gap-2">
                  <Link href="/register">
                    <Plus className="h-4 w-4" />
                    أضف كتابك
                  </Link>
                </Button>
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
          <div className="md:hidden py-4 space-y-4 border-t border-border/50">
            <nav className="flex flex-col gap-3">
              <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                الرئيسية
              </Link>
              <Link href="/browse" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                تصفح الكتب
              </Link>
              <Link href="/#faculties" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                الكليات
              </Link>
              <Link href="/how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                كيف يعمل
              </Link>
            </nav>
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center rounded-md border border-border overflow-hidden">
                <button
                  className={`flex-1 px-2 py-1 text-xs ${language === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  onClick={() => handleLanguageChange("ar")}
                >
                  AR
                </button>
                <button
                  className={`flex-1 px-2 py-1 text-xs ${language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  onClick={() => handleLanguageChange("en")}
                >
                  EN
                </button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {resolvedTheme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
              </Button>
              {user ? (
                <>
                  <Button asChild size="sm" className="w-full gap-2">
                    <Link href="/dashboard/listings/new">
                      <Plus className="h-4 w-4" />
                      أضف كتابك
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full gap-2">
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-4 w-4" />
                      لوحة التحكم
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full gap-2 text-destructive" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    تسجيل الخروج
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm" className="w-full gap-2">
                    <Link href="/login">
                      <User className="h-4 w-4" />
                      تسجيل الدخول
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="w-full gap-2">
                    <Link href="/register">
                      <Plus className="h-4 w-4" />
                      أضف كتابك
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
