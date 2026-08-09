"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { DEMO_ORG_COOKIE } from "./auth";
import { prisma } from "./prisma";

/**
 * Switch the demo account.
 *
 * Validates the id against the database rather than trusting it — even in a
 * stubbed auth system, writing an unvalidated client string into a cookie that
 * later drives authorisation is the wrong habit to build.
 */
export async function switchDemoOrg(orgId: string): Promise<void> {
  const org = await prisma.organisation.findUnique({
    where: { id: orgId },
    select: { id: true },
  });
  if (!org) throw new Error("Unknown organisation");

  const store = await cookies();
  store.set(DEMO_ORG_COOKIE, org.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  // The acting org changes what every page renders, so revalidate everything.
  revalidatePath("/", "layout");
}
