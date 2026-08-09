import Link from "next/link";
import { Plus, SearchX } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { LISTING_TYPES, LISTING_TYPE_META, type ListingType } from "@/lib/listing-spec";
import { BrowseFilters } from "@/components/browse-filters";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";

const STATUSES = ["OPEN", "BIDDING", "AWARDED", "CLOSED", "CANCELLED", "EXPIRED"];

/**
 * Say what the operator actually filtered by, rather than "No results".
 * An empty state has one job: explain why the screen is empty and what to do
 * next. Naming the filters does the first half for free.
 */
function describeFilters(type?: string, city?: string, status?: string): string {
  const parts: string[] = [];
  if (type) parts.push(LISTING_TYPE_META[type as ListingType].label.toLowerCase());
  if (city) parts.push(`in ${city}`);
  if (status) parts.push(`with status ${status.toLowerCase()}`);
  return parts.length > 0 ? parts.join(" ") : "this view";
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; city?: string; status?: string }>;
}) {
  const sp = await searchParams;

  // Only trust values that match the enums — a hand-edited query string must
  // not reach Prisma.
  const type = LISTING_TYPES.includes(sp.type as ListingType)
    ? (sp.type as ListingType)
    : undefined;
  const status = STATUSES.includes(sp.status ?? "") ? sp.status : undefined;
  const city = sp.city?.trim() || undefined;

  const where: Prisma.ListingWhereInput = {
    ...(type && { type }),
    ...(status && { status: status as Prisma.ListingWhereInput["status"] }),
    ...(city && { OR: [{ locationCity: city }, { destCity: city }] }),
  };

  const [listings, cityRows] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { _count: { select: { bids: true } } },
      orderBy: [{ status: "asc" }, { closesAt: "asc" }],
    }),
    prisma.listing.findMany({
      select: { locationCity: true },
      distinct: ["locationCity"],
      orderBy: { locationCity: "asc" },
    }),
  ]);

  const cities = cityRows.map((r) => r.locationCity);

  return (
    <main className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="type-display text-2xl">Browse</h1>
          <p className="text-sm text-text-secondary">
            Five markets, one feed. Same table, same engine, different spec.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/listings/new">
            <Plus className="size-4" />
            Post a listing
          </Link>
        </Button>
      </div>

      <BrowseFilters cities={cities} active={{ type, city, status }} />

      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-line-strong py-16 text-center">
          <SearchX className="size-8 text-text-tertiary" />
          <div>
            <p className="font-medium">Nothing open in {describeFilters(type, city, status)}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-text-secondary">
              Widen the filters to see more, or post the first listing here — every market runs on
              the same form.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/browse">Show everything</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/listings/new${type ? `?type=${type}` : ""}`}>
                <Plus className="size-4" />
                Post a listing
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="type-data text-xs text-text-tertiary">
            {listings.length} {listings.length === 1 ? "listing" : "listings"}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} bidCount={l._count.bids} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
