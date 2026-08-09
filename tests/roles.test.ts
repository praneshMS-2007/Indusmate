import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { OrgType } from "@prisma/client";

import { BENTO_SPAN, KPI_META, ROLE_META, homeBrowseHref } from "@/lib/roles";
import { LISTING_TYPES } from "@/lib/listing-spec";

/**
 * Role lens tests.
 *
 * The important suite here is the last one. Role-based UI is the single change
 * most likely to quietly wreck this codebase's central claim — "one listing
 * model, one deal state machine" — because the tempting next step is always
 * `if (role === "TRANSPORTER")` inside the engine. These tests make that
 * failure loud instead of subtle.
 */

const ALL_ROLES: OrgType[] = ["MANUFACTURER", "SUPPLIER", "TRANSPORTER", "RECYCLER"];

describe("every role is fully configured", () => {
  for (const role of ALL_ROLES) {
    test(`${role} has a complete lens`, () => {
      const meta = ROLE_META[role];
      assert.ok(meta, `${role} missing from ROLE_META`);
      assert.ok(meta.label.length > 0);
      assert.ok(meta.tagline.length > 0);
      assert.ok(meta.posture.length > 0);
      assert.ok(meta.primary.href.startsWith("/"));
      assert.ok(meta.secondary.href.startsWith("/"));
      assert.ok(meta.cards.length > 0);
    });
  }

  test("every role names exactly four KPIs, and all of them are known", () => {
    for (const role of ALL_ROLES) {
      const { kpis } = ROLE_META[role];
      // Four is not arbitrary: 4 x quarter-span resolves to exactly 12
      // columns, which is what keeps the KPI bar a clean single row.
      assert.equal(kpis.length, 4, `${role} must declare 4 KPIs`);
      for (const id of kpis) {
        assert.ok(KPI_META[id], `${role} references unknown KPI ${id}`);
      }
    }
  });

  test("every homeMarket is a real listing type", () => {
    for (const role of ALL_ROLES) {
      for (const market of ROLE_META[role].homeMarkets) {
        assert.ok(
          LISTING_TYPES.includes(market),
          `${role} references unknown market ${market}`,
        );
      }
    }
  });

  test("no role declares a duplicate card", () => {
    for (const role of ALL_ROLES) {
      const ids = ROLE_META[role].cards.map((c) => c.id);
      assert.equal(new Set(ids).size, ids.length, `${role} repeats a dashboard card`);
    }
  });

  test("exactly one card per role is the hero", () => {
    for (const role of ALL_ROLES) {
      const heroes = ROLE_META[role].cards.filter((c) => c.hero);
      assert.equal(heroes.length, 1, `${role} must have exactly one hero card`);
    }
  });
});

describe("bento rows resolve to full 12-column rows", () => {
  /** Desktop column count each span occupies. */
  const COLS: Record<keyof typeof BENTO_SPAN, number> = {
    full: 12,
    half: 6,
    third: 4,
    twoThirds: 8,
    quarter: 3,
  };

  test("every role's card layout packs into complete rows", () => {
    for (const role of ALL_ROLES) {
      const total = ROLE_META[role].cards.reduce((n, c) => n + COLS[c.span], 0);
      assert.equal(
        total % 12,
        0,
        `${role}'s cards sum to ${total} columns — a ragged row will render a gap`,
      );
    }
  });

  test("span classes are literal strings, never interpolated", () => {
    // Tailwind scans source text at build time. A computed `col-span-${n}`
    // is purged and the card silently renders full width — this already bit
    // us once with badge colours.
    for (const cls of Object.values(BENTO_SPAN)) {
      assert.ok(cls.includes("col-span-"), `${cls} is not a col-span class`);
      assert.ok(!cls.includes("${"), `${cls} contains an interpolation`);
    }
  });
});

describe("role is a lens, not a permission", () => {
  test("homeBrowseHref only ever produces a filter, never a block", () => {
    for (const role of ALL_ROLES) {
      const href = homeBrowseHref(role);
      assert.ok(href.startsWith("/browse"), `${role} must land on /browse`);
    }
  });

  test("every listing type is a home market for at least one role", () => {
    // If a market belonged to no role, it would be unreachable from every
    // dashboard feed — effectively a hidden market, which contradicts the
    // one-engine claim.
    const covered = new Set(ALL_ROLES.flatMap((r) => ROLE_META[r].homeMarkets));
    for (const type of LISTING_TYPES) {
      assert.ok(covered.has(type), `${type} is not a home market for any role`);
    }
  });

  /**
   * THE GUARD.
   *
   * The engine layer must never branch on organisation type. If this fails,
   * someone has started building four negotiation engines behind one UI, and
   * CLAUDE.md non-negotiable #1 is broken in spirit even if the table count
   * has not changed yet.
   */
  test("the engine layer does not import or branch on role", () => {
    const ENGINE_FILES = [
      "deals.ts",
      "bids.ts",
      "masking.ts",
      "bid-queries.ts",
      "listing-spec.ts",
      "auth.ts",
    ];

    for (const file of ENGINE_FILES) {
      const source = readFileSync(join(process.cwd(), "src", "lib", file), "utf8");

      assert.ok(
        !source.includes("from \"./roles\"") && !source.includes("from \"@/lib/roles\""),
        `src/lib/${file} imports the role config — the engine must not know about roles`,
      );

      for (const role of ALL_ROLES) {
        // Deliberately narrow: matches a comparison against the role literal,
        // not the mere appearance of the word (OrgType values legitimately
        // appear in masking's reputation payload).
        const branch = new RegExp(`[=!]==\\s*["']${role}["']`);
        assert.ok(
          !branch.test(source),
          `src/lib/${file} branches on ${role} — role must change composition, not capability`,
        );
      }
    }
  });
});
