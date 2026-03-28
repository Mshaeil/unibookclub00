"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

/**
 * Thin progress shimmer on client navigations — feels instant without blocking paint.
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    setPulse((n) => n + 1)
  }, [pathname])

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] overflow-hidden bg-transparent"
      aria-hidden
    >
      <div
        key={pulse}
        className="ubc-nav-progress h-full w-full bg-gradient-to-l from-primary via-primary/90 to-secondary"
      />
    </div>
  )
}
