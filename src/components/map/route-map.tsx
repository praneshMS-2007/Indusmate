"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const RouteMapInner = dynamic(() => import("./route-map-inner").then((m) => m.RouteMapInner), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center gap-2 text-sm text-text-secondary">
      <Loader2 className="size-4 animate-spin" />
      Loading route…
    </div>
  ),
});

/** Small embedded pickup-to-drop map for a single freight leg. */
export function RouteMap(props: {
  origin: [number, number];
  originLabel: string;
  destination: [number, number];
  destinationLabel: string;
}) {
  return (
    <div className="h-48 w-full overflow-hidden rounded-md border border-line">
      <RouteMapInner {...props} />
    </div>
  );
}
