/**
 * End-to-end engine check, driven through the RAW HTTP API.
 *
 * Walks the exact demo script and asserts what each party can see at every
 * step — reading the JSON the server actually sends, not the rendered screen.
 * The UI is not the security boundary; this is what a judge with devtools sees.
 *
 * MUTATES DATA. Re-seed afterwards: npm run seed
 *
 *   npm run start        (one terminal)
 *   npm run check:engine
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = process.env.SCAN_BASE ?? "http://localhost:3000";

const LISTING = "lst_freight_malanpur_pithampur";
const OWNER = "org_chambal_steel"; // posted the freight leg
const TRISHUL = "org_trishul_logistics"; // bid 54,800 — the leader
const MP_CARGO = "org_mp_cargo"; // bid 58,500
const SARTHAK = "org_sarthak_roadlines"; // bid 61,000

let pass = 0;
let fail = 0;

function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    pass++;
    console.log(`  PASS  ${label}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ""}`);
  }
}

function as(orgId: string) {
  return { Cookie: `nx_demo_org=${orgId}`, "Content-Type": "application/json" };
}

async function get(path: string, orgId: string) {
  const res = await fetch(BASE + path, { headers: as(orgId) });
  return { status: res.status, text: await res.text() };
}

async function post(path: string, orgId: string, body: object) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: as(orgId),
    body: JSON.stringify(body),
  });
  return { status: res.status, text: await res.text() };
}

async function main() {
  console.log(`\nEngine check — ${BASE}`);
  console.log("═".repeat(78));

  const orgs = await prisma.organisation.findMany();
  const byId = new Map(orgs.map((o) => [o.id, o]));
  const trishul = byId.get(TRISHUL)!;
  const sarthak = byId.get(SARTHAK)!;

  /** Everything about Trishul that must stay sealed. */
  const TRISHUL_SECRETS = [
    trishul.legalName,
    trishul.contactName,
    trishul.contactPhone,
    trishul.contactEmail,
    trishul.gstin,
  ];

  // ---------------------------------------------------------------- step 1
  console.log("\n1. Owner opens the bid inbox — sealed");
  {
    const r = await get(`/api/listings/${LISTING}/bids`, OWNER);
    const data = JSON.parse(r.text) as {
      bids: Array<{ amount: number; identity: unknown; reputation: { handle: string } }>;
      totalBids: number;
    };

    check("owner sees all three bids", data.bids.length === 3, `saw ${data.bids.length}`);
    check(
      "ranked cheapest first (reverse auction)",
      data.bids[0].amount === 54800 && data.bids[2].amount === 61000,
      data.bids.map((b) => b.amount).join(", "),
    );
    check("every bid has identity: null", data.bids.every((b) => b.identity === null));
    check(
      "reputation handles ARE present",
      data.bids.every((b) => b.reputation.handle.startsWith("Verified")),
    );
    const leaked = TRISHUL_SECRETS.filter((s) => r.text.includes(s));
    check(
      "no identity string anywhere in the raw JSON",
      leaked.length === 0,
      leaked.join(", "),
    );
  }

  // ---------------------------------------------------------------- step 2
  console.log("\n2. A bidder opens the same listing — sees only itself");
  {
    const r = await get(`/api/listings/${LISTING}/bids`, MP_CARGO);
    const data = JSON.parse(r.text) as { bids: Array<{ amount: number; isOwnBid: boolean }> };

    check("bidder sees exactly one bid", data.bids.length === 1, `saw ${data.bids.length}`);
    check("and it is their own", data.bids[0]?.isOwnBid === true);
    check("their own amount is correct", data.bids[0]?.amount === 58500);
    check("rival amount 54800 absent from raw JSON", !r.text.includes("54800"));
    check("rival amount 61000 absent from raw JSON", !r.text.includes("61000"));
    check(
      "totalBids count is still visible (a count is not an amount)",
      JSON.parse(r.text).totalBids === 3,
    );
  }

  // ---------------------------------------------------------------- step 3
  console.log("\n3. Authorisation — who may do what");
  {
    const bids = await prisma.bid.findMany({ where: { listingId: LISTING } });
    const trishulBid = bids.find((b) => b.bidderOrgId === TRISHUL)!;

    const byRival = await post(`/api/bids/${trishulBid.id}`, SARTHAK, { action: "accept" });
    check("a rival bidder cannot accept a bid (403)", byRival.status === 403, `got ${byRival.status}`);

    const byBidder = await post(`/api/bids/${trishulBid.id}`, TRISHUL, { action: "accept" });
    check("the bidder cannot accept their own bid (403)", byBidder.status === 403, `got ${byBidder.status}`);

    const counterByRival = await post(`/api/bids/${trishulBid.id}`, SARTHAK, {
      action: "counter",
      amount: 1,
    });
    check("a non-owner cannot counter (403)", counterByRival.status === 403, `got ${counterByRival.status}`);

    const selfBid = await post(`/api/listings/${LISTING}/bids`, OWNER, { amount: 50000 });
    check("the owner cannot bid on their own listing (403)", selfBid.status === 403, `got ${selfBid.status}`);

    const zero = await post(`/api/listings/${LISTING}/bids`, SARTHAK, { amount: 0 });
    check("a zero bid is refused (400)", zero.status === 400, `got ${zero.status}`);
  }

  // ---------------------------------------------------------------- step 4
  console.log("\n4. Counter-offer — still sealed");
  {
    const bids = await prisma.bid.findMany({ where: { listingId: LISTING } });
    const trishulBid = bids.find((b) => b.bidderOrgId === TRISHUL)!;

    const c = await post(`/api/bids/${trishulBid.id}`, OWNER, {
      action: "counter",
      amount: 51000,
      note: "We have moved this leg at 51,000 before.",
    });
    check("owner counters (200)", c.status === 200, `got ${c.status}: ${c.text}`);

    const inbox = await get(`/api/listings/${LISTING}/bids`, OWNER);
    const leaked = TRISHUL_SECRETS.filter((s) => inbox.text.includes(s));
    check("identity STILL sealed during counter-offer", leaked.length === 0, leaked.join(", "));

    const rivalView = await get(`/api/listings/${LISTING}/bids`, SARTHAK);
    check("a rival cannot see the counter amount", !rivalView.text.includes("51000"));
  }

  // ---------------------------------------------------------------- step 5
  console.log("\n5. The bidder accepts the counter — THE REVEAL");
  let dealId = "";
  {
    const bids = await prisma.bid.findMany({ where: { listingId: LISTING } });
    const trishulBid = bids.find((b) => b.bidderOrgId === TRISHUL)!;

    const a = await post(`/api/bids/${trishulBid.id}`, TRISHUL, { action: "accept-counter" });
    check("bidder accepts the counter (200)", a.status === 200, `got ${a.status}: ${a.text}`);
    const deal = JSON.parse(a.text) as { dealId: string; state: string; price: number };
    dealId = deal.dealId;
    check("deal created at ACCEPTED", deal.state === "ACCEPTED", deal.state);
    check("deal price is the counter amount", deal.price === 51000, String(deal.price));

    const inbox = await get(`/api/listings/${LISTING}/bids`, OWNER);
    check(
      "owner NOW sees the winner's legal name",
      inbox.text.includes(trishul.legalName),
      "identity was not released",
    );
    check("owner now sees the winner's phone", inbox.text.includes(trishul.contactPhone));

    // The critical negative: accepting one bid must not unmask the others.
    check(
      "LOSING bidder's identity is still sealed",
      !inbox.text.includes(sarthak.legalName) && !inbox.text.includes(sarthak.contactPhone),
      "a losing bidder was unmasked",
    );

    const loserView = await get(`/api/listings/${LISTING}/bids`, SARTHAK);
    check("a losing bidder still cannot see the winning price", !loserView.text.includes("51000"));
    check(
      "a losing bidder cannot see the winner's identity",
      !loserView.text.includes(trishul.legalName),
    );
  }

  // ---------------------------------------------------------------- step 6
  console.log("\n6. Lifecycle — legal moves only, by the right party");
  {
    const skip = await post(`/api/deals/${dealId}`, OWNER, { event: "SETTLE" });
    check("cannot settle a deal that was never executed (409)", skip.status === 409, `got ${skip.status}`);

    const stranger = await post(`/api/deals/${dealId}`, MP_CARGO, { event: "CONTRACT" });
    check("a non-party cannot move the deal (403)", stranger.status === 403, `got ${stranger.status}`);

    const c = await post(`/api/deals/${dealId}`, OWNER, { event: "CONTRACT" });
    check("owner issues the contract (200)", c.status === 200, c.text);

    const wrongParty = await post(`/api/deals/${dealId}`, OWNER, { event: "START_EXECUTION" });
    check(
      "buyer cannot start execution — only the seller performs (403)",
      wrongParty.status === 403,
      `got ${wrongParty.status}`,
    );

    const exec = await post(`/api/deals/${dealId}`, TRISHUL, { event: "START_EXECUTION" });
    check("seller starts execution (200)", exec.status === 200, exec.text);

    const sellerSettles = await post(`/api/deals/${dealId}`, TRISHUL, { event: "SETTLE" });
    check(
      "seller cannot settle their own work (403)",
      sellerSettles.status === 403,
      `got ${sellerSettles.status}`,
    );

    const settle = await post(`/api/deals/${dealId}`, OWNER, { event: "SETTLE" });
    check("buyer confirms delivery (200)", settle.status === 200, settle.text);

    const rate = await post(`/api/deals/${dealId}`, OWNER, { event: "RATE" });
    check("deal is rated (200)", rate.status === 200, rate.text);

    const afterEnd = await post(`/api/deals/${dealId}`, OWNER, { event: "CONTRACT" });
    check("a terminal deal refuses everything (409)", afterEnd.status === 409, `got ${afterEnd.status}`);
  }

  // ---------------------------------------------------------------- step 7
  console.log("\n7. The audit trail is complete");
  {
    const events = await prisma.dealEvent.findMany({
      where: { dealId },
      orderBy: { createdAt: "asc" },
    });
    const path = events.map((e) => e.toState);
    check(
      "history runs LISTED -> ... -> RATED",
      path.join(" -> ") ===
        "BIDDING -> COUNTERED -> ACCEPTED -> CONTRACTED -> IN_EXECUTION -> SETTLED -> RATED",
      path.join(" -> "),
    );
    check("first event records the pre-deal state", events[0].fromState === "LISTED");
    check("every event names an actor", events.every((e) => Boolean(e.actorOrgId)));
  }

  console.log("\n" + "═".repeat(78));
  console.log(`${pass} passed, ${fail} failed`);
  console.log("Data mutated — run `npm run seed` to restore the demo state.\n");
  if (fail > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("Engine check failed to run:", e instanceof Error ? e.message : e);
    console.error("Is the server running? `npm run start`");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
