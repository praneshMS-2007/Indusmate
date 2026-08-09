import {
  BidStatus,
  CounterParty,
  DealState,
  ListingStatus,
  type Bid,
  type Deal,
  type Listing,
} from "@prisma/client";

import { prisma } from "./prisma";

/**
 * Bid lifecycle: placement, counter-offers, and the decision gateway.
 *
 * THE COUNTER MODEL
 *   bid.amount        the bidder's current offer — always the live number
 *   bid.counterAmount the owner's outstanding counter, or null
 *   bid.counterBy     who moved last, so the UI knows whose turn it is
 *
 *   1. Bidder places at X                     status ACTIVE
 *   2. Owner counters at Y                    status COUNTERED, counterBy OWNER
 *   3a. Bidder accepts Y   -> deal at Y
 *   3b. Bidder re-counters at Z               status ACTIVE, counterBy BIDDER
 *   4. Owner accepts       -> deal at bid.amount
 *
 * Agreement is formed by whoever accepts the other side's standing number, so
 * both 3a and 4 create the deal. Everything after that goes through
 * transitionDeal().
 */

export class BidError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "BidError";
    this.status = status;
  }
}

/**
 * In a REVERSE auction the listing owner is buying and bidders are selling
 * (freight, tenders, labour). In a FORWARD auction it is the other way round
 * (scarce byproducts, equipment hire). One flag, both directions, same engine.
 */
export function partiesFor(listing: Listing, bidderOrgId: string) {
  return listing.direction === "REVERSE"
    ? { buyerOrgId: listing.ownerOrgId, sellerOrgId: bidderOrgId }
    : { buyerOrgId: bidderOrgId, sellerOrgId: listing.ownerOrgId };
}

/** A listing still open to bids? */
function assertOpenForBidding(listing: Listing) {
  if (listing.status !== ListingStatus.OPEN && listing.status !== ListingStatus.BIDDING) {
    throw new BidError(`This listing is ${listing.status.toLowerCase()} and is no longer taking bids`, 409);
  }
  if (new Date(listing.closesAt).getTime() <= Date.now()) {
    throw new BidError("Bidding on this listing has closed", 409);
  }
}

// ---------------------------------------------------------------------------
// Placing a bid
// ---------------------------------------------------------------------------

export async function placeBid(input: {
  listingId: string;
  bidderOrgId: string;
  amount: number;
  message?: string | null;
}): Promise<Bid> {
  const { listingId, bidderOrgId, amount } = input;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new BidError("Enter an amount above ₹0");
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new BidError("Listing not found", 404);

  // You cannot bid on your own listing. Without this, an owner could inflate a
  // forward auction or undercut a reverse one from a second account.
  if (listing.ownerOrgId === bidderOrgId) {
    throw new BidError("You cannot bid on your own listing", 403);
  }

  assertOpenForBidding(listing);

  // One active bid per organisation per listing — enforced by a unique index
  // on (listingId, bidderOrgId), so a double-submit updates rather than
  // creating a second row. The database is the guard, not this function.
  const [bid] = await prisma.$transaction([
    prisma.bid.upsert({
      where: { listingId_bidderOrgId: { listingId, bidderOrgId } },
      create: {
        listingId,
        bidderOrgId,
        amount: Math.round(amount),
        message: input.message?.trim() || null,
        status: BidStatus.ACTIVE,
      },
      update: {
        amount: Math.round(amount),
        message: input.message?.trim() || null,
        status: BidStatus.ACTIVE,
        // Revising your offer clears the owner's outstanding counter — it was
        // a response to a number that no longer stands.
        counterAmount: null,
        counterBy: CounterParty.BIDDER,
        counterNote: null,
      },
    }),
    // First bid moves the listing from OPEN to BIDDING.
    prisma.listing.update({
      where: { id: listingId },
      data: { status: ListingStatus.BIDDING },
    }),
  ]);

  return bid;
}

// ---------------------------------------------------------------------------
// Counter-offers
// ---------------------------------------------------------------------------

/** The listing owner counters a bid. Identity stays sealed throughout. */
export async function counterBid(input: {
  bidId: string;
  actorOrgId: string;
  counterAmount: number;
  note?: string | null;
}): Promise<Bid> {
  const bid = await prisma.bid.findUnique({
    where: { id: input.bidId },
    include: { listing: true },
  });
  if (!bid) throw new BidError("Bid not found", 404);

  if (bid.listing.ownerOrgId !== input.actorOrgId) {
    throw new BidError("Only the listing owner can counter a bid", 403);
  }
  if (bid.status !== BidStatus.ACTIVE) {
    throw new BidError(`Cannot counter a bid that is ${bid.status.toLowerCase()}`, 409);
  }
  if (!Number.isFinite(input.counterAmount) || input.counterAmount <= 0) {
    throw new BidError("Enter a counter amount above ₹0");
  }

  return prisma.bid.update({
    where: { id: input.bidId },
    data: {
      counterAmount: Math.round(input.counterAmount),
      counterBy: CounterParty.OWNER,
      counterNote: input.note?.trim() || null,
      status: BidStatus.COUNTERED,
    },
  });
}

/** The bidder re-counters the owner's counter. */
export async function recounterBid(input: {
  bidId: string;
  actorOrgId: string;
  amount: number;
  message?: string | null;
}): Promise<Bid> {
  const bid = await prisma.bid.findUnique({ where: { id: input.bidId } });
  if (!bid) throw new BidError("Bid not found", 404);

  if (bid.bidderOrgId !== input.actorOrgId) {
    throw new BidError("Only the bidder can respond to this counter", 403);
  }
  if (bid.status !== BidStatus.COUNTERED) {
    throw new BidError("There is no counter-offer to respond to", 409);
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new BidError("Enter an amount above ₹0");
  }

  return prisma.bid.update({
    where: { id: input.bidId },
    data: {
      amount: Math.round(input.amount),
      message: input.message?.trim() || bid.message,
      counterAmount: null,
      counterBy: CounterParty.BIDDER,
      counterNote: null,
      status: BidStatus.ACTIVE,
    },
  });
}

