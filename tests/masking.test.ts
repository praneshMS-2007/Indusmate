import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { BidStatus, DealState, OrgType, type Organisation } from "@prisma/client";

import { maskBid, maskBids, assertNoIdentityLeak, type BidWithBidder } from "@/lib/masking";

/**
 * Masking tests — the highest-severity rule in the codebase, so this is the
 * suite to distrust first when something feels wrong.
 *
 * Every assertion checks the SERIALISED payload, not just object properties.
 * A field can be absent from the UI and still be sitting in JSON, which is
 * exactly the bug class that shipped in Block 2 and had to be fixed later.
 */

function org(overrides: Partial<Organisation> & { id: string }): Organisation {
  return {
    name: "Trishul Logistics",
    legalName: "Trishul Logistics Private Limited",
    type: OrgType.TRANSPORTER,
    city: "Pithampur",
    lat: 22.63,
    lng: 75.73,
    verified: true,
    rating: 4.9,
    dealCount: 241,
    onTimePct: 98,
    pseudonymHandle: "Verified Transporter #7734",
    contactName: "Harpreet Singh Bhatia",
    contactPhone: "+91 99816 30052",
    contactEmail: "control@trishullogistics.co.in",
    gstin: "23AAGCT7734B1ZY",
    createdAt: new Date(),
    ...overrides,
  };
}

function bid(id: string, bidderOrgId: string, amount: number, o?: Organisation): BidWithBidder {
  const bidderOrg = o ?? org({ id: bidderOrgId });
  return {
    id,
    listingId: "lst_1",
    bidderOrgId,
    amount,
    message: "Return leg, already empty.",
    status: BidStatus.ACTIVE,
    counterAmount: null,
    counterBy: null,
    counterNote: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    bidderOrg,
  };
}

/** Everything that must never appear while a bid is sealed. */
const IDENTITY_STRINGS = [
  "Trishul Logistics",
  "Trishul Logistics Private Limited",
  "Harpreet Singh Bhatia",
  "+91 99816 30052",
  "control@trishullogistics.co.in",
  "23AAGCT7734B1ZY",
];

const OWNER = "org_owner";
const BIDDER_A = "org_bidder_a";
const BIDDER_B = "org_bidder_b";

const SEALED = { ownerOrgId: OWNER, dealState: null, winningBidId: null };

describe("rule 1 — a bidder never sees another bidder's bid", () => {
  test("a rival bidder gets null, not a redacted object", () => {
    const other = maskBid(bid("bid_a", BIDDER_A, 54800), BIDDER_B, SEALED);
    // null, not `{amount: null}` — a blanked field still confirms a bid exists
    // and at which position, which is itself information.
    assert.equal(other, null);
  });

  test("still null AFTER the deal is accepted", () => {
    const other = maskBid(bid("bid_a", BIDDER_A, 54800), BIDDER_B, {
      ownerOrgId: OWNER,
      dealState: DealState.RATED,
      winningBidId: "bid_a",
    });
    // Sealed means sealed. A market where losers learn the winning price is a
    // market where the next auction is gamed.
    assert.equal(other, null);
  });

  test("a rival's amount never survives into a bidder's list payload", () => {
    const bids = [bid("bid_a", BIDDER_A, 54800), bid("bid_b", BIDDER_B, 61000)];
    const forB = maskBids(bids, BIDDER_B, { ...SEALED, direction: "REVERSE" });

    assert.equal(forB.length, 1, "bidder B should see only their own bid");
    assert.equal(forB[0].id, "bid_b");
    assert.ok(!JSON.stringify(forB).includes("54800"), "rival amount leaked");
  });

  test("an unrelated third party sees nothing", () => {
    const bids = [bid("bid_a", BIDDER_A, 54800), bid("bid_b", BIDDER_B, 61000)];
    const forStranger = maskBids(bids, "org_stranger", { ...SEALED, direction: "REVERSE" });
    assert.deepEqual(forStranger, []);
  });
});

