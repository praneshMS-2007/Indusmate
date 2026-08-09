import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

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
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="text-foreground">{org.name}</span> · {org.city}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          One negotiation engine.
          <br />
          <span className="text-amber-400">Five industrial markets.</span>
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground sm:text-base">
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
            <Link href="/deals">{dealCount} deals in flight</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(LISTING_TYPE_META) as ListingType[]).map((type) => {
          const meta = LISTING_TYPE_META[type];
          return (
            <Link
              key={type}
              href={`/browse?type=${type}`}
              className="group rounded-lg border border-border/60 bg-card p-4 transition-colors hover:border-amber-500/50"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-medium">{meta.label}</h2>
                <span className="font-mono text-sm text-muted-foreground">
                  {counts.get(type) ?? 0}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{meta.blurb}</p>
              <p className="mt-2 text-[11px] tracking-wide text-muted-foreground/70 uppercase">
                {meta.defaultDirection === "REVERSE"
                  ? "Reverse auction · price competes down"
                  : "Forward auction · price competes up"}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="size-4 text-teal-400" />
          Bidding here is sealed
        </h2>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          No bidder can see another bidder&apos;s number. The listing owner sees reputation without
          identity — a handle, a rating, a completion record. Names, contacts and GSTIN are released
          to both sides only once a deal is accepted.
        </p>
      </section>
    </main>
  );
}
