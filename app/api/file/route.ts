import { type NextRequest, NextResponse } from "next/server"
import { createPublicSupabaseClient } from "@/lib/supabase/public-server"

const BUCKET_NAME = "listing-images"

export async function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.searchParams.get("pathname")?.trim()

    if (!pathname) {
      return NextResponse.json({ error: "Missing pathname" }, { status: 400 })
    }
    if (pathname.includes("..")) {
      return NextResponse.json({ error: "Invalid pathname" }, { status: 400 })
    }

    // Use public client to avoid auth/session work for every image request.
    const supabase = createPublicSupabaseClient()
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(pathname)

    if (error || !data) {
      return new NextResponse("Not found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=60",
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
