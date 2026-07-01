"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/** Refreshes server pages when listings change — no manual reload needed. */
export function ListingsLiveSync() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const channel = supabase
      .channel("listings-live-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        () => {
          if (timer) clearTimeout(timer)
          timer = setTimeout(() => router.refresh(), 400)
        },
      )
      .subscribe()

    return () => {
      if (timer) clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [supabase, router])

  return null
}
