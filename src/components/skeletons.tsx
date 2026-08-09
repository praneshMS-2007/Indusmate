/**
 * Loading skeletons.
 *
 * Shaped like the content they replace, never a centred spinner: a spinner
 * says "wait" and tells you nothing, while a skeleton in the right shape tells
 * you what is arriving and stops the layout jumping when it does.
 */

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-sm bg-line ${className}`} />;
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy
      aria-label="Loading listings"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-4">
          <div className="flex gap-1.5">
            <Bar className="h-4 w-20" />
            <Bar className="h-4 w-16" />
          </div>
          <Bar className="h-5 w-full" />
          <Bar className="h-5 w-3/5" />
          <div className="mt-2 flex items-end justify-between border-t border-line-subtle pt-3">
            <Bar className="h-7 w-24" />
            <Bar className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-4">
          <div className="flex gap-1.5">
            <Bar className="h-4 w-24" />
            <Bar className="h-4 w-20" />
            <Bar className="ml-auto h-5 w-24" />
          </div>
          <Bar className="h-5 w-2/3" />
          <Bar className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Bar className="h-7 w-40" />
      <Bar className="h-4 w-64" />
    </div>
  );
}
