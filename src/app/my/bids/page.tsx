import Link from "next/link";
import { ArrowRight, Gavel, Lock } from "lucide-react";

import { getCurrentOrg } from "@/lib/auth";
import { getBidsForOrg } from "@/lib/bid-queries";
import { rupees, timeRemaining } from "@/lib/format";
import { LISTING_TYPE_META, type ListingType } from "@/lib/listing-spec";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_VARIANT = {
  ACTIVE: "default",
  COUNTERED: "warning",
  ACCEPTED: "verified",
  REJECTED: "muted",
  WITHDRAWN: "muted",
} as const;

const STATUS_LABEL = {
  ACTIVE: "Live",
  COUNTERED: "Counter received",
  ACCEPTED: "Won",
  REJECTED: "Not selected",
  WITHDRAWN: "Withdrawn",
} as const;

export default async function MyBidsPage() {
  const org = await getCurrentOrg();
  const bids = await getBidsForOrg(org.id);

  return (
    <main className="flex flex-col gap-5">
      <div>
        <h1 className="type-display text-2xl">My bids</h1>
        <p className="text-sm text-text-secondary">
          Bids placed by <span className="text-text-primary">{org.name}</span>. You will never see
          anyone else&apos;s.
        </p>
      </div>

      {bids.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-line-strong py-16 text-center">
          <Gavel className="size-8 text-text-tertiary" />
          <div>
            <p className="font-medium">You have not bid on anything yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-text-secondary">
              Bidding is sealed — the listing owner sees your price and track record, never your
              name, until they accept.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/browse">Find something to bid on</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bids.map((bid) => {
            const meta = LISTING_TYPE_META[bid.listing.type as ListingType];
            const won = bid.status === "ACCEPTED";
            return (
              <Link
                key={bid.id}
                href={`/listings/${bid.listingId}`}
                className="group flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-4 transition-colors hover:border-amber/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={meta.badgeClass}>
                    {meta.label}
                  </Badge>
                  <Badge variant={STATUS_VARIANT[bid.status]}>{STATUS_LABEL[bid.status]}</Badge>
                  {!won && bid.status !== "REJECTED" && (
                    <Badge variant="masked" className="gap-1">
                      <Lock />
                      Sealed
                    </Badge>
                  )}
                  <span className="type-data ml-auto text-xs text-text-tertiary">
                    {timeRemaining(bid.listing.closesAt)}
                  </span>
                </div>

                <h2 className="leading-snug font-medium group-hover:text-amber">
                  {bid.listing.title}
                  <ArrowRight className="ml-1 inline size-3.5 transition-transform group-hover:translate-x-0.5" />
                </h2>

                <div className="flex flex-wrap items-end justify-between gap-3 border-t border-line-subtle pt-3">
                  <div>
                    <p className="type-eyebrow">Your bid</p>
                    <p className="type-data text-lg">{rupees(bid.amount)}</p>
                  </div>

                  {bid.counterAmount !== null && (
                    <div>
                      <p className="type-eyebrow">They countered</p>
                      <p className="type-data text-lg text-amber">{rupees(bid.counterAmount)}</p>
                    </div>
                  )}

                  <div className="text-right">
                    <p className="type-eyebrow">Listed by</p>
                    <p className="text-sm">{bid.listing.ownerOrg.name}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
