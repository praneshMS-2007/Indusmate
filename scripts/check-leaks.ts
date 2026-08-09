/**
 * Identity leak scan.
 *
 * Fetches every page from a running server and greps the RAW response — not
 * the rendered UI — for data that must never reach a browser. Checking the UI
 * is not enough: a field can be absent from the screen and still be sitting in
 * the React payload, one "view source" away.
 *
 * Two classes of leak:
 *   1. Private fields — legal name, contact, GSTIN. Never public.
 *   2. The MAPPING — a pseudonym handle rendered NEAR its owner's real name,
 *      i.e. paired inside the same object or the same block of markup. That is
 *      a lookup table, and it de-anonymises every masked bid on the platform.
 *
 *      Note the deliberate narrowness. Both strings merely existing somewhere
 *      in one response is NOT a leak: the demo account switcher legitimately
 *      lists all twelve organisations by name, and a bid inbox legitimately
 *      lists handles. Knowing "the bidder is one of three transporters" is
 *      not a breach — the roster is public. The breach is knowing WHICH. So
 *      the test is proximity, not co-occurrence.
 *
 * Usage:  npm run start   (in one terminal)
 *         npm run check:leaks
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = process.env.SCAN_BASE ?? "http://localhost:3000";

/** The organisation the scan browses as. */
const VIEWER = process.env.SCAN_AS ?? "org_chambal_steel";

/**
 * Pages where a counterparty's identity is legitimately visible, because the
 * viewer has an accepted deal with them.
 *
 * Note what this does NOT do: it does not blanket-allow those pages. The
 * entitled set is computed from the database — counterparties on THIS viewer's
 * deals that have actually reached a reveal state — so an identity belonging
 * to anyone else still fails, even on /deals. Silencing the page wholesale
 * would have removed the check from the one screen where reveal happens, which
 * is precisely where a mistake would matter most.
 */
const REVEAL_PAGES = new Set(["/deals"]);

/** Pages that must never expose identity. Extend as screens are added. */
const PAGES = [
  "/",
  "/welcome",
  "/browse",
  "/browse?type=FREIGHT",
  "/listings/new",
  "/listings/lst_freight_malanpur_pithampur",
  "/listings/lst_byproduct_flyash",
  "/my/listings",
  "/my/bids",
  "/deals",
  "/map",
  "/styleguide",
];

/**
 * The styleguide deliberately renders one revealed card to demonstrate the
 * post-acceptance state, so its sample identity is expected there and only
 * there.
 */
const EXPECTED: Record<string, string[]> = {
  "/styleguide": ["Trishul Logistics Private Limited", "Harpreet Singh Bhatia", "+91 99816 30052"],
};

/**
 * Self-test. `LEAK_SELFTEST=1` drops the allowlist, which MUST make the
 * styleguide fail on its deliberately-revealed sample card.
 *
 * A leak scanner that has never once failed is indistinguishable from a
 * scanner that greps for nothing. This is how we know it still has teeth.
 */
const SELFTEST = process.env.LEAK_SELFTEST === "1";

/**
 * Characters within which a handle and a name count as "paired".
 *
 * Roughly one serialised object or one component's markup. Wide enough to
 * catch `{handle, name}` in the same payload node; narrow enough not to fire
 * on two unrelated regions of a long page.
 */
const PROXIMITY = 400;

/** Smallest gap between any occurrence of `a` and any of `b`, or null. */
function withinProximity(body: string, a: string, b: string, limit: number): number | null {
  const positions = (needle: string) => {
    const out: number[] = [];
    let i = body.indexOf(needle);
    while (i !== -1) {
      out.push(i);
      i = body.indexOf(needle, i + 1);
    }
    return out;
  };

  const as = positions(a);
  const bs = positions(b);
  if (as.length === 0 || bs.length === 0) return null;

  let best = Infinity;
  for (const x of as) for (const y of bs) best = Math.min(best, Math.abs(x - y));
  return best <= limit ? best : null;
}

/**
 * Identities this viewer has earned the right to see: counterparties on deals
 * they are party to, where the deal has actually reached a reveal state.
 */
async function entitledIdentities(viewerOrgId: string): Promise<Set<string>> {
  const deals = await prisma.deal.findMany({
    where: {
      OR: [{ buyerOrgId: viewerOrgId }, { sellerOrgId: viewerOrgId }],
      state: { in: ["ACCEPTED", "CONTRACTED", "IN_EXECUTION", "SETTLED", "RATED", "CANCELLED"] },
    },
    include: { buyerOrg: true, sellerOrg: true },
  });

  const allowed = new Set<string>();
  for (const d of deals) {
    const other = d.buyerOrgId === viewerOrgId ? d.sellerOrg : d.buyerOrg;
    for (const v of [
      other.legalName,
      other.contactName,
      other.contactPhone,
      other.contactEmail,
      other.gstin,
    ]) {
      allowed.add(v);
    }
  }
  return allowed;
}

async function main() {
  const orgs = await prisma.organisation.findMany();
  const entitled = SELFTEST ? new Set<string>() : await entitledIdentities(VIEWER);
  let failures = 0;

  console.log(`\nIdentity leak scan — ${BASE}`);
  console.log(`browsing as ${VIEWER}; ${entitled.size} identity strings legitimately revealed`);
  console.log("═".repeat(78));

  for (const path of PAGES) {
    const res = await fetch(BASE + path, { headers: { Cookie: `nx_demo_org=${VIEWER}` } });
    const body = await res.text();
    const allowed = SELFTEST
      ? []
      : [...(EXPECTED[path] ?? []), ...(REVEAL_PAGES.has(path) ? [...entitled] : [])];
    const hits: string[] = [];

    for (const org of orgs) {
      // --- class 1: fields that are never public -------------------------
      for (const [field, value] of [
        ["legalName", org.legalName],
        ["contactName", org.contactName],
        ["contactPhone", org.contactPhone],
        ["contactEmail", org.contactEmail],
        ["gstin", org.gstin],
      ] as const) {
        if (body.includes(value) && !allowed.includes(value)) {
          hits.push(`${field} "${value}" (${org.name})`);
        }
      }

      // --- class 2: the handle -> real name mapping ----------------------
      if (!allowed.some((a) => a.includes(org.name))) {
        const near = withinProximity(body, org.pseudonymHandle, org.name, PROXIMITY);
        if (near !== null) {
          hits.push(
            `MAPPING: "${org.pseudonymHandle}" rendered ${near} chars from "${org.name}"`,
          );
        }
      }
    }

    if (hits.length === 0) {
      console.log(`  PASS  ${path}`);
    } else {
      failures += hits.length;
      console.log(`  FAIL  ${path}`);
      for (const h of hits) console.log(`          ${h}`);
    }
  }

  console.log("═".repeat(78));
  if (failures === 0) {
    console.log("No identity leaked in any response.\n");
  } else {
    console.log(`${failures} leak(s) found — this is the highest-severity bug class here.\n`);
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error("Scan failed:", e instanceof Error ? e.message : e);
    console.error("Is the server running? `npm run start`");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
