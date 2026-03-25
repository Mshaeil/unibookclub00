/** Listing row shape used for discount display (client or server). */
export type ListingDiscountFields = {
  price: number
  original_price?: number | null
  discount_expires_at?: string | null
}

const DAY_MS = 24 * 60 * 60 * 1000

export function discountEndsAtFromNow(): string {
  return new Date(Date.now() + DAY_MS).toISOString()
}

/** 0 = no discount; then 10–50 in steps of 10 (10% and 30% marked recommended in UI). */
export const LISTING_DISCOUNT_PCT_VALUES = [0, 10, 20, 30, 40, 50] as const

export const LISTING_DISCOUNT_RECOMMENDED_PCTS = new Set<number>([10, 30])

export function isPositiveListingDiscountPercent(p: number): boolean {
  return p > 0 && (LISTING_DISCOUNT_PCT_VALUES as readonly number[]).includes(p)
}

export function priceAfterPercentDiscount(base: number, percentOff: number): number {
  if (percentOff <= 0) return Math.round(base * 100) / 100
  const p = Math.max(0, Math.min(50, percentOff))
  return Math.round(base * (1 - p / 100) * 100) / 100
}

/** Pick nearest allowed percent for edit form from stored base + final price. */
export function closestListingDiscountPercent(base: number, finalPrice: number): number {
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(finalPrice)) return 0
  if (finalPrice >= base) return 0
  const targetPct = ((base - finalPrice) / base) * 100
  let best = 0
  let bestDiff = Infinity
  for (const p of LISTING_DISCOUNT_PCT_VALUES) {
    const d = Math.abs(p - targetPct)
    if (d < bestDiff) {
      bestDiff = d
      best = p
    }
  }
  return best
}

/** True when original > price and optional promo window is still valid (or unset = legacy unlimited). */
export function isPromoDiscountActive(listing: ListingDiscountFields): boolean {
  const orig = listing.original_price != null ? Number(listing.original_price) : null
  const price = Number(listing.price)
  if (orig == null || !(orig > price)) return false
  if (!listing.discount_expires_at) return true
  return new Date(listing.discount_expires_at).getTime() > Date.now()
}

export function discountPercentLabel(listing: ListingDiscountFields): number | null {
  const orig = listing.original_price != null ? Number(listing.original_price) : null
  const price = Number(listing.price)
  if (orig == null || !(orig > price)) return null
  return Math.round((1 - price / orig) * 100)
}

export function isDiscountWindowExpired(listing: ListingDiscountFields): boolean {
  if (!listing.discount_expires_at) return false
  const orig = listing.original_price != null ? Number(listing.original_price) : null
  const price = Number(listing.price)
  if (orig == null || !(orig > price)) return false
  return new Date(listing.discount_expires_at).getTime() <= Date.now()
}
