import { type NextRequest, NextResponse } from "next/server"
import { createPublicSupabaseClient } from "@/lib/supabase/public-server"

const BUCKET_NAME = "listing-images"

function normalizeStorageRef(input: string): { bucket: string; key: string } {
  let raw = (input || "").trim()
  if (!raw) return { bucket: BUCKET_NAME, key: "" }

  // If DB stored a full Supabase storage URL, extract bucket/key.
  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw)
      // /storage/v1/object/public/<bucket>/<key...>
      const m = u.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/)
      if (m) return { bucket: m[1], key: decodeURIComponent(m[2]) }
      raw = u.pathname.replace(/^\/+/, "")
    } catch {
      // fall through
    }
  }

  raw = raw.replace(/^\/+/, "")
  raw = raw.replace(/^public\//, "")
  raw = raw.replace(/^storage\/v1\/object\/(?:public|sign)\//, "")

  // If the string starts with "<bucket>/...", split it.
  if (raw.startsWith(`${BUCKET_NAME}/`)) {
    return { bucket: BUCKET_NAME, key: raw.slice(`${BUCKET_NAME}/`.length) }
  }
  const firstSlash = raw.indexOf("/")
  if (firstSlash > 0) {
    const maybeBucket = raw.slice(0, firstSlash)
    const rest = raw.slice(firstSlash + 1)
    // Accept other bucket names if present in stored value.
    if (maybeBucket && rest.startsWith("listings/")) {
      return { bucket: maybeBucket, key: rest }
    }
  }

  return { bucket: BUCKET_NAME, key: raw }
}

function placeholderSvg(text = "No image") {
  const safe = text.replace(/[<>"]/g, "")
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">\n  <rect width="640" height="480" fill="#e5e7eb"/>\n  <rect x="24" y="24" width="592" height="432" rx="24" fill="#f3f4f6" stroke="#d1d5db"/>\n  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family=\"Arial, sans-serif\" font-size=\"24\" fill=\"#6b7280\">${safe}</text>\n</svg>`
}

export async function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.searchParams.get("pathname")?.trim()

    if (!pathname) {
      return NextResponse.json({ error: "Missing pathname" }, { status: 400 })
    }
    if (pathname.includes("..")) {
      return NextResponse.json({ error: "Invalid pathname" }, { status: 400 })
    }

    const { bucket, key } = normalizeStorageRef(pathname)
    if (!key) {
      return NextResponse.json({ error: "Invalid pathname" }, { status: 400 })
    }

    // Use public client to avoid auth/session work for every image request.
    const supabase = createPublicSupabaseClient()
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(key)

    if (error || !data) {
      // Return a tiny placeholder image (avoid flooding network with repeated 404s).
      return new NextResponse(placeholderSvg("Image not found"), {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          "X-Content-Type-Options": "nosniff",
        },
      })
    }

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": data.type || "application/octet-stream",
        "Content-Length": String(data.size),
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
}
