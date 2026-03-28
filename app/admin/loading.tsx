export default function AdminLoading() {
  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-11 w-full max-w-md animate-pulse rounded-lg bg-muted" />
      <div className="rounded-xl border bg-card p-4">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-muted/70" />
          ))}
        </div>
      </div>
    </div>
  )
}
