import Link from "next/link";
import { ArrowRight, Lock, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrg } from "@/lib/auth";
import { LISTING_TYPE_META, type ListingType } from "@/lib/listing-spec";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const [org, byType, openCount, dealCount] = await Promise.all([
    getCurrentOrg(),
    prisma.listing.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.listing.count({ where: { status: { in: ["OPEN", "BIDDING"] } } }),
    prisma.deal.count(),
  ]);

  const counts = new Map(byType.map((r) => [r.type as ListingType, r._count._all]));

  return (
    <main className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <p className="type-eyebrow">
          Acting as {org.name} · {org.city}
        </p>
        <h1 className="type-display text-3xl sm:text-5xl">
          One negotiation engine.
          <br />
          <span className="text-amber">Five industrial markets.</span>
        </h1>
        <p className="max-w-prose text-sm text-text-secondary sm:text-base">
          A raw material lot, a waste stream, an idle machine-hour, a technician&apos;s shift and a
          truck&apos;s return leg are the same object: a capacity with a spec, a location, a time
          window, and a price nobody has agreed yet. So they are one table and one state machine.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild>
            <Link href="/browse">
              Browse {openCount} open listings
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/listings/new">
              <Plus className="size-4" />
              Post a listing
            </Link>
          </Button>
          {dealCount > 0 && (
            <Button asChild variant="ghost">
              <Link href="/deals">
                <span className="type-data">{dealCount}</span>
                &nbsp;deals in flight
              </Link>
            </Button>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(LISTING_TYPE_META) as ListingType[]).map((type) => {
          const meta = LISTING_TYPE_META[type];
          return (
            <Link
              key={type}
              href={`/browse?type=${type}`}
              className="group rounded-md border border-line bg-surface-raised p-4 transition-colors hover:border-amber/50"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-medium">{meta.label}</h2>
                <span className="type-data text-sm text-text-tertiary">
                  {counts.get(type) ?? 0}
                </span>
              </div>
              <p className="mt-1 text-xs text-text-secondary">{meta.blurb}</p>
              <p className="type-eyebrow mt-2">
                {meta.defaultDirection === "REVERSE"
                  ? "Reverse · price competes down"
                  : "Forward · price competes up"}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-md border border-masked/30 bg-masked-muted/40 p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="size-4 text-masked" />
          Bidding here is sealed
        </h2>
        <p className="mt-1 max-w-prose text-sm text-text-secondary">
          No bidder can see another bidder&apos;s number. The listing owner sees reputation without
          identity — a handle, a rating, a completion record. Names, contacts and GSTIN are released
          to both sides only once a deal is accepted.
        </p>
      </section>
    </main>
  );
}
