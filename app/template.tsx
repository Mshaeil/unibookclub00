"use client"

import { usePathname } from "next/navigation"

/**
 * Remounts on each navigation so enter animations run — pairs with globals.css / view transitions.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div
      key={pathname}
      className="ubc-page-enter min-h-0 motion-reduce:animate-none"
    >
      {children}
    </div>
  )
}
