import { NextResponse } from "next/server";

import { getCurrentOrg } from "@/lib/auth";
import { DealTransitionError, transitionDeal, type DealEventName } from "@/lib/deals";

const EVENTS: DealEventName[] = ["CONTRACT", "START_EXECUTION", "SETTLE", "RATE", "CANCEL"];

/**
 * Move a deal along the lifecycle.
 *
 * This handler does no validation of its own beyond checking the event name is
 * a known one. Whether the move is legal from the current state, and whether
 * this organisation is allowed to make it, are decided by transitionDeal() —
 * the single place deal state changes. Duplicating those checks here would
 * create a second, drifting copy of the rules.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const org = await getCurrentOrg();

  let body: { event?: DealEventName; note?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  if (!body.event || !EVENTS.includes(body.event)) {
    return NextResponse.json(
      { error: `event must be one of: ${EVENTS.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const deal = await transitionDeal(
      id,
      body.event,
      org.id,
      typeof body.note === "string" ? body.note : undefined,
    );
    return NextResponse.json({ id: deal.id, state: deal.state });
  } catch (e) {
    if (e instanceof DealTransitionError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
