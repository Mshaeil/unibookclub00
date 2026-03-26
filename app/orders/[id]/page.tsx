import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { OrderInvoice } from "@/components/orders/order-invoice"

export const dynamic = "force-dynamic"

type OrderRow = {
  id: string
  listing_id: string
  seller_id: string
  buyer_id: string
  status: string
  fulfillment_type: string
  delivery_note: string | null
  price: number
  points_earned: number
  created_at: string
  updated_at: string
  listing:
    | {
        id: string
        title: string
        price: number
        images: string[] | null
        availability: string
        status: string
        seller: { id: string; full_name: string | null; phone: string | null; whatsapp: string | null } | null
      }
    | { id: string }[]
    | null
}

type EventRow = {
  id: string
  actor_id: string
  from_status: string | null
  to_status: string
  note: string | null
  created_at: string
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?redirect=/orders/${encodeURIComponent(id)}`)
  }

  const [{ data: order, error: orderErr }, { data: events, error: eventsErr }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `
        id, listing_id, seller_id, buyer_id, status, fulfillment_type, delivery_note, price, points_earned, created_at, updated_at,
        listing:listings(
          id, title, price, images, availability, status,
          seller:profiles!listings_seller_id_fkey(id, full_name, phone, whatsapp)
        )
      `,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("order_events").select("id, actor_id, from_status, to_status, note, created_at").eq("order_id", id).order("created_at"),
  ])

  if (orderErr || !order) {
    redirect("/dashboard")
  }
  if (eventsErr) {
    console.error("Order events error:", eventsErr)
  }

  // optional: points balance (does not block)
  let pointsBalance = 0
  try {
    const { data: bal } = await supabase.rpc("get_points_balance", { p_user_id: user.id })
    pointsBalance = typeof bal === "number" ? bal : 0
  } catch {
    pointsBalance = 0
  }

  let existingReview: { id: string; rating: number; comment: string | null } | null = null
  try {
    const { data } = await supabase
      .from("seller_reviews")
      .select("id, rating, comment")
      .eq("listing_id", (order as unknown as OrderRow).listing_id)
      .eq("reviewer_id", user.id)
      .maybeSingle()
    existingReview = data ?? null
  } catch {
    existingReview = null
  }

  let redeemedPoints = 0
  try {
    const { data: rows } = await supabase
      .from("points_ledger")
      .select("delta_points")
      .eq("user_id", user.id)
      .eq("order_id", id)
      .eq("reason", "order_discount_redeem")
    const sum = (rows ?? []).reduce((acc: number, r: { delta_points: number }) => acc + Number(r.delta_points || 0), 0)
    redeemedPoints = Math.max(0, -sum)
  } catch {
    redeemedPoints = 0
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <OrderInvoice
          viewerUserId={user.id}
          order={order as unknown as OrderRow}
          events={(events ?? []) as EventRow[]}
          pointsBalance={pointsBalance}
          existingReview={existingReview}
          redeemedPoints={redeemedPoints}
        />
      </main>
      <Footer />
    </div>
  )
}

