import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { DealState } from "@prisma/client";

import {
  actorPermitted,
  availableEvents,
  legalTransition,
  permittedEvents,
  type DealEventName,
} from "@/lib/deals";

/**
 * State machine tests.
 *
 * These exercise the pure validators rather than transitionDeal() itself, so
 * they run in milliseconds with no database. transitionDeal is a thin wrapper:
 * look up the deal, run exactly these two checks, write the row. The logic
 * worth testing exhaustively is here.
 */

const DEAL = { buyerOrgId: "org_buyer", sellerOrgId: "org_seller" };

const ALL_EVENTS: DealEventName[] = [
  "CONTRACT",
  "START_EXECUTION",
  "SETTLE",
  "RATE",
  "CANCEL",
];

describe("legal transitions", () => {
  test("the happy path is walkable end to end", () => {
    assert.equal(legalTransition(DealState.ACCEPTED, "CONTRACT")?.to, DealState.CONTRACTED);
    assert.equal(
      legalTransition(DealState.CONTRACTED, "START_EXECUTION")?.to,
      DealState.IN_EXECUTION,
    );
    assert.equal(legalTransition(DealState.IN_EXECUTION, "SETTLE")?.to, DealState.SETTLED);
    assert.equal(legalTransition(DealState.SETTLED, "RATE")?.to, DealState.RATED);
  });

  test("states cannot be skipped", () => {
    // Settling something that was never executed, or rating something never
    // settled, are the two shortcuts a hurried operator would actually try.
    assert.equal(legalTransition(DealState.ACCEPTED, "SETTLE"), null);
    assert.equal(legalTransition(DealState.ACCEPTED, "RATE"), null);
    assert.equal(legalTransition(DealState.CONTRACTED, "SETTLE"), null);
    assert.equal(legalTransition(DealState.IN_EXECUTION, "RATE"), null);
  });

  test("a deal cannot move backwards", () => {
    assert.equal(legalTransition(DealState.SETTLED, "CONTRACT"), null);
    assert.equal(legalTransition(DealState.IN_EXECUTION, "CONTRACT"), null);
    assert.equal(legalTransition(DealState.SETTLED, "START_EXECUTION"), null);
  });

  test("terminal states accept nothing at all", () => {
    for (const terminal of [
      DealState.RATED,
      DealState.CANCELLED,
      DealState.REJECTED,
      DealState.EXPIRED,
    ]) {
      for (const event of ALL_EVENTS) {
        assert.equal(
          legalTransition(terminal, event),
          null,
          `${terminal} should refuse ${event}`,
        );
      }
      assert.deepEqual(availableEvents(terminal), []);
    }
  });

  test("pre-acceptance states hold no live deal, so they accept nothing", () => {
    // A Deal row is created at acceptance. LISTED/BIDDING/COUNTERED appear only
    // in the audit history, never as a deal's current state.
    for (const state of [DealState.LISTED, DealState.BIDDING, DealState.COUNTERED]) {
      for (const event of ALL_EVENTS) {
        assert.equal(legalTransition(state, event), null);
      }
    }
  });

  test("cancellation is available before execution and not after", () => {
    assert.ok(legalTransition(DealState.ACCEPTED, "CANCEL"));
    assert.ok(legalTransition(DealState.CONTRACTED, "CANCEL"));
    // Once a truck is moving or a crew is on site, cancelling is not a
    // unilateral button — it is a dispute, and out of scope for this build.
    assert.equal(legalTransition(DealState.IN_EXECUTION, "CANCEL"), null);
    assert.equal(legalTransition(DealState.SETTLED, "CANCEL"), null);
  });
});

describe("actor permissions", () => {
  test("a stranger can do nothing, whatever the state", () => {
    for (const state of [
      DealState.ACCEPTED,
      DealState.CONTRACTED,
      DealState.IN_EXECUTION,
      DealState.SETTLED,
    ]) {
      for (const event of ALL_EVENTS) {
        const rule = legalTransition(state, event);
        if (!rule) continue;
        assert.equal(
          actorPermitted(rule, "org_stranger", DEAL),
          false,
          `stranger must not be able to ${event} at ${state}`,
        );
      }
    }
  });

  test("only the seller starts execution", () => {
    const rule = legalTransition(DealState.CONTRACTED, "START_EXECUTION")!;
    assert.equal(actorPermitted(rule, "org_seller", DEAL), true);
    assert.equal(actorPermitted(rule, "org_buyer", DEAL), false);
  });

  test("only the buyer confirms delivery", () => {
    // The seller marking their own delivery settled would be marking their own
    // homework, and it is the transition that releases payment.
    const rule = legalTransition(DealState.IN_EXECUTION, "SETTLE")!;
    assert.equal(actorPermitted(rule, "org_buyer", DEAL), true);
    assert.equal(actorPermitted(rule, "org_seller", DEAL), false);
  });

  test("permittedEvents never offers a move the viewer cannot make", () => {
    // Regression: the deals page rendered every legal event regardless of who
    // could trigger it, so a buyer saw a "Start execution" button that could
    // only ever 403. A control that always fails reads as a broken app.
    for (const state of [
      DealState.ACCEPTED,
      DealState.CONTRACTED,
      DealState.IN_EXECUTION,
      DealState.SETTLED,
    ]) {
      for (const role of ["buyer", "seller"] as const) {
        const deal = role === "buyer" ? DEAL : DEAL;
        const actor = role === "buyer" ? deal.buyerOrgId : deal.sellerOrgId;
        for (const event of permittedEvents(state, role)) {
          const rule = legalTransition(state, event)!;
          assert.equal(
            actorPermitted(rule, actor, deal),
            true,
            `${role} was offered ${event} at ${state} but cannot perform it`,
          );
        }
      }
    }
  });

  test("permittedEvents splits the contracted state by role", () => {
    assert.deepEqual(permittedEvents(DealState.CONTRACTED, "seller").sort(), [
      "CANCEL",
      "START_EXECUTION",
    ]);
    // The buyer may cancel, but starting execution is not theirs to do.
    assert.deepEqual(permittedEvents(DealState.CONTRACTED, "buyer"), ["CANCEL"]);
    assert.deepEqual(permittedEvents(DealState.IN_EXECUTION, "buyer"), ["SETTLE"]);
    assert.deepEqual(permittedEvents(DealState.IN_EXECUTION, "seller"), []);
  });

  test("either party may contract, cancel or rate", () => {
    for (const [state, event] of [
      [DealState.ACCEPTED, "CONTRACT"],
      [DealState.ACCEPTED, "CANCEL"],
      [DealState.SETTLED, "RATE"],
    ] as const) {
      const rule = legalTransition(state, event)!;
      assert.equal(actorPermitted(rule, "org_buyer", DEAL), true);
      assert.equal(actorPermitted(rule, "org_seller", DEAL), true);
    }
  });
});
