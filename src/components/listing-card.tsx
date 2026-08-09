import Link from "next/link";
import { ArrowRight, Clock, Gavel, MapPin, TrendingDown, TrendingUp } from "lucide-react";
import type { Listing } from "@prisma/client";

import { LISTING_TYPE_META, type ListingType } from "@/lib/listing-spec";
import { formatWindow, rupeesShort, timeRemaining } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

/**
 * One card renders every market. There is no FreightCard or ByproductCard —
 * the type is a badge and the spec is summarised generically. That is the
 * thesis made visible in the feed.
 */
export function ListingCard({
  listing,
  bidCount,
}: {
  listing: Listing;
  bidCount: number;
}) {
  const meta = LISTING_TYPE_META[listing.type as ListingType];
  const reverse = listing.direction === "REVERSE";
  const closed = new Date(listing.closesAt).getTime() <= Date.now();

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4 transition-colors hover:border-amber-500/50"
    >
      <div className="flex flex-wrap items-start gap-2">
        <Badge variant="outline" className={meta.badgeClass}>
          {meta.label}
        </Badge>
        <Badge variant="secondary" className="gap-1 text-[11px]">
          {reverse ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
          {reverse ? "Reverse" : "Forward"}
        </Badge>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{listing.status}</span>
      </div>

      <h3 className="leading-snug font-medium">{listing.title}</h3>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <div className="col-span-2 flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {listing.locationCity}
            {listing.destCity && ` → ${listing.destCity}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" />
          {formatWindow(listing.windowStart, listing.windowEnd)}
        </div>
        <div className="flex items-center gap-1.5">
          <Gavel className="size-3.5 shrink-0" />
          {bidCount} {bidCount === 1 ? "bid" : "bids"}
        </div>
      </dl>

      <div className="mt-auto flex items-end justify-between gap-2 border-t border-border/40 pt-3">
        <div>
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
            {reverse ? "Budget" : "Asking"}
          </p>
          <p className="font-mono text-lg leading-tight">
            {rupeesShort(listing.referencePrice)}
            <span className="ml-1 text-xs text-muted-foreground">
              / {listing.unit.replace("tonnes/month", "t/mo").replace("tonnes", "t")}
            </span>
          </p>
        </div>
        <span
          className={
            "flex items-center gap-1 text-xs " +
            (closed ? "text-muted-foreground/60" : "text-amber-400")
          }
        >
          {timeRemaining(listing.closesAt)}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
