export function CardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border-2 border-border/20">
      <div className="aspect-[5/7] skeleton" />
      <div className="p-2 space-y-1.5 bg-card/40">
        <div className="h-2.5 rounded skeleton" />
        <div className="h-2 w-14 rounded skeleton" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
