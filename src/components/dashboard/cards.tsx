import Link from "next/link";
import {
  BadgeCheck,
  Compass,
  Gavel,
  Handshake,
  Lock,
  Package,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { Organisation } from "@prisma/client";

import type { DashboardData } from "@/lib/dashboard";
import { DEAL_STATE_LABEL } from "@/lib/deals";
import { LISTING_TYPE_META, type ListingType } from "@/lib/listing-spec";
import { rupees, rupeesShort, timeRemaining } from "@/lib/format";
import { BentoEmpty } from "@/components/bento";
import { Badge } from "@/components/ui/badge";

/** Shared row chrome, so six different cards cannot drift into six list styles. */
function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group -mx-2 flex min-w-0 items-center gap-3 rounded-sm px-2 py-2 transition-colors hover:bg-surface-overlay"
    >
      {children}
    </Link>
  );
}

function TypeDot({ type }: { type: ListingType }) {
  return (
    <span
      className="size-2 shrink-0 rounded-full"
      style={{ background: LISTING_TYPE_META[type].markerColor }}
      aria-hidden
    />
  );
}

/* ========================================================================== */
/* Decisions waiting — sealed bids sitting on MY listings                      */
/* ========================================================================== */

/**
 * The manufacturer's hero card, and the only screen in the app where money is
 * actually decided. Shows the COUNT of sealed bids per listing, never an
 * amount — this is a dashboard, and the amounts live behind the accept flow
 * where the masking rules are enforced.
 */
