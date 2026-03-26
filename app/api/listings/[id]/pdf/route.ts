import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizeEmail } from "@/lib/utils/email"
import { phoneDigitsMatchLast10, sanitizePhoneDigits } from "@/lib/utils/phone"

const BUCKET = "listing-images"
const PDF_TAG = /\[PDF_FILE\](.*?)\[\/PDF_FILE\]/

function extractPdfPath(description: string | null): string | null {
  if (!description) return null
  const m = description.match(PDF_TAG)
  return m?.[1]?.trim() || null
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: listingId } = await context.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone, whatsapp")
    .eq("id", user.id)
    .maybeSingle()

  const phone = profile?.phone ?? ""
  const whatsapp = profile?.whatsapp ?? ""

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, description, status")
    .eq("id", listingId)
    .maybeSingle()

  if (listingError || !listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const pdfPath = extractPdfPath(listing.description)
  if (!pdfPath) {
    return NextResponse.json({ error: "No PDF for this listing" }, { status: 404 })
  }

  if (listing.status !== "sold") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select("id, buyer_phone, buyer_id, buyer_email")
    .eq("listing_id", listingId)
    .maybeSingle()

  if (saleError || !sale) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const isBuyerById = sale.buyer_id === user.id
  const userEm = user.email ? normalizeEmail(user.email) : ""
  const saleEm =
    sale.buyer_email && String(sale.buyer_email).trim()
      ? normalizeEmail(String(sale.buyer_email))
      : ""
  const isBuyerByEmail = Boolean(userEm && saleEm && userEm === saleEm)
  const bp = sale.buyer_phone ?? ""
  const bp10 = sanitizePhoneDigits(bp, 10)
  const p10 = sanitizePhoneDigits(phone, 10)
  const w10 = sanitizePhoneDigits(whatsapp, 10)
  const isBuyerByPhoneStrict =
    bp10.length === 10 &&
    (bp10 === p10 || bp10 === w10)
  const isBuyerByPhoneLoose =
    phoneDigitsMatchLast10(bp, phone) || phoneDigitsMatchLast10(bp, whatsapp)
  const isBuyerByPhone = isBuyerByPhoneStrict || isBuyerByPhoneLoose

  if (!isBuyerById && !isBuyerByEmail && !isBuyerByPhone) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: review } = await supabase
    .from("seller_reviews")
    .select("id")
    .eq("listing_id", listingId)
    .eq("reviewer_id", user.id)
    .maybeSingle()

  if (!review) {
    return NextResponse.json(
      { error: "Rate the seller first to unlock the PDF download." },
      { status: 403 },
    )
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(pdfPath, 60 * 30)

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Could not prepare download" }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
