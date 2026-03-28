import type { CSSProperties } from "react"

/** CSS variable consumed by `.ubc-reveal-item` in `globals.css` */
const UBC_DELAY = "--ubc-d" as const

/**
 * Staggered entrance delay for grid/list children (GPU-friendly; respects reduced-motion in CSS).
 */
export function staggerStyle(index: number, stepMs = 40, cap = 16): CSSProperties {
  const ms = Math.min(Math.max(0, index), cap) * stepMs
  return { [UBC_DELAY]: `${ms}ms` } as CSSProperties
}
