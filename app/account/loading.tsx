import { HeaderBarSkeleton } from "@/components/marketplace/header-bar-skeleton"

export default function AccountLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HeaderBarSkeleton />
      <div className="container mx-auto flex-1 space-y-8 px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="h-72 animate-pulse rounded-xl border bg-card" />
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-xl border bg-card" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-xl border bg-card" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
