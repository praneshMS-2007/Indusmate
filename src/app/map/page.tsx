import { Map as MapIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { ListingsMap, type MapListing } from "@/components/map/listings-map";
import type { ListingType } from "@/lib/listing-spec";

/**
 * Every open or bidding listing across the MP industrial corridor, on one
 * map. Nothing here is bid data — a listing's location, price and owner are
 * already public on its detail page, so this view needs no masking pass.
 */
export default async function MapPage() {
  const listings = await prisma.listing.findMany({
    where: { status: { in: ["OPEN", "BIDDING"] } },
    include: { ownerOrg: { select: { name: true } } },
    orderBy: { closesAt: "asc" },
  });

  const mapListings: MapListing[] = listings.map((l) => ({
    id: l.id,
    type: l.type as ListingType,
    title: l.title,
    status: l.status,
    direction: l.direction as "REVERSE" | "FORWARD",
    locationCity: l.locationCity,
    locationLat: l.locationLat,
    locationLng: l.locationLng,
    destCity: l.destCity,
    destLat: l.destLat,
    destLng: l.destLng,
    referencePrice: l.referencePrice,
    unit: l.unit,
    closesAt: l.closesAt.toISOString(),
    ownerName: l.ownerOrg.name,
  }));

  return (
    <main className="flex flex-col gap-5">
      <div>
        <h1 className="type-display flex items-center gap-2 text-2xl">
          <MapIcon className="size-5 text-amber" />
          Map
        </h1>
        <p className="text-sm text-text-secondary">
          {mapListings.length} open {mapListings.length === 1 ? "listing" : "listings"} across the
          MP industrial corridor. Freight legs show as a line from pickup to drop.
        </p>
      </div>

      {mapListings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-line-strong py-16 text-center">
          <MapIcon className="size-8 text-text-tertiary" />
          <p className="font-medium">Nothing open right now</p>
          <p className="mx-auto max-w-sm text-sm text-text-secondary">
            Listings appear here the moment they open, wherever they sit on the corridor.
          </p>
        </div>
      ) : (
        <ListingsMap listings={mapListings} />
      )}
    </main>
  );
}
