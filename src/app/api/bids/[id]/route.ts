import { NextResponse } from "next/server";

import { getCurrentOrg } from "@/lib/auth";
import {
  BidError,
  acceptBid,
  acceptCounter,
  counterBid,
  recounterBid,
  rejectBid,
} from "@/lib/bids";

/**
 * Actions on a single bid.
 *
 * One endpoint with an `action` discriminator rather than five sibling routes,
 * for the same reason there is one listing endpoint: the shape is identical
 * and splitting it would invite five slightly different authorisation checks.
 *
 * Every action's permission check lives in the service layer (lib/bids.ts), so
 * this handler cannot accidentally be the lenient one.
 */

type Action = "counter" | "recounter" | "accept" | "accept-counter" | "reject";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const org = await getCurrentOrg();

  let body: { action?: Action; amount?: unknown; note?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const note = typeof body.note === "string" ? body.note : null;

  try {
    switch (body.action) {
      case "counter": {
        const bid = await counterBid({
          bidId: id,
          actorOrgId: org.id,
          counterAmount: Number(body.amount),
          note,
        });
        return NextResponse.json({ id: bid.id, counterAmount: bid.counterAmount });
      }

      case "recounter": {
        const bid = await recounterBid({
          bidId: id,
          actorOrgId: org.id,
          amount: Number(body.amount),
          message: note,
        });
        return NextResponse.json({ id: bid.id, amount: bid.amount });
      }

      // Both accepts create the deal and release identities.
      case "accept": {
        const deal = await acceptBid(id, org.id);
        return NextResponse.json({ dealId: deal.id, state: deal.state, price: deal.price });
      }

      case "accept-counter": {
        const deal = await acceptCounter(id, org.id);
        return NextResponse.json({ dealId: deal.id, state: deal.state, price: deal.price });
      }

      case "reject": {
        const bid = await rejectBid(id, org.id);
        return NextResponse.json({ id: bid.id, status: bid.status });
      }

      default:
        return NextResponse.json(
          { error: "action must be one of: counter, recounter, accept, accept-counter, reject" },
          { status: 400 },
        );
    }
  } catch (e) {
    if (e instanceof BidError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
