export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card animate-pulse">
      <div className="h-60 bg-muted rounded-t-lg" />
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-muted rounded-full w-20" />
          <div className="h-6 bg-muted rounded-full w-16" />
        </div>
        <div className="h-8 bg-muted rounded w-24" />
        <div className="flex gap-2 pt-3">
          <div className="h-9 bg-muted rounded flex-1" />
          <div className="h-9 bg-muted rounded flex-1" />
          <div className="h-9 bg-muted rounded w-9" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}