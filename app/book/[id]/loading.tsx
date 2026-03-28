import { HeaderBarSkeleton } from "@/components/marketplace/header-bar-skeleton"

export default function BookDetailsLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HeaderBarSkeleton />
      <div className="container mx-auto flex-1 px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-28 w-full animate-pulse rounded bg-muted" />
          <div className="h-12 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
    </div>
  )
}

