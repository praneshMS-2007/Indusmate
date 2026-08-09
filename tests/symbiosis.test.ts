import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  confidence,
  int,
  normaliseMatches,
  str,
  verifyOnPlatformClaims,
  type RosterEntry,
} from "@/lib/symbiosis";

/**
 * Symbiosis matcher — trust-boundary tests.
 *
 * The model's JSON response is untrusted input, same category as a request
 * body. These test the two places that matter: numeric coercion (a bad range
 * must not render as a negative or reversed price band) and, more important,
 * that an invented on-platform orgId is never allowed through. A hallucinated
 * business partner on a live demo is worse than no match at all.
 *
 * No network, no database — these exercise only the pure normalisation
 * functions, not findSymbiosisMatches() itself.
 */

describe("str / int / confidence coercion", () => {
  test("str trims and falls back on blank or non-string", () => {
    assert.equal(str("  cement  "), "cement");
    assert.equal(str(""), "");
    assert.equal(str("", "fallback"), "fallback");
    assert.equal(str(null, "fallback"), "fallback");
    assert.equal(str(42, "fallback"), "fallback");
  });

  test("int coerces numeric strings and rejects negatives and junk", () => {
    assert.equal(int(500), 500);
    assert.equal(int("500"), 500);
    assert.equal(int(-50), 0);
    assert.equal(int("not a number"), 0);
    assert.equal(int(undefined), 0);
  });

  test("confidence only accepts the three known levels, else MEDIUM", () => {
    assert.equal(confidence("HIGH"), "HIGH");
    assert.equal(confidence("low"), "LOW");
    assert.equal(confidence("catastrophic"), "MEDIUM");
    assert.equal(confidence(undefined), "MEDIUM");
  });
});

describe("normaliseMatches", () => {
  test("drops entries with no industry name", () => {
    const out = normaliseMatches([
      { industry: "Cement manufacturing", valueLowInrPerTonne: 300, valueHighInrPerTonne: 800 },
      { industry: "", valueLowInrPerTonne: 100, valueHighInrPerTonne: 200 },
      { valueLowInrPerTonne: 100, valueHighInrPerTonne: 200 },
    ]);
    assert.equal(out.length, 1);
    assert.equal(out[0].industry, "Cement manufacturing");
  });

  test("a reversed price range is corrected, not rendered backwards", () => {
    const out = normaliseMatches([
      { industry: "Road construction", valueLowInrPerTonne: 900, valueHighInrPerTonne: 200 },
    ]);
    assert.equal(out[0].valueLowInrPerTonne, 200);
    assert.equal(out[0].valueHighInrPerTonne, 900);
  });

  test("non-array input yields no matches rather than throwing", () => {
    assert.deepEqual(normaliseMatches(undefined), []);
    assert.deepEqual(normaliseMatches("not an array"), []);
    assert.deepEqual(normaliseMatches(null), []);
  });

  test("missing optional fields fall back to safe placeholders", () => {
    const out = normaliseMatches([{ industry: "Brick manufacturing" }]);
    assert.equal(out[0].application, "—");
    assert.equal(out[0].substitutesFor, "—");
    assert.equal(out[0].standard, "No specific standard");
    assert.equal(out[0].valueLowInrPerTonne, 0);
    assert.equal(out[0].valueHighInrPerTonne, 0);
  });
});

describe("verifyOnPlatformClaims — the trust boundary", () => {
  const roster: RosterEntry[] = [
    { id: "org_banmore_cement", name: "Banmore Cement Industries", type: "MANUFACTURER", city: "Banmore" },
    { id: "org_ecocycle", name: "EcoCycle Resource Recovery", type: "RECYCLER", city: "Banmore" },
  ];

  test("accepts an orgId that was actually in the roster sent to the model", () => {
    const claims = verifyOnPlatformClaims(
      [{ orgId: "org_banmore_cement", reason: "Can use it as a pozzolan." }],
      roster,
    );
    assert.equal(claims.size, 1);
    assert.equal(claims.get("org_banmore_cement"), "Can use it as a pozzolan.");
  });

  test("silently drops an invented orgId not present in the roster", () => {
    const claims = verifyOnPlatformClaims(
      [{ orgId: "org_hallucinated_buyer", reason: "This company does not exist." }],
      roster,
    );
    assert.equal(claims.size, 0);
    assert.equal(claims.has("org_hallucinated_buyer"), false);
  });

  test("mixed batch keeps only the legitimate ids", () => {
    const claims = verifyOnPlatformClaims(
      [
        { orgId: "org_banmore_cement", reason: "Real." },
        { orgId: "org_made_up", reason: "Fake." },
        { orgId: "org_ecocycle", reason: "Also real." },
      ],
      roster,
    );
    assert.deepEqual([...claims.keys()].sort(), ["org_banmore_cement", "org_ecocycle"]);
  });

  test("deduplicates a repeated orgId, keeping the first reason", () => {
    const claims = verifyOnPlatformClaims(
      [
        { orgId: "org_ecocycle", reason: "First reason." },
        { orgId: "org_ecocycle", reason: "Second reason." },
      ],
      roster,
    );
    assert.equal(claims.size, 1);
    assert.equal(claims.get("org_ecocycle"), "First reason.");
  });

  test("an empty or malformed claims array yields no matches", () => {
    assert.equal(verifyOnPlatformClaims([], roster).size, 0);
    assert.equal(verifyOnPlatformClaims(undefined, roster).size, 0);
    assert.equal(verifyOnPlatformClaims([{ notAnOrgId: true }], roster).size, 0);
  });

  test("a blank reason falls back to a generic one rather than an empty string", () => {
    const claims = verifyOnPlatformClaims([{ orgId: "org_ecocycle", reason: "" }], roster);
    assert.equal(claims.get("org_ecocycle"), "Matched on the material specification.");
  });
});
