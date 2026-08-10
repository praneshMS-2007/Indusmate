import { cache } from "react";
import type { AuctionDirection, Deal, Listing, Organisation } from "@prisma/client";

import { prisma } from "./prisma";
import { maskBids, type MaskedBid } from "./masking";

/**
 * The ONLY way bid data leaves the database.
 *
 * Nothing else queries prisma.bid for output. Routes and server components
 * call this, so masking cannot be forgotten at a call site — the query and the
 * filter are the same function.
 */
export interface ListingBidView {
  listing: Listing & { ownerOrg: Organisation };
  deal: Deal | null;
  bids: MaskedBid[];
  /** Is the viewer the listing owner? Drives which controls render. */
  isOwner: boolean;
  /** The viewer's own bid, if they have placed one. */
  ownBid: MaskedBid | null;
  /** Total bids received. A count is not an amount, so it is safe to show. */
  totalBids: number;
}

export const getListingBidView = cache(async (
  listingId: string,
  viewerOrgId: string,
): Promise<ListingBidView | null> => {
  const [listing, rawBids, deal] = await Promise.all([
    prisma.listing.findUnique({
      where: { id: listingId },
      include: { ownerOrg: true },
    }),
    prisma.bid.findMany({
      where: { listingId },
      include: { bidderOrg: true },
    }),
    prisma.deal.findFirst({ where: { listingId } }),
  ]);

  if (!listing) return null;

  const bids = maskBids(rawBids, viewerOrgId, {
    ownerOrgId: listing.ownerOrgId,
    dealState: deal?.state ?? null,
    winningBidId: deal?.winningBidId ?? null,
    direction: listing.direction as AuctionDirection,
  });

  return {
    listing,
    deal,
    bids,
    isOwner: listing.ownerOrgId === viewerOrgId,
    ownBid: bids.find((b) => b.isOwnBid) ?? null,
    // The raw count, not the masked count — the owner should see "3 sealed
    // bids" even though a bidder can only see their own.
    totalBids: rawBids.length,
  };
});

/** Deals the viewer is party to, newest first. */
export const getDealsForOrg = cache(async (orgId: string) => {
  return prisma.deal.findMany({
    where: { OR: [{ buyerOrgId: orgId }, { sellerOrgId: orgId }] },
    include: {
      listing: true,
      buyerOrg: true,
      sellerOrg: true,
      events: { orderBy: { createdAt: "asc" }, include: { actorOrg: true } },
      ratings: true,
    },
    orderBy: { updatedAt: "desc" },
  });
});

/**
 * Bids the viewer has placed, with the listing they were placed on.
 *
 * Safe by construction: every row is the viewer's own bid, so there is nothing
 * of anyone else's to mask. The counterparty on each listing is its owner,
 * who is public.
 */
export const getBidsForOrg = cache(async (orgId: string) => {
  return prisma.bid.findMany({
    where: { bidderOrgId: orgId },
    include: {
      listing: { include: { ownerOrg: true, deals: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
});
