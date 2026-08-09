import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentOrg } from "@/lib/auth";
import { cityCoords, isCity } from "@/lib/cities";
import { LISTING_TYPES, LISTING_TYPE_META, parseSpec, type ListingType } from "@/lib/listing-spec";

/**
 * ONE endpoint for all five markets.
 *
 * There is no /api/freight or /api/byproducts. The market is a field on the
 * body, and the typed spec payload is validated by parseSpec() against the
 * discriminated union. Adding a sixth market touches nothing in this file.
 */
export async function POST(request: Request) {
  // The owner is always the acting organisation, resolved server-side from the
  // cookie. An ownerOrgId in the body is ignored — accepting one would let a
  // client post listings as somebody else.
  const org = await getCurrentOrg();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const type = body.type as ListingType;
  if (!LISTING_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${LISTING_TYPES.join(", ")}` },
      { status: 400 },
    );
  }
  const meta = LISTING_TYPE_META[type];

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const locationCity = body.locationCity;
  if (!isCity(locationCity)) {
    return NextResponse.json({ error: "locationCity is not a known city" }, { status: 400 });
  }

  // Freight is the only market with a destination.
  const destCity = body.destCity;
  if (meta.hasDestination) {
    if (!isCity(destCity)) {
      return NextResponse.json(
        { error: "destCity is required for freight listings" },
        { status: 400 },
      );
    }
    if (destCity === locationCity) {
      return NextResponse.json(
        { error: "Origin and destination must be different" },
        { status: 400 },
      );
    }
  }

  const quantity = Number(body.quantity);
  const referencePrice = Math.round(Number(body.referencePrice));
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json({ error: "quantity must be greater than zero" }, { status: 400 });
  }
  if (!Number.isFinite(referencePrice) || referencePrice <= 0) {
    return NextResponse.json(
      { error: "referencePrice must be greater than zero" },
      { status: 400 },
    );
  }

  const windowStart = new Date(String(body.windowStart));
  const windowEnd = new Date(String(body.windowEnd));
  const closesAt = new Date(String(body.closesAt));
  for (const [label, d] of [
    ["windowStart", windowStart],
    ["windowEnd", windowEnd],
    ["closesAt", closesAt],
  ] as const) {
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: `${label} is not a valid date` }, { status: 400 });
    }
  }
  if (windowEnd < windowStart) {
    return NextResponse.json({ error: "windowEnd must be after windowStart" }, { status: 400 });
  }

  // Throws with a field-specific message if the spec is wrong for this market.
  let spec;
  try {
    spec = parseSpec(type, body.spec);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid spec" },
      { status: 400 },
    );
  }

  const origin = cityCoords(locationCity);
  const dest = meta.hasDestination && isCity(destCity) ? cityCoords(destCity) : null;

  const direction =
    body.direction === "REVERSE" || body.direction === "FORWARD"
      ? body.direction
      : meta.defaultDirection;

  const listing = await prisma.listing.create({
    data: {
      type,
      title,
      description,
      ownerOrgId: org.id,
      direction,
      status: "OPEN",
      spec: spec as object,
      locationCity,
      locationLat: origin.lat,
      locationLng: origin.lng,
      destCity: dest ? (destCity as string) : null,
      destLat: dest?.lat ?? null,
      destLng: dest?.lng ?? null,
      windowStart,
      windowEnd,
      quantity,
      unit: String(body.unit ?? meta.defaultUnit),
      referencePrice,
      closesAt,
    },
  });

  return NextResponse.json({ id: listing.id }, { status: 201 });
}
