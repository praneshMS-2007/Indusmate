import Link from "next/link";
import { ArrowRight, Clock, Gavel, MapPin, TrendingDown, TrendingUp } from "lucide-react";
import type { Listing } from "@prisma/client";

import { LISTING_TYPE_META, type ListingType } from "@/lib/listing-spec";
import { formatWindow, rupeesShort, timeRemaining } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT = {
  OPEN: "outline",
  BIDDING: "default",
  AWARDED: "verified",
  CLOSED: "muted",
  CANCELLED: "muted",
  EXPIRED: "muted",
} as const;

const STATUS_LABEL = {
  OPEN: "Open",
  BIDDING: "Bidding",
  AWARDED: "Awarded",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
} as const;

/**
 * One card renders every market. There is no FreightCard or ByproductCard —
 * the market is a badge and the spec is summarised generically. The thesis,
 * visible in the feed.
 */
export function ListingCard({ listing, bidCount }: { listing: Listing; bidCount: number }) {
  const meta = LISTING_TYPE_META[listing.type as ListingType];
  const reverse = listing.direction === "REVERSE";
  const closed = new Date(listing.closesAt).getTime() <= Date.now();

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-4 transition-colors hover:border-amber/50"
    >
      <div className="flex flex-wrap items-start gap-1.5">
        <Badge variant="outline" className={meta.badgeClass}>
          {meta.label}
        </Badge>
        <Badge variant="secondary" className="gap-1">
          {reverse ? <TrendingDown /> : <TrendingUp />}
          {reverse ? "Reverse" : "Forward"}
        </Badge>
        <Badge variant={STATUS_VARIANT[listing.status]} className="ml-auto">
          {STATUS_LABEL[listing.status]}
        </Badge>
      </div>

      <h3 className="leading-snug font-medium">{listing.title}</h3>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-text-secondary">
        <div className="col-span-2 flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {listing.locationCity}
            {listing.destCity && ` → ${listing.destCity}`}
          </span>
        </div>
        <div className="type-data flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" />
          {formatWindow(listing.windowStart, listing.windowEnd)}
        </div>
        <div className="flex items-center gap-1.5">
          <Gavel className="size-3.5 shrink-0" />
          <span className="type-data">{bidCount}</span>
          {bidCount === 1 ? "sealed bid" : "sealed bids"}
        </div>
      </dl>

      <div className="mt-auto flex items-end justify-between gap-2 border-t border-line-subtle pt-3">
        <div>
          <p className="type-eyebrow">{reverse ? "Budget" : "Asking"}</p>
          <p className="type-data text-lg leading-tight">
            {rupeesShort(listing.referencePrice)}
            <span className="ml-1 text-xs text-text-tertiary">
              / {listing.unit.replace("tonnes/month", "t/mo").replace("tonnes", "t")}
            </span>
          </p>
        </div>
        <span
          className={
            "type-data flex items-center gap-1 text-xs " +
            (closed ? "text-text-tertiary" : "text-amber")
          }
        >
          {timeRemaining(listing.closesAt)}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
