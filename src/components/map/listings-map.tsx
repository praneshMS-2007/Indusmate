"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

import { LISTING_TYPE_META, LISTING_TYPES } from "@/lib/listing-spec";
import type { MapListing } from "./listings-map-inner";

/**
 * Leaflet reaches for `window` the moment it is imported, so it cannot be
 * part of the server-rendered bundle at all — not lazy after mount, not
 * behind a client component alone. `ssr: false` here is required, not an
 * optimisation (see CLAUDE.md).
 */
const ListingsMapInner = dynamic(
  () => import("./listings-map-inner").then((m) => m.ListingsMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center gap-2 text-sm text-text-secondary">
        <Loader2 className="size-4 animate-spin" />
        Loading map…
      </div>
    ),
  },
);

export function ListingsMap({ listings }: { listings: MapListing[] }) {
  return (
    <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden rounded-md border border-line">
      <ListingsMapInner listings={listings} />

      <div className="pointer-events-none absolute right-3 bottom-3 z-[1000] flex flex-col gap-1 rounded-md border border-line bg-surface-raised/95 p-2.5 text-xs backdrop-blur-sm">
        {LISTING_TYPES.map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: LISTING_TYPE_META[t].markerColor }}
              aria-hidden
            />
            {LISTING_TYPE_META[t].label}
          </span>
        ))}
      </div>
    </div>
  );
}

export type { MapListing };
