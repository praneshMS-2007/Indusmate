import { MapSkeleton, PageHeaderSkeleton } from "@/components/skeletons";

export default function MapLoading() {
  return (
    <main className="flex flex-col gap-5">
      <PageHeaderSkeleton />
      <MapSkeleton />
    </main>
  );
}
