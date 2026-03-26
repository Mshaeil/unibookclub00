/** Placeholder while home listings + sections stream in */
export function HomeMainSkeleton() {
  return (
    <div className="animate-pulse space-y-16 py-12" aria-hidden>
      <div className="container mx-auto px-4 space-y-6">
        <div className="mx-auto h-8 max-w-md rounded-lg bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 rounded-2xl bg-muted/80" />
          <div className="h-64 rounded-2xl bg-muted/80" />
        </div>
      </div>
      <div className="container mx-auto px-4">
        <div className="mb-8 mx-auto h-10 max-w-sm rounded-lg bg-muted" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border bg-card">
              <div className="aspect-[4/3] bg-muted" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted/80" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="container mx-auto px-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted/70" />
          ))}
        </div>
      </div>
    </div>
  )
}
