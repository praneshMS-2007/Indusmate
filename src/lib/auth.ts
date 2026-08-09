/**
 * Stubbed demo authentication.
 *
 * There are no passwords, no signup and no email. A cookie names which seeded
 * organisation you are currently acting as. That is the entire auth system,
 * and it is deliberate — this is a 24-hour build and real auth would buy the
 * demo nothing.
 *
 * What is NOT stubbed is where authorisation reads from. Every API route and
 * every server component resolves the acting organisation through
 * `getCurrentOrg()` below, which reads the cookie server-side. No route ever
 * trusts an organisation id sent by the client. If it did, the anonymity rule
 * would be one fetch call away from being bypassed.
 */

import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { Organisation } from "@prisma/client";

export const DEMO_ORG_COOKIE = "nx_demo_org";

/**
 * The account the demo opens on: the manufacturer that posts the freight leg
 * in step 2 of the demo script. Falls back to whatever exists if absent.
 */
const DEFAULT_ORG_ID = "org_chambal_steel";

/**
 * The acting organisation for this request.
 *
 * THE authorisation source of truth. Never accept an org id from a request
 * body or query string in its place.
 */
export async function getCurrentOrg(): Promise<Organisation> {
  const store = await cookies();
  const id = store.get(DEMO_ORG_COOKIE)?.value;

  if (id) {
    const org = await prisma.organisation.findUnique({ where: { id } });
    if (org) return org;
    // Cookie points at an org that no longer exists — e.g. after a re-seed.
    // Fall through rather than throwing, so a stale cookie cannot brick the
    // app mid-demo.
  }

  const fallback =
    (await prisma.organisation.findUnique({ where: { id: DEFAULT_ORG_ID } })) ??
    (await prisma.organisation.findFirst({ orderBy: { name: "asc" } }));

  if (!fallback) {
    throw new Error(
      "No organisations in the database. Run `npm run seed` before starting the app.",
    );
  }
  return fallback;
}

/**
 * What the account switcher is allowed to know about an organisation.
 *
 * Deliberately NOT the Prisma row. The switcher is a client component, so
 * whatever it receives is serialised into the HTML of every single page.
 */
export interface DemoOrgOption {
  id: string;
  name: string;
  type: Organisation["type"];
  city: string;
  verified: boolean;
  rating: number;
  dealCount: number;
  onTimePct: number;
}

/**
 * Fields the switcher may receive.
 *
 * SECURITY — read before adding to this list.
 *
 * `pseudonymHandle` is absent on purpose, and it is the important omission.
 * The switcher shows real organisation names. The bid inbox shows pseudonym
 * handles. If a single payload ever carried BOTH, anyone could open view
 * source and build the handle → real-name lookup table, and every masked bid
 * on the platform would be trivially de-anonymised. The two identifiers must
 * never travel together.
 *
 * legalName, contactName, contactPhone, contactEmail and gstin are absent for
 * the plainer reason that a counterparty has no business holding them before
 * a deal is accepted.
 */
const DEMO_ORG_FIELDS = {
  id: true,
  name: true,
  type: true,
  city: true,
  verified: true,
  rating: true,
  dealCount: true,
  onTimePct: true,
} as const;

/** Every organisation, for the account switcher. Public fields only. */
export async function listDemoOrgs(): Promise<DemoOrgOption[]> {
  return prisma.organisation.findMany({
    select: DEMO_ORG_FIELDS,
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

/** Narrow a full row down before handing it to a client component. */
export function toDemoOrgOption(org: Organisation): DemoOrgOption {
  return {
    id: org.id,
    name: org.name,
    type: org.type,
    city: org.city,
    verified: org.verified,
    rating: org.rating,
    dealCount: org.dealCount,
    onTimePct: org.onTimePct,
  };
}

/**
 * Public-safe view of an organisation — reputation without identity.
 *
 * This is the shape a counterparty may see before a deal reaches ACCEPTED.
 * Note what is absent: legalName, contactName, contactPhone, contactEmail,
 * gstin. Block 4's maskBid() builds on this.
 */
export interface PublicOrg {
  id: string;
  pseudonymHandle: string;
  type: Organisation["type"];
  verified: boolean;
  rating: number;
  dealCount: number;
  onTimePct: number;
}

export function toPublicOrg(org: Organisation): PublicOrg {
  return {
    id: org.id,
    pseudonymHandle: org.pseudonymHandle,
    type: org.type,
    verified: org.verified,
    rating: org.rating,
    dealCount: org.dealCount,
    onTimePct: org.onTimePct,
  };
}
