import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardMessages from "@/components/messages/dashboard-messages"

function MessagesFallback() {
  return (
    <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
      جاري تحميل الرسائل…
    </div>
  )
}

export default async function DashboardMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login?redirect=/dashboard/messages")
  }
  const sp = await searchParams
  return (
    <Suspense fallback={<MessagesFallback />}>
      <DashboardMessages userId={user.id} initialListingId={sp.listing} />
    </Suspense>
  )
}
