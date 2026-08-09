/**
 * Reads the database back on a fresh connection and prints what is actually
 * stored. Used to prove the seed landed, and again at Block 8 to confirm the
 * demo data is clean before rehearsal.
 *
 *   npm run db:verify
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rupees = (n: number) => "Rs " + n.toLocaleString("en-IN");

async function main() {
  // Raw SQL deliberately: proves the rows exist in Postgres rather than
  // anything Prisma might be caching or synthesising.
  const [{ count: orgCount }] = await prisma.$queryRaw<
    { count: bigint }[]
  >`SELECT COUNT(*)::bigint AS count FROM "Organisation"`;
  const [{ count: listingCount }] = await prisma.$queryRaw<
    { count: bigint }[]
  >`SELECT COUNT(*)::bigint AS count FROM "Listing"`;

  console.log(`\nRaw SQL row counts — Organisation: ${orgCount}, Listing: ${listingCount}\n`);

  console.log("═══ ORGANISATIONS ".padEnd(78, "═"));
  const orgs = await prisma.organisation.findMany({ orderBy: [{ city: "asc" }, { name: "asc" }] });
  for (const o of orgs) {
    console.log(
      `  ${o.name.padEnd(30)} ${o.type.padEnd(13)} ${o.city.padEnd(11)} ` +
        `${o.rating}/5  ${String(o.dealCount).padStart(3)} deals  ${o.onTimePct}% on-time`,
    );
    console.log(`  ${"".padEnd(30)} masks as → ${o.pseudonymHandle}`);
  }

  console.log("\n═══ LISTINGS ".padEnd(78, "═"));
  const listings = await prisma.listing.findMany({
    include: { ownerOrg: true, _count: { select: { bids: true } } },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });
  for (const l of listings) {
    const route = l.destCity ? `${l.locationCity} → ${l.destCity}` : l.locationCity;
    console.log(
      `  [${l.type.padEnd(12)}] ${l.title.slice(0, 46).padEnd(48)} ` +
        `${l.direction.padEnd(7)} ${l.status.padEnd(9)} ${String(l._count.bids)} bids`,
    );
    console.log(`  ${"".padEnd(15)} ${route}  ·  owner: ${l.ownerOrg.name}  ·  ref ${rupees(l.referencePrice)}`);
  }

  console.log("\n═══ DEALS AND THEIR AUDIT TRAILS ".padEnd(78, "═"));
  const deals = await prisma.deal.findMany({
    include: {
      listing: true,
      buyerOrg: true,
      sellerOrg: true,
      events: { orderBy: { createdAt: "asc" }, include: { actorOrg: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  for (const d of deals) {
    console.log(
      `\n  ${d.state.padEnd(13)} ${rupees(d.price).padEnd(12)} ${d.listing.type.padEnd(13)} ${d.listing.title.slice(0, 40)}`,
    );
    console.log(`  ${"".padEnd(13)} buyer: ${d.buyerOrg.name}  ·  seller: ${d.sellerOrg.name}`);
    for (const e of d.events) {
      console.log(
        `      ${(e.fromState ?? "—").padEnd(13)} → ${e.toState.padEnd(13)} by ${e.actorOrg.name.padEnd(28)} ${e.note ?? ""}`,
      );
    }
  }

  // ---- The invariant that matters most -----------------------------------
  console.log("\n═══ ANONYMITY PRE-CHECK ".padEnd(78, "═"));
  const sealed = await prisma.listing.findFirst({
    where: { id: "lst_freight_malanpur_pithampur" },
    include: { bids: { include: { bidderOrg: true }, orderBy: { amount: "asc" } } },
  });
  if (sealed) {
    console.log(`  Listing: ${sealed.title}`);
    console.log(`  ${sealed.bids.length} sealed bids. No deal exists yet, so the owner must see ONLY this:\n`);
    for (const b of sealed.bids) {
      const o = b.bidderOrg;
      console.log(
        `    ${o.pseudonymHandle.padEnd(30)} ${o.rating}/5 · ${o.dealCount} deals · ${o.onTimePct}% on-time · ${rupees(b.amount)}`,
      );
    }
    console.log("\n  Identities behind those handles (must NEVER reach the client pre-ACCEPTED):");
    for (const b of sealed.bids) {
      console.log(`    ${b.bidderOrg.pseudonymHandle.padEnd(30)} = ${b.bidderOrg.legalName}`);
    }
    console.log("\n  Block 4 builds maskBid() to enforce this. Block 8 re-verifies it on raw API responses.");
  }

  console.log("");
}

main()
  .catch((e) => {
    console.error("VERIFY FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
