"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useTranslate } from "@/components/language-provider"
import { Bell, X } from "lucide-react"

type Toast = {
  id: string
  title: string
  listingId: string
}

export function ListingNotifications() {
  const router = useRouter()
  const t = useTranslate()
  const supabase = useMemo(() => createClient(), [])
  const [toasts, setToasts] = useState<Toast[]>([])
  const majorIdRef = useRef<string | null>(null)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let mounted = true

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted || !user) return

      userIdRef.current = user.id
      const { data: profile } = await supabase
        .from("profiles")
        .select("major_id")
        .eq("id", user.id)
        .maybeSingle()

      majorIdRef.current = profile?.major_id ?? null
      if (!majorIdRef.current) return

      channel = supabase
        .channel("listing-major-notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "listings" },
          (payload: { new: unknown }) => handleListingChange(payload.new),
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "listings" },
          (payload: { new: unknown }) => handleListingChange(payload.new),
        )
        .subscribe()

      function handleListingChange(row: unknown) {
        const r = row as {
          id?: string
          title?: string
          status?: string
          major_id?: string | null
          seller_id?: string
        }
        if (r.status !== "approved") return
        if (r.seller_id === userIdRef.current) return
        if (!r.major_id || r.major_id !== majorIdRef.current) return
        if (!r.id || !r.title) return

        const toast: Toast = { id: r.id, title: r.title, listingId: r.id }
        setToasts((prev) => {
          if (prev.some((x) => x.id === toast.id)) return prev
          return [toast, ...prev].slice(0, 3)
        })
        router.refresh()

        window.setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== toast.id))
        }, 5000)
      }
    }

    void setup()

    return () => {
      mounted = false
      if (channel) void supabase.removeChannel(channel)
    }
  }, [supabase, router])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] flex flex-col gap-2 sm:left-auto sm:right-4 sm:max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-3 rounded-lg border bg-card p-4 shadow-lg animate-in slide-in-from-bottom-2"
          role="status"
        >
          <Bell className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {t("إعلان جديد في تخصصك", "New listing in your major")}
            </p>
            <p className="text-sm text-muted-foreground truncate">{toast.title}</p>
            <button
              type="button"
              className="text-xs text-primary hover:underline mt-1"
              onClick={() => router.push(`/book/${toast.listingId}`)}
            >
              {t("عرض الإعلان", "View listing")}
            </button>
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            aria-label={t("إغلاق", "Close")}
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== toast.id))}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
