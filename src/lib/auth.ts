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

/** Every organisation, for the account switcher. */
export async function listDemoOrgs(): Promise<Organisation[]> {
  return prisma.organisation.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
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
