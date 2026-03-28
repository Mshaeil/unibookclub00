import { HeaderBarSkeleton } from "@/components/marketplace/header-bar-skeleton"

export default function CartLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HeaderBarSkeleton />
      <div className="container mx-auto flex-1 space-y-6 px-4 py-8">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4 rounded-xl border bg-card p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-16 w-12 shrink-0 animate-pulse rounded-md bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-xl border bg-card" />
        </div>
      </div>
    </div>
  )
}