export function DecisionsWaitingCard({ data }: { data: DashboardData }) {
  const awaiting = data.myListings
    .filter((l) => (l.status === "OPEN" || l.status === "BIDDING") && l.bidCount > 0)
    .slice(0, 5);

  if (awaiting.length === 0) {
    return (
      <BentoEmpty icon={Gavel} action={{ label: "Post a listing", href: "/listings/new" }}>
        No sealed bids are waiting on you. When they arrive you will see the count here — never
        the amounts, until you open one.
      </BentoEmpty>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-line-subtle">
      {awaiting.map((l) => (
        <Row key={l.id} href={`/listings/${l.id}`}>
          <TypeDot type={l.type} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{l.title}</span>
            <span className="type-data block text-[11px] text-text-tertiary">
              {timeRemaining(l.closesAt)}
            </span>
          </span>
          <Badge variant="masked" className="shrink-0 gap-1">
            <Lock aria-hidden />
            {l.bidCount}
          </Badge>
        </Row>
      ))}
    </div>
  );
}

/* ========================================================================== */
/* My listings                                                                 */
/* ========================================================================== */

export function MyListingsCard({ data }: { data: DashboardData }) {
  const rows = data.myListings.slice(0, 5);

  if (rows.length === 0) {
    return (
      <BentoEmpty icon={Package} action={{ label: "Post your first listing", href: "/listings/new" }}>
        You have not posted anything yet. One form covers all five markets.
      </BentoEmpty>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-line-subtle">
      {rows.map((l) => (
        <Row key={l.id} href={`/listings/${l.id}`}>
          <TypeDot type={l.type} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">{l.title}</span>
            <span className="type-data block text-[11px] text-text-tertiary">
              {rupeesShort(l.referencePrice)}/{l.unit.replace("tonnes/month", "t/mo").replace("tonnes", "t")}
              {" · "}
              {l.bidCount} sealed
            </span>
          </span>
          <span className="type-data shrink-0 text-[11px] text-text-tertiary">
            {timeRemaining(l.closesAt)}
          </span>
        </Row>
      ))}
    </div>
  );
}

/* ========================================================================== */
/* My bids                                                                     */
/* ========================================================================== */

/**
 * The transporter's and recycler's working list. Their own amounts are shown
 * in full — a bidder may always see their own number; it is other people's
 * that are sealed.
 */
export function MyBidsCard({ data }: { data: DashboardData }) {
  const rows = data.myBids.slice(0, 5);

  if (rows.length === 0) {
    return (
      <BentoEmpty icon={Gavel} action={{ label: "Find something to bid on", href: "/browse" }}>
        You have no live bids. Your bid stays sealed — the owner sees your price and track record,
        never your name.
      </BentoEmpty>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-line-subtle">
      {rows.map((b) => (
        <Row key={b.id} href={`/listings/${b.listingId}`}>
          <TypeDot type={b.listingType} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">{b.listingTitle}</span>
            <span className="type-data block text-[11px] text-text-tertiary">
              {b.counterAmount !== null ? (
                <span className="text-amber">countered at {rupees(b.counterAmount)}</span>
              ) : b.dealState ? (
                <span className="text-teal">{DEAL_STATE_LABEL[b.dealState as keyof typeof DEAL_STATE_LABEL]}</span>
              ) : (
                timeRemaining(b.closesAt)
              )}
            </span>
          </span>
          <span className="type-data shrink-0 text-sm font-medium">{rupeesShort(b.amount)}</span>
        </Row>
      ))}
    </div>
  );
}

/* ========================================================================== */
/* Market feed                                                                 */
/* ========================================================================== */

/**
 * The transporter's and recycler's hero. Everything open in this role's home
 * markets, closing soonest first — because for a bidder the binding constraint
 * is always the clock.
 */
export function MarketFeedCard({ data, role }: { data: DashboardData; role: Organisation["type"] }) {
  const rows = data.marketFeed.slice(0, 6);

  if (rows.length === 0) {
    return (
      <BentoEmpty icon={Compass} action={{ label: "Browse every market", href: "/browse" }}>
        Nothing open in your usual markets right now. The other four are one tap away — you are
        not restricted to these.
      </BentoEmpty>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {rows.map((l) => {
        const reverse = l.direction === "REVERSE";
        return (
          <Link
            key={l.id}
            href={`/listings/${l.id}`}
            className="flex min-w-0 flex-col gap-1.5 rounded-md border border-line bg-surface p-3 transition-colors hover:border-amber/50"
          >
            <span className="flex items-center gap-1.5">
              <TypeDot type={l.type} />
              <span className="type-eyebrow truncate">{LISTING_TYPE_META[l.type].label}</span>
              {l.alreadyBid && (
                <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
                  bid placed
                </Badge>
              )}
            </span>
            <span className="line-clamp-2 text-sm leading-snug font-medium">{l.title}</span>
            <span className="truncate text-[11px] text-text-secondary">
              {l.locationCity}
              {l.destCity && ` → ${l.destCity}`}
            </span>
            <span className="mt-auto flex items-baseline justify-between gap-2 border-t border-line-subtle pt-2">
              <span className="type-data text-sm">
                {rupeesShort(l.referencePrice)}
                <span className="ml-1 inline-flex items-center text-[10px] text-text-tertiary">
                  {reverse ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
                </span>
              </span>
              <span className="type-data text-[11px] text-amber">{timeRemaining(l.closesAt)}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/* ========================================================================== */
/* Active deals                                                                */
/* ========================================================================== */

export function ActiveDealsCard({ data }: { data: DashboardData }) {
  const rows = data.activeDeals.slice(0, 5);

  if (rows.length === 0) {
    return (
      <BentoEmpty icon={Handshake} action={{ label: "See closed deals", href: "/deals" }}>
        Nothing in flight. A deal appears the moment a sealed bid is accepted — and that is when
        identities are released.
      </BentoEmpty>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-line-subtle">
      {rows.map((d) => (
        <Row key={d.id} href="/deals">
          <TypeDot type={d.listingType} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">{d.listingTitle}</span>
            <span className="type-eyebrow block">
              {DEAL_STATE_LABEL[d.state as keyof typeof DEAL_STATE_LABEL]} ·{" "}
              {d.isBuyer ? "you are buying" : "you are supplying"}
            </span>
          </span>
          <span className="type-data shrink-0 text-sm text-teal">{rupeesShort(d.price)}</span>
        </Row>
      ))}
    </div>
  );
}

/* ========================================================================== */
/* Reputation                                                                  */
/* ========================================================================== */

/**
 * A bidder's reputation is the ONLY thing a listing owner can see about them
 * while bidding is sealed. So it is not a vanity panel — it is the entire
 * basis on which this organisation gets chosen, and it belongs on the
 * dashboard rather than buried in a profile page nobody opens.
 */
export function ReputationCard({ org }: { org: Organisation }) {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <span className="type-data text-3xl leading-none font-semibold text-amber">
          {org.rating.toFixed(1)}
        </span>
        <span className="type-data text-sm text-text-tertiary">/5</span>
        {org.verified && (
          <span className="ml-auto flex items-center gap-1 text-xs text-teal">
            <BadgeCheck className="size-3.5" aria-hidden />
            Verified
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <dt className="text-text-tertiary">Deals closed</dt>
          <dd className="type-data text-base">{org.dealCount}</dd>
        </div>
        <div>
          <dt className="text-text-tertiary">On-time</dt>
          <dd className="type-data text-base">{org.onTimePct}%</dd>
        </div>
      </dl>

      <p className="mt-auto flex items-start gap-1.5 border-t border-line-subtle pt-3 text-[11px] text-text-secondary">
        <Star className="mt-0.5 size-3 shrink-0 fill-amber text-amber" aria-hidden />
        <span>
          While your bid is sealed this is all a counterparty sees. They choose on this, then find
          out who you are.
        </span>
      </p>
    </div>
  );
}
