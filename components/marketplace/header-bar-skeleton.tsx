/** Mimics header height during route loading so layout does not jump. */
export function HeaderBarSkeleton() {
  return (
    <div
      className="sticky top-0 z-40 h-14 w-full shrink-0 animate-pulse border-b border-border/50 bg-muted/35 backdrop-blur-md"
      aria-hidden
    />
  )
}
