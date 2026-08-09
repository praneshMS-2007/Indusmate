import { DealState, type Deal, type Prisma } from "@prisma/client";

import { prisma } from "./prisma";

/**
 * THE DEAL STATE MACHINE.
 *
 * One machine serves all five markets. A freight leg, a shift of welders and a
 * waste stream all move through exactly these states, which is the whole
 * thesis: markets differ by spec, never by process.
 *
 *   LISTED -> BIDDING -> COUNTERED -> ACCEPTED -> CONTRACTED
 *          -> IN_EXECUTION -> SETTLED -> RATED
 *   Terminal: REJECTED, CANCELLED, EXPIRED
 *
 * WHERE THE DEAL ROW BEGINS
 * A Deal row is created at the moment of acceptance, so LISTED, BIDDING and
 * COUNTERED are never held by a live Deal — they are properties of the listing
 * and its bids. Those states are still written into the deal's DealEvent
 * history when it is created, so the audit trail reads as a complete path from
 * LISTED to wherever the deal now sits. See createDealFromBid() in bids.ts.
 *
 * Consequently this module governs ACCEPTED onward, and it is the ONLY place
 * a Deal's state may change. No route handler and no component writes
 * `deal.state` directly.
 */

/** What an actor can ask to happen. */
export type DealEventName =
  | "CONTRACT"
  | "START_EXECUTION"
  | "SETTLE"
  | "RATE"
  | "CANCEL";

/** Who is permitted to trigger a given transition. */
type Party = "BUYER" | "SELLER" | "EITHER";

interface TransitionRule {
  to: DealState;
  who: Party;
  /** Written into the audit log when no note is supplied. */
  defaultNote: string;
}

/**
 * The legal moves. Anything absent from this table is illegal by construction
 * — there is no fallback branch, so a new state cannot silently become
 * reachable by forgetting to forbid it.
 */
const TRANSITIONS: Partial<Record<DealState, Partial<Record<DealEventName, TransitionRule>>>> = {
  [DealState.ACCEPTED]: {
    CONTRACT: {
      to: DealState.CONTRACTED,
      who: "EITHER",
      defaultNote: "Contract issued",
    },
    CANCEL: {
      to: DealState.CANCELLED,
      who: "EITHER",
      defaultNote: "Deal cancelled before contracting",
    },
  },
  [DealState.CONTRACTED]: {
    // The seller performs the work, so the seller starts execution.
    START_EXECUTION: {
      to: DealState.IN_EXECUTION,
      who: "SELLER",
      defaultNote: "Execution started",
    },
    CANCEL: {
      to: DealState.CANCELLED,
      who: "EITHER",
      defaultNote: "Contract cancelled",
    },
  },
  [DealState.IN_EXECUTION]: {
    // The buyer confirms delivery, so the buyer settles. A seller who could
    // mark their own work settled would be marking their own homework.
    SETTLE: {
      to: DealState.SETTLED,
      who: "BUYER",
      defaultNote: "Delivered and settled",
    },
  },
  [DealState.SETTLED]: {
    RATE: {
      to: DealState.RATED,
      who: "EITHER",
      defaultNote: "Deal rated",
    },
  },
  // RATED, CANCELLED, REJECTED and EXPIRED are terminal: no entry here, so
  // every event against them is rejected.
};

/** Thrown when a transition is not permitted. Carries an HTTP status so route
 *  handlers do not have to guess. */
export class DealTransitionError extends Error {
  readonly status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.name = "DealTransitionError";
    this.status = status;
  }
}

/**
 * Is this move legal from this state? Pure — no database, directly testable.
 */
export function legalTransition(
  from: DealState,
  event: DealEventName,
): TransitionRule | null {
  return TRANSITIONS[from]?.[event] ?? null;
}

/** Every event legal from a state, regardless of who may trigger it. */
export function availableEvents(from: DealState): DealEventName[] {
  return Object.keys(TRANSITIONS[from] ?? {}) as DealEventName[];
}

/**
 * Events THIS party may actually trigger from this state.
 *
 * Use this to render buttons, never availableEvents(). Offering a control that
 * is guaranteed to fail is worse than offering none: the operator concludes
 * the app is broken rather than that the action was not theirs to take.
 *
 * This is a convenience for the UI, not a security boundary — transitionDeal()
 * re-checks permission server-side regardless of what the client rendered.
 */
