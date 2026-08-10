/**
 * Authentication and authorisation helpers.
 *
 * Real credential-based authentication using NextAuth with bcrypt-hashed
 * passwords. Users sign up with email + password, and the session JWT
 * carries their `orgId` for server-side authorisation.
 *
 * Every API route and every server component resolves the acting organisation
 * through `getCurrentOrg()` below, which reads the JWT session server-side.
 * No route ever trusts an organisation id sent by the client. If it did,
 * the anonymity rule would be one fetch call away from being bypassed.
 */

import { prisma } from "./prisma";
import type { Organisation } from "@prisma/client";
import { auth } from "@/auth";

/**
 * The acting organisation for this request.
 *
 * THE authorisation source of truth. Never accept an org id from a request
 * body or query string in its place.
 */
export async function getCurrentOrg(): Promise<Organisation> {
  const session = await auth();
  
  if (!session?.user || !(session.user as any).orgId) {
    throw new Error("Unauthorized: No organisation found for current user.");
  }

  const orgId = (session.user as any).orgId;
  const org = await prisma.organisation.findUnique({
    where: { id: orgId }
  });

  if (!org) {
    throw new Error("Organisation not found in database.");
  }

  return org;
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
