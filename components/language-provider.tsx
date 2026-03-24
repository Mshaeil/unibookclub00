"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

type Language = "ar" | "en"

type LanguageContextValue = {
  language: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar")

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("site_lang") : null
    const lang: Language = saved === "en" ? "en" : "ar"
    setLanguageState(lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("site_lang", lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
  }

  const value = useMemo(() => ({ language, setLanguage }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider")
  return ctx
}

export function useTranslate() {
  const { language } = useLanguage()
  return (ar: string, en: string) => (language === "ar" ? ar : en)
}
