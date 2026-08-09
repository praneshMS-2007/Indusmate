import { NextResponse } from "next/server";

import { getCurrentOrg } from "@/lib/auth";
import { BidError, placeBid } from "@/lib/bids";
import { getListingBidView } from "@/lib/bid-queries";

/**
 * Sealed bids for one listing.
 *
 * Both handlers resolve the viewer from the cookie via getCurrentOrg() and
 * never from the request, and both return bid data only through
 * getListingBidView(), which masks. There is no path through this file that
 * emits an unmasked bid.
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const org = await getCurrentOrg();

  const view = await getListingBidView(id, org.id);
  if (!view) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  return NextResponse.json({
    // Already filtered for this viewer: rivals' bids are absent, not blanked.
    bids: view.bids,
    totalBids: view.totalBids,
    isOwner: view.isOwner,
    dealState: view.deal?.state ?? null,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const org = await getCurrentOrg();

  let body: { amount?: unknown; message?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  try {
    const bid = await placeBid({
      listingId: id,
      // The bidder is the acting org, resolved server-side. A bidderOrgId in
      // the body is ignored — accepting one would let anyone bid as anyone.
      bidderOrgId: org.id,
      amount: Number(body.amount),
      message: typeof body.message === "string" ? body.message : null,
    });

    return NextResponse.json({ id: bid.id, amount: bid.amount }, { status: 201 });
  } catch (e) {
    if (e instanceof BidError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
