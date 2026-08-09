import { PageHeaderSkeleton } from "@/components/skeletons";

export default function ListingLoading() {
  return (
    <main className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <PageHeaderSkeleton />
        <div className="h-24 w-full animate-pulse rounded-md bg-line" />
        <div className="h-64 w-full animate-pulse rounded-md bg-line" />
      </div>
      <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
        <div className="h-32 w-full animate-pulse rounded-md bg-line" />
        <div className="h-72 w-full animate-pulse rounded-md bg-line" />
      </aside>
    </main>
  );
}
