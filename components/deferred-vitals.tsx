"use client"

import dynamic from "next/dynamic"

const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((m) => m.Analytics),
  { ssr: false },
)
const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((m) => m.SpeedInsights),
  { ssr: false },
)

/** Loads analytics in a separate chunk after hydration — lighter first paint */
export function DeferredVitals() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
