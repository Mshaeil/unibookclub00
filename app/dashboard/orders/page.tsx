import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OrdersContent } from "@/components/dashboard/orders-content"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/dashboard/orders")
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id, created_at, status, fulfillment_type, price, buyer_id, seller_id,
      listing:listings(id, title, images),
      seller:profiles!orders_seller_id_fkey(id, full_name),
      buyer:profiles!orders_buyer_id_fkey(id, full_name)
    `,
    )
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error && error.code !== "PGRST205") {
    console.error("Orders query error:", error)
  }

  return <OrdersContent viewerUserId={user.id} rows={(orders ?? []) as never} />
}

