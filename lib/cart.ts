export type CartItem = { listingId: string; addedAt: number }

const KEY = "wpasu_cart_v1"

function safeParse(raw: string | null): CartItem[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw) as unknown
    if (!Array.isArray(v)) return []
    return v
      .map((x) => {
        if (!x || typeof x !== "object") return null
        const obj = x as { listingId?: unknown; addedAt?: unknown }
        if (typeof obj.listingId !== "string" || !obj.listingId) return null
        const addedAt = typeof obj.addedAt === "number" ? obj.addedAt : Date.now()
        return { listingId: obj.listingId, addedAt }
      })
      .filter(Boolean) as CartItem[]
  } catch {
    return []
  }
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return []
  return safeParse(window.localStorage.getItem(KEY))
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(items))
}

export function addToCart(listingId: string) {
  const items = readCart()
  if (items.some((i) => i.listingId === listingId)) return items
  const next = [{ listingId, addedAt: Date.now() }, ...items].slice(0, 50)
  writeCart(next)
  return next
}

export function removeFromCart(listingId: string) {
  const next = readCart().filter((i) => i.listingId !== listingId)
  writeCart(next)
  return next
}

export function clearCart() {
  writeCart([])
}