describe("rule 2 — the owner sees amount and reputation, never identity, before ACCEPTED", () => {
  test("no identity field appears in a sealed payload", () => {
    const masked = maskBid(bid("bid_a", BIDDER_A, 54800), OWNER, SEALED);
    assert.ok(masked);
    assert.equal(masked.identity, null);
    // The real assertion: nothing identity-shaped anywhere in the JSON.
    assertNoIdentityLeak(masked, IDENTITY_STRINGS);
  });

  test("the owner still gets the amount and the reputation aggregates", () => {
    const masked = maskBid(bid("bid_a", BIDDER_A, 54800), OWNER, SEALED)!;
    assert.equal(masked.amount, 54800);
    assert.equal(masked.reputation.handle, "Verified Transporter #7734");
    assert.equal(masked.reputation.rating, 4.9);
    assert.equal(masked.reputation.dealCount, 241);
    assert.equal(masked.reputation.onTimePct, 98);
  });

  test("a listing under counter-offer is still sealed", () => {
    const b = bid("bid_a", BIDDER_A, 54800);
    b.status = BidStatus.COUNTERED;
    b.counterAmount = 51000;
    const masked = maskBid(b, OWNER, SEALED)!;
    assert.equal(masked.counterAmount, 51000);
    assertNoIdentityLeak(masked, IDENTITY_STRINGS);
  });
});

describe("rule 3 — identity is released at ACCEPTED, for the winning bid only", () => {
  const ACCEPTED = {
    ownerOrgId: OWNER,
    dealState: DealState.ACCEPTED,
    winningBidId: "bid_a",
  };

  test("the owner sees the winner's identity", () => {
    const masked = maskBid(bid("bid_a", BIDDER_A, 54800), OWNER, ACCEPTED)!;
    assert.ok(masked.identity, "identity should be released");
    assert.equal(masked.identity.legalName, "Trishul Logistics Private Limited");
    assert.equal(masked.identity.contactPhone, "+91 99816 30052");
  });

  test("LOSING bids stay sealed even after acceptance", () => {
    // Those bidders never agreed to anything. Accepting one bid must not
    // unmask the rest of the field.
    const loser = maskBid(bid("bid_c", "org_bidder_c", 61000), OWNER, ACCEPTED)!;
    assert.equal(loser.identity, null);
    assertNoIdentityLeak(loser, IDENTITY_STRINGS);
  });

  test("identity stays released through the rest of the lifecycle", () => {
    for (const state of [
      DealState.CONTRACTED,
      DealState.IN_EXECUTION,
      DealState.SETTLED,
      DealState.RATED,
    ]) {
      const masked = maskBid(bid("bid_a", BIDDER_A, 54800), OWNER, {
        ...ACCEPTED,
        dealState: state,
      })!;
      assert.ok(masked.identity, `identity should remain visible at ${state}`);
    }
  });

  test("a REJECTED deal state does not release identity", () => {
    const masked = maskBid(bid("bid_a", BIDDER_A, 54800), OWNER, {
      ...ACCEPTED,
      dealState: DealState.REJECTED,
    })!;
    assert.equal(masked.identity, null);
    assertNoIdentityLeak(masked, IDENTITY_STRINGS);
  });
});

describe("ranking follows auction direction", () => {
  const bids = [
    bid("b1", "o1", 61000, org({ id: "o1", pseudonymHandle: "#1" })),
    bid("b2", "o2", 54800, org({ id: "o2", pseudonymHandle: "#2" })),
    bid("b3", "o3", 58500, org({ id: "o3", pseudonymHandle: "#3" })),
  ];

  test("reverse auction ranks cheapest first", () => {
    const ranked = maskBids(bids, OWNER, { ...SEALED, direction: "REVERSE" });
    assert.deepEqual(ranked.map((b) => b.amount), [54800, 58500, 61000]);
  });

  test("forward auction ranks highest first", () => {
    const ranked = maskBids(bids, OWNER, { ...SEALED, direction: "FORWARD" });
    assert.deepEqual(ranked.map((b) => b.amount), [61000, 58500, 54800]);
  });
});

describe("the leak assertion itself has teeth", () => {
  test("it throws when identity really is present", () => {
    // Guards against the assertion silently passing on everything, which would
    // make every test above meaningless.
    assert.throws(
      () => assertNoIdentityLeak({ oops: "Harpreet Singh Bhatia" }, IDENTITY_STRINGS),
      /Identity leaked/,
    );
  });
});
