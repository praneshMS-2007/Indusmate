/**
 * Dashboard data for one organisation.
 *
 * ONE query bundle serving all four role lenses. There is no
 * getTransporterDashboard() and no getSupplierDashboard() — the queries are
 * identical for everyone, and the role only decides which of the results get
 * rendered and in what order. That is the same discipline as one Listing table
 * for five markets, applied one layer up.
 *
 * MASKING: the only bid data leaving here is (a) counts of bids on the
 * viewer's OWN listings, and (b) the viewer's OWN bids. A count is not an
 * amount, and your own bid is yours to see. No rival's amount and no
 * counterparty identity is ever loaded, so there is nothing here for maskBid()
 * to strip — the safety comes from what is not queried, which is stronger than
 * filtering after the fact.
 */

import { cache } from "react";
import type { Organisation } from "@prisma/client";

import { prisma } from "./prisma";
import { ROLE_META, type KpiId } from "./roles";
import type { ListingType } from "./listing-spec";

export interface DashboardData {
  /** Listings the viewer owns that are still taking bids. */
  myListings: Array<{
    id: string;
    title: string;
    type: ListingType;
    status: string;
    closesAt: Date;
    referencePrice: number;
    unit: string;
    locationCity: string;
    destCity: string | null;
    bidCount: number;
  }>;
  /** The viewer's own bids on other people's listings. */
  myBids: Array<{
    id: string;
    amount: number;
    status: string;
    listingId: string;
    listingTitle: string;
    listingType: ListingType;
    closesAt: Date;
    counterAmount: number | null;
    /** Set once this bid produced a deal. */
    dealState: string | null;
  }>;
  /** Open listings in the viewer's home markets that they do not own. */
  marketFeed: Array<{
    id: string;
    title: string;
    type: ListingType;
    direction: string;
    locationCity: string;
    destCity: string | null;
    referencePrice: number;
    unit: string;
    closesAt: Date;
    bidCount: number;
    /** True when the viewer has already bid — stops them double-taking it. */
    alreadyBid: boolean;
  }>;
  /** Deals the viewer is party to that have not reached a terminal state. */
  activeDeals: Array<{
    id: string;
    state: string;
    price: number;
    listingTitle: string;
    listingType: ListingType;
    /** Is the viewer the buyer on this deal? Drives "you owe / they owe". */
    isBuyer: boolean;
  }>;
  kpis: Record<KpiId, number>;
}

const TERMINAL_STATES = ["REJECTED", "CANCELLED", "EXPIRED", "RATED"];

export const getDashboardData = cache(async (org: Organisation): Promise<DashboardData> => {
  const homeMarkets = ROLE_META[org.type].homeMarkets;

  const [ownListings, ownBids, feedListings, deals] = await Promise.all([
    prisma.listing.findMany({
      where: { ownerOrgId: org.id },
      include: { _count: { select: { bids: true } } },
      orderBy: [{ status: "asc" }, { closesAt: "asc" }],
    }),

    prisma.bid.findMany({
      where: { bidderOrgId: org.id },
      include: { listing: { include: { deals: true } } },
      orderBy: { updatedAt: "desc" },
    }),

    prisma.listing.findMany({
      where: {
        status: { in: ["OPEN", "BIDDING"] },
        ownerOrgId: { not: org.id },
        type: { in: homeMarkets },
      },
      include: {
        _count: { select: { bids: true } },
        // Only the viewer's own bid — a rival's row is never loaded.
        bids: { where: { bidderOrgId: org.id }, select: { id: true } },
      },
      orderBy: { closesAt: "asc" },
      take: 12,
    }),

    prisma.deal.findMany({
      where: { OR: [{ buyerOrgId: org.id }, { sellerOrgId: org.id }] },
      include: { listing: { select: { title: true, type: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const myListings = ownListings.map((l) => ({
    id: l.id,
    title: l.title,
    type: l.type as ListingType,
    status: l.status,
    closesAt: l.closesAt,
    referencePrice: l.referencePrice,
    unit: l.unit,
    locationCity: l.locationCity,
    destCity: l.destCity,
    bidCount: l._count.bids,
  }));

  const myBids = ownBids.map((b) => ({
    id: b.id,
    amount: b.amount,
    status: b.status,
    listingId: b.listingId,
    listingTitle: b.listing.title,
    listingType: b.listing.type as ListingType,
    closesAt: b.listing.closesAt,
    counterAmount: b.counterAmount,
    dealState: b.listing.deals.find((d) => d.winningBidId === b.id)?.state ?? null,
  }));

  const marketFeed = feedListings.map((l) => ({
    id: l.id,
    title: l.title,
    type: l.type as ListingType,
    direction: l.direction,
    locationCity: l.locationCity,
    destCity: l.destCity,
    referencePrice: l.referencePrice,
    unit: l.unit,
    closesAt: l.closesAt,
    bidCount: l._count.bids,
    alreadyBid: l.bids.length > 0,
  }));

  const activeDeals = deals
    .filter((d) => !TERMINAL_STATES.includes(d.state))
    .map((d) => ({
      id: d.id,
      state: d.state,
      price: d.price,
      listingTitle: d.listing.title,
      listingType: d.listing.type as ListingType,
      isBuyer: d.buyerOrgId === org.id,
    }));

  // --- KPIs ---------------------------------------------------------------
  // Computed for every role, rendered by four. Cheap, and it keeps the role
  // config declarative — a role names four KPI ids and gets them, with no
  // conditional fetching to keep in sync.
  const liveListings = myListings.filter((l) => l.status === "OPEN" || l.status === "BIDDING");
  const sealedInbound = liveListings.reduce((n, l) => n + l.bidCount, 0);
  const liveBids = myBids.filter((b) => b.status === "ACTIVE" || b.status === "COUNTERED");
  const wonBids = myBids.filter((b) => b.status === "ACCEPTED").length;

  const kpis: Record<KpiId, number> = {
    "open-listings-mine": liveListings.length,
    "sealed-bids-inbound": sealedInbound,
    "my-live-bids": liveBids.length,
    "deals-in-flight": activeDeals.length,
    "deals-to-fulfil": activeDeals.filter((d) => !d.isBuyer).length,
    "market-open-now": marketFeed.length,
    "on-time-pct": org.onTimePct,
    "rating": org.rating,
    "win-rate": myBids.length > 0 ? Math.round((wonBids / myBids.length) * 100) : 0,
  };

  return { myListings, myBids, marketFeed, activeDeals, kpis };
});
