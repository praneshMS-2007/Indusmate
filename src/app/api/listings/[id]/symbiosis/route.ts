import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentOrg } from "@/lib/auth";
import { findSymbiosisMatches, SymbiosisError } from "@/lib/symbiosis";

/**
 * Byproduct symbiosis matching for one listing.
 *
 * Read-only, so anyone who can already see the listing (the whole platform —
 * listings are public, only bids are sealed) can request its matches. Nothing
 * here touches bid data, so it does not need to run through maskBid().
 *
 * POST with { force: true } bypasses the cache — used by the "Regenerate"
 * control so a judge can watch a fresh call happen live instead of always
 * seeing the cached one.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Resolved for parity with every other route, even though this endpoint
  // does not branch on identity today — a listing's owner and a stranger see
  // the same matches, since the spec itself is already public.
  await getCurrentOrg();

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  let force = false;
  try {
    const body = (await request.json()) as { force?: unknown };
    force = body.force === true;
  } catch {
    // No body / not JSON is fine — force defaults to false.
  }

  try {
    const result = await findSymbiosisMatches(listing, { force });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof SymbiosisError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}
