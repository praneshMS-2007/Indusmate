import type { Bid, DealState, Organisation, OrgType } from "@prisma/client";

import { IDENTITY_REVEALED_STATES } from "./deals";

/**
 * IDENTITY MASKING — the highest-severity rule in this codebase.
 *
 * Every API response and every server component that returns bid data passes
 * through maskBid(). Nothing else is permitted to shape a bid for output.
 *
 * Three rules, in order of importance:
 *
 *  1. A bidder NEVER sees another bidder's amount. Not after acceptance, not
 *     ever. Sealed means sealed, and a market where losers learn the winning
 *     price is a market where the next auction is gamed. maskBid returns null
 *     for bids the viewer has no business seeing at all — the field is absent
 *     from the payload rather than blanked, because blanked fields still
 *     reveal that something is there.
 *
 *  2. The listing owner sees every bid's AMOUNT and REPUTATION immediately,
 *     and its IDENTITY only once the deal reaches ACCEPTED. That is the whole
 *     product: choose on merit, then find out who you chose.
 *
 *  3. Identity is released for the WINNING bid only. Accepting one bid does
 *     not unmask the others — those bidders never agreed to anything.
 *
 * The functions here are pure and take no database handle, so the rules can be
 * tested exhaustively without a server. See masking.test.ts.
 */

/** Safe to expose at any state. */
export interface PublicReputation {
  handle: string;
  type: OrgType;
  verified: boolean;
  rating: number;
  dealCount: number;
  onTimePct: number;
}

/** Released ONLY at ACCEPTED and beyond, and only for the winning bid. */
export interface RevealedIdentity {
  orgId: string;
  name: string;
  legalName: string;
  city: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  gstin: string;
}

/** The shape a bid takes on its way out of the server. */
export interface MaskedBid {
  id: string;
  amount: number;
  message: string | null;
  status: Bid["status"];
  createdAt: Date;
  counterAmount: number | null;
  counterBy: Bid["counterBy"];
  counterNote: string | null;
  reputation: PublicReputation;
  /** null while sealed. Never a blanked-out object — absent. */
  identity: RevealedIdentity | null;
  /** True when the viewer placed this bid. */
  isOwnBid: boolean;
}

export type BidWithBidder = Bid & { bidderOrg: Organisation };

export interface MaskingContext {
  /** Who owns the listing these bids were placed on. */
  ownerOrgId: string;
  /** Current deal state, or null when no deal exists yet. */
  dealState: DealState | null;
  /** The bid the deal was struck on, if any. */
  winningBidId: string | null;
}

function toReputation(org: Organisation): PublicReputation {
  return {
    handle: org.pseudonymHandle,
    type: org.type,
    verified: org.verified,
    rating: org.rating,
    dealCount: org.dealCount,
    onTimePct: org.onTimePct,
  };
}

function toIdentity(org: Organisation): RevealedIdentity {
  return {
    orgId: org.id,
    name: org.name,
    legalName: org.legalName,
    city: org.city,
    contactName: org.contactName,
    contactPhone: org.contactPhone,
    contactEmail: org.contactEmail,
    gstin: org.gstin,
  };
}

/**
 * Shape one bid for one viewer.
 *
 * Returns null when the viewer may not see this bid at all — the caller must
 * drop it from the response entirely rather than sending a placeholder.
 */
export function maskBid(
  bid: BidWithBidder,
  viewerOrgId: string,
  ctx: MaskingContext,
): MaskedBid | null {
  const isOwner = viewerOrgId === ctx.ownerOrgId;
  const isBidder = viewerOrgId === bid.bidderOrgId;

  // RULE 1 — everyone else, including rival bidders, gets nothing. This single
  // line is what stops a competitor reading the book.
  if (!isOwner && !isBidder) return null;

  // RULE 2 & 3 — identity travels only with the winning bid, and only once the
  // deal has actually been struck.
  const dealReached =
    ctx.dealState !== null && IDENTITY_REVEALED_STATES.has(ctx.dealState);
  const isWinner = ctx.winningBidId !== null && ctx.winningBidId === bid.id;

  // A bidder viewing their own bid learns nothing new from their own details,
  // so including them is harmless — but the payload stays minimal anyway.
  const revealToOwner = isOwner && dealReached && isWinner;
  const revealToBidder = isBidder && dealReached && isWinner;

  return {
    id: bid.id,
    amount: bid.amount,
    message: bid.message,
    status: bid.status,
    createdAt: bid.createdAt,
    counterAmount: bid.counterAmount,
    counterBy: bid.counterBy,
    counterNote: bid.counterNote,
    reputation: toReputation(bid.bidderOrg),
    identity: revealToOwner || revealToBidder ? toIdentity(bid.bidderOrg) : null,
    isOwnBid: isBidder,
  };
}

/**
 * Shape a list of bids for one viewer, dropping the ones they may not see and
 * ranking what remains.
 *
 * Ranking respects auction direction: in a REVERSE auction (freight, tenders)
 * the lowest price leads; in a FORWARD auction (scarce byproducts, equipment)
 * the highest does. Same engine, one flag.
 */
export function maskBids(
  bids: BidWithBidder[],
  viewerOrgId: string,
  ctx: MaskingContext & { direction: "REVERSE" | "FORWARD" },
): MaskedBid[] {
  const visible = bids
    .map((b) => maskBid(b, viewerOrgId, ctx))
    .filter((b): b is MaskedBid => b !== null);

  return visible.sort((a, b) =>
    ctx.direction === "REVERSE" ? a.amount - b.amount : b.amount - a.amount,
  );
}

/**
 * Assertion used by the test suite and by the Block 8 audit.
 *
 * Walks a serialised payload and fails if any identity-shaped field is present
 * while it should be sealed. Deliberately checks the SERIALISED form rather
 * than the object, because that is what actually reaches a browser.
 */
export function assertNoIdentityLeak(payload: unknown, forbidden: string[]): void {
  const json = JSON.stringify(payload);
  const found = forbidden.filter((value) => value.length > 0 && json.includes(value));
  if (found.length > 0) {
    throw new Error(
      `Identity leaked into a sealed payload: ${found.join(", ")}`,
    );
  }
}
