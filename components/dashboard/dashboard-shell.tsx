"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { PurchasesContent } from "@/components/dashboard/purchases-content"
import { useTranslate } from "@/components/language-provider"
import { BookOpen, ShoppingBag } from "lucide-react"

type Listing = Parameters<typeof DashboardContent>[0]["listings"]
type Stats = Parameters<typeof DashboardContent>[0]["stats"]
type Profile = Parameters<typeof DashboardContent>[0]["profile"]

type Props = {
  profile: Profile
  listings: Listing
  stats: Stats
  sales: Parameters<typeof PurchasesContent>[0]["sales"]
  reviewedListingIds: string[]
}

export function DashboardShell({
  profile,
  listings,
  stats,
  sales,
  reviewedListingIds,
}: Props) {
  const t = useTranslate()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") === "purchases" ? "purchases" : "listings"

  function setTab(value: string) {
    const next = value === "purchases" ? "/dashboard?tab=purchases" : "/dashboard"
    router.replace(next)
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <div className="container mx-auto px-4 pt-8">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="listings" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {t("إعلاناتي", "My listings")}
          </TabsTrigger>
          <TabsTrigger value="purchases" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            {t("سجل مشترياتك", "Purchase history")}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="listings" className="mt-0">
        <DashboardContent profile={profile} listings={listings} stats={stats} />
      </TabsContent>
      <TabsContent value="purchases" className="mt-0">
        <PurchasesContent sales={sales} reviewedListingIds={reviewedListingIds} embedded />
      </TabsContent>
    </Tabs>
  )
}
