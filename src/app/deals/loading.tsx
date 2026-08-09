import { ListSkeleton, PageHeaderSkeleton } from "@/components/skeletons";

export default function DealsLoading() {
  return (
    <main className="flex flex-col gap-5">
      <PageHeaderSkeleton />
      <ListSkeleton count={3} />
    </main>
  );
}