export function permittedEvents(
  from: DealState,
  role: "buyer" | "seller",
): DealEventName[] {
  const table = TRANSITIONS[from] ?? {};
  return (Object.entries(table) as Array<[DealEventName, TransitionRule]>)
    .filter(([, rule]) =>
      rule.who === "EITHER" ? true : rule.who === "BUYER" ? role === "buyer" : role === "seller",
    )
    .map(([name]) => name);
}

/**
 * Is this actor allowed to trigger this move? Pure — no database.
 */
export function actorPermitted(
  rule: TransitionRule,
  actorOrgId: string,
  deal: { buyerOrgId: string; sellerOrgId: string },
): boolean {
  switch (rule.who) {
    case "BUYER":
      return actorOrgId === deal.buyerOrgId;
    case "SELLER":
      return actorOrgId === deal.sellerOrgId;
    case "EITHER":
      return actorOrgId === deal.buyerOrgId || actorOrgId === deal.sellerOrgId;
  }
}

/**
 * THE ONLY PLACE A DEAL'S STATE CHANGES.
 *
 * Validates that the move is legal from the current state, that the actor is a
 * party to the deal and permitted to make this particular move, then writes
 * the new state and its DealEvent row in a single transaction — so the audit
 * log can never disagree with the state it is supposed to explain.
 *
 * Throws DealTransitionError on anything illegal. It never silently no-ops:
 * a caller that asks for something impossible has a bug, and swallowing it
 * would hide the bug behind a working-looking screen.
 */
export async function transitionDeal(
  dealId: string,
  event: DealEventName,
  actorOrgId: string,
  note?: string,
): Promise<Deal> {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) throw new DealTransitionError("Deal not found", 404);

  // Being a party to the deal is checked before anything else, so a stranger
  // cannot probe which transitions are available by reading error messages.
  const isParty = actorOrgId === deal.buyerOrgId || actorOrgId === deal.sellerOrgId;
  if (!isParty) {
    throw new DealTransitionError("You are not a party to this deal", 403);
  }

  const rule = legalTransition(deal.state, event);
  if (!rule) {
    throw new DealTransitionError(
      `Cannot ${event} a deal that is ${deal.state}`,
      409,
    );
  }

  if (!actorPermitted(rule, actorOrgId, deal)) {
    const expected = rule.who === "BUYER" ? "buyer" : "seller";
    throw new DealTransitionError(
      `Only the ${expected} on this deal can do that`,
      403,
    );
  }

  // State change and audit row are one atomic unit. If either fails, both do.
  const [updated] = await prisma.$transaction([
    prisma.deal.update({
      where: { id: dealId },
      data: { state: rule.to },
    }),
    prisma.dealEvent.create({
      data: {
        dealId,
        fromState: deal.state,
        toState: rule.to,
        actorOrgId,
        note: note ?? rule.defaultNote,
      },
    }),
  ]);

  return updated;
}

/**
 * Append a DealEvent without changing state. For recording the pre-acceptance
 * history when a deal is created. Takes a transaction client so it enlists in
 * the caller's transaction.
 */
export async function appendDealEvent(
  tx: Prisma.TransactionClient,
  input: {
    dealId: string;
    fromState: DealState | null;
    toState: DealState;
    actorOrgId: string;
    note?: string;
    createdAt?: Date;
  },
) {
  return tx.dealEvent.create({ data: input });
}

/** Human labels for the UI. Kept beside the machine so they cannot drift. */
export const DEAL_EVENT_LABEL: Record<DealEventName, string> = {
  CONTRACT: "Issue contract",
  START_EXECUTION: "Start execution",
  SETTLE: "Confirm delivery",
  RATE: "Rate this deal",
  CANCEL: "Cancel deal",
};

export const DEAL_STATE_LABEL: Record<DealState, string> = {
  LISTED: "Listed",
  BIDDING: "Bidding open",
  COUNTERED: "Counter-offer open",
  ACCEPTED: "Accepted",
  CONTRACTED: "Contracted",
  IN_EXECUTION: "In execution",
  SETTLED: "Settled",
  RATED: "Rated",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

/** States in which both parties' identities are released. */
export const IDENTITY_REVEALED_STATES: ReadonlySet<DealState> = new Set([
  DealState.ACCEPTED,
  DealState.CONTRACTED,
  DealState.IN_EXECUTION,
  DealState.SETTLED,
  DealState.RATED,
  // A cancelled deal was accepted first — the parties already met.
  DealState.CANCELLED,
]);
