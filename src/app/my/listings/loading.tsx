import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/skeletons";

export default function MyListingsLoading() {
  return (
    <main className="flex flex-col gap-5">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={3} />
    </main>
  );
}
