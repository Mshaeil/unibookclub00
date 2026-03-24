import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const BUCKET_NAME = "listing-images"

export async function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.searchParams.get("pathname")

    if (!pathname) {
      return NextResponse.json({ error: "Missing pathname" }, { status: 400 })
    }

    const supabase = await createClient()

    // Try private bucket first via signed URL; if it fails, fall back to public URL.
    const { data: signedData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(pathname, 60 * 60)

    if (signedData?.signedUrl) {
      return NextResponse.redirect(signedData.signedUrl)
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(pathname)

    if (!publicData?.publicUrl) {
      return new NextResponse("Not found", { status: 404 })
    }

    return NextResponse.redirect(publicData.publicUrl)
  } catch (error) {
    console.error("Error serving file:", error)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
}
