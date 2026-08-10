"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentOrg } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Resets a rejected organisation's KYC status back to PENDING_UPLOAD
 * so they can re-upload their documents.
 */
export async function resubmitKyc() {
  const org = await getCurrentOrg();
  
  if (org.kycStatus !== "REJECTED") {
    throw new Error("Organisation is not in REJECTED state");
  }

  // Delete old documents so they can upload fresh ones
  await prisma.kycDocument.deleteMany({
    where: { orgId: org.id }
  });

  await prisma.organisation.update({
    where: { id: org.id },
    data: { kycStatus: "PENDING_UPLOAD" }
  });

  redirect("/onboarding/kyc");
}
