export type MessageAttachment = {
  pathname: string
  name: string
  mime: string
}

const VERSION = 1

/** Build JSON string to encrypt (must not be trimmed away). */
export function stringifyMessagePayload(
  text: string,
  attachments: MessageAttachment[],
): string {
  const t = text.trim()
  const a = attachments.map((x) => ({
    p: x.pathname.trim(),
    n: (x.name || "file").slice(0, 240),
    m: (x.mime || "").slice(0, 120),
  }))
  if (t.length === 0 && a.length === 0) {
    throw new Error("empty payload")
  }
  return JSON.stringify({ v: VERSION, t, a })
}

export function parseMessagePayload(decrypted: string): {
  text: string
  attachments: MessageAttachment[]
} {
  const s = decrypted.trim()
  if (!s.startsWith("{")) {
    return { text: decrypted, attachments: [] }
  }
  try {
    const o = JSON.parse(s) as {
      v?: number
      t?: string
      a?: { p: string; n?: string; m?: string }[]
    }
    if (o.v !== VERSION || !Array.isArray(o.a)) {
      return { text: decrypted, attachments: [] }
    }
    return {
      text: typeof o.t === "string" ? o.t : "",
      attachments: o.a
        .filter((x) => x && typeof x.p === "string" && x.p.length > 0)
        .map((x) => ({
          pathname: x.p,
          name: typeof x.n === "string" && x.n.trim() ? x.n : "مرفق",
          mime: typeof x.m === "string" ? x.m : "",
        })),
    }
  } catch {
    return { text: decrypted, attachments: [] }
  }
}

/** Must match keys produced by /api/upload: listings/{userId}/{timestamp}.{ext} */
export function isSafeListingStoragePath(pathname: string, userId: string): boolean {
  if (!pathname || pathname.includes("..")) return false
  const prefix = `listings/${userId}/`
  if (!pathname.toLowerCase().startsWith(prefix.toLowerCase())) return false
  const rest = pathname.slice(prefix.length)
  if (!rest || rest.length > 400) return false
  if (rest.includes("/") || rest.includes("\\")) return false
  return /^[a-zA-Z0-9._-]+$/.test(rest)
}
