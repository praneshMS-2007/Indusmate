import { Skeleton } from "@/components/ui/skeleton";

export default function BrowseLoading() {
  return (
    <main className="flex flex-col gap-5">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-9 w-full" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-52 w-full rounded-lg" />
        ))}
      </div>
    </main>
  );
}