// ---------------------------------------------------------------------------
// The decision gateway — where identity is released
// ---------------------------------------------------------------------------

/**
 * Create the Deal.
 *
 * This is THE moment of the product: the deal comes into existence at
 * ACCEPTED, and only from here do the API responses carry real identities.
 *
 * The pre-acceptance path (LISTED -> BIDDING -> [COUNTERED] -> ACCEPTED) is
 * written into the audit log here, so the deal's history reads as a complete
 * chain even though no Deal row existed while bidding was open.
 *
 * Everything is one transaction: create the deal, mark the winning bid, reject
 * the losers, close the listing, write the history. A partial result would
 * leave a listing awarded with no deal, or a deal with rival bids still live.
 */
async function createDealFromBid(input: {
  bidId: string;
  price: number;
  acceptedByOrgId: string;
  hadCounter: boolean;
}): Promise<Deal> {
  const bid = await prisma.bid.findUnique({
    where: { id: input.bidId },
    include: { listing: true },
  });
  if (!bid) throw new BidError("Bid not found", 404);

  const { listing } = bid;
  const parties = partiesFor(listing, bid.bidderOrgId);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    // Guard against a double-accept racing through: if a deal already exists
    // for this listing, stop.
    const existing = await tx.deal.findFirst({ where: { listingId: listing.id } });
    if (existing) {
      throw new BidError("This listing has already been awarded", 409);
    }

    const deal = await tx.deal.create({
      data: {
        listingId: listing.id,
        buyerOrgId: parties.buyerOrgId,
        sellerOrgId: parties.sellerOrgId,
        winningBidId: bid.id,
        price: Math.round(input.price),
        state: DealState.ACCEPTED,
      },
    });

    // Backfill the path that got us here, so the audit log is a complete
    // chain from LISTED rather than starting mid-story.
    const history: Array<{
      fromState: DealState | null;
      toState: DealState;
      actorOrgId: string;
      note: string;
    }> = [
      {
        fromState: DealState.LISTED,
        toState: DealState.BIDDING,
        actorOrgId: bid.bidderOrgId,
        note: "Sealed bid submitted",
      },
    ];

    if (input.hadCounter) {
      history.push({
        fromState: DealState.BIDDING,
        toState: DealState.COUNTERED,
        actorOrgId: listing.ownerOrgId,
        note: "Listing owner countered",
      });
    }

    history.push({
      fromState: input.hadCounter ? DealState.COUNTERED : DealState.BIDDING,
      toState: DealState.ACCEPTED,
      actorOrgId: input.acceptedByOrgId,
      note: "Accepted — identities released to both parties",
    });

    for (const [i, event] of history.entries()) {
      await tx.dealEvent.create({
        data: { dealId: deal.id, ...event, createdAt: new Date(now.getTime() + i) },
      });
    }

    await tx.bid.update({
      where: { id: bid.id },
      data: { status: BidStatus.ACCEPTED, amount: Math.round(input.price) },
    });

    // Losing bids close. Their bidders never learn the winning number.
    await tx.bid.updateMany({
      where: { listingId: listing.id, id: { not: bid.id } },
      data: { status: BidStatus.REJECTED },
    });

    await tx.listing.update({
      where: { id: listing.id },
      data: { status: ListingStatus.AWARDED },
    });

    return deal;
  });
}

/** The listing owner accepts a bid at the bidder's standing number. */
export async function acceptBid(bidId: string, actorOrgId: string): Promise<Deal> {
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: { listing: true },
  });
  if (!bid) throw new BidError("Bid not found", 404);

  if (bid.listing.ownerOrgId !== actorOrgId) {
    throw new BidError("Only the listing owner can accept a bid", 403);
  }
  if (bid.status !== BidStatus.ACTIVE && bid.status !== BidStatus.COUNTERED) {
    throw new BidError(`Cannot accept a bid that is ${bid.status.toLowerCase()}`, 409);
  }

  return createDealFromBid({
    bidId,
    price: bid.amount,
    acceptedByOrgId: actorOrgId,
    hadCounter: bid.counterBy !== null,
  });
}

/** The bidder accepts the owner's counter, forming the deal at that number. */
export async function acceptCounter(bidId: string, actorOrgId: string): Promise<Deal> {
  const bid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid) throw new BidError("Bid not found", 404);

  if (bid.bidderOrgId !== actorOrgId) {
    throw new BidError("Only the bidder can accept this counter-offer", 403);
  }
  if (bid.status !== BidStatus.COUNTERED || bid.counterAmount === null) {
    throw new BidError("There is no counter-offer to accept", 409);
  }

  return createDealFromBid({
    bidId,
    price: bid.counterAmount,
    acceptedByOrgId: actorOrgId,
    hadCounter: true,
  });
}

/** The owner rejects a bid. No deal, no reveal — the bidder stays anonymous. */
export async function rejectBid(bidId: string, actorOrgId: string): Promise<Bid> {
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: { listing: true },
  });
  if (!bid) throw new BidError("Bid not found", 404);

  if (bid.listing.ownerOrgId !== actorOrgId) {
    throw new BidError("Only the listing owner can reject a bid", 403);
  }
  if (bid.status === BidStatus.ACCEPTED) {
    throw new BidError("This bid has already been accepted", 409);
  }

  return prisma.bid.update({
    where: { id: bidId },
    data: { status: BidStatus.REJECTED },
  });
}
