import { HeaderBarSkeleton } from "@/components/marketplace/header-bar-skeleton"

export default function OrderInvoiceLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HeaderBarSkeleton />
      <div className="container mx-auto flex-1 space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-72 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-7 w-24 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4 rounded-xl border bg-card p-6">
            <div className="flex gap-3">
              <div className="h-16 w-12 shrink-0 animate-pulse rounded-md bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-40 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-16 animate-pulse rounded-lg bg-muted/80" />
              <div className="h-16 animate-pulse rounded-lg bg-muted/80" />
            </div>
          </div>
          <div className="h-64 animate-pulse rounded-xl border bg-card" />
        </div>
      </div>
    </div>
  )
}
