"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentOrg } from "@/lib/auth";

export async function processKyc(orgId: string, status: "APPROVED" | "REJECTED") {
  const admin = await getCurrentOrg();
  if (admin.type !== "PLATFORM_ADMIN") {
    throw new Error("Unauthorized");
  }

  await prisma.organisation.update({
    where: { id: orgId },
    data: { 
      kycStatus: status,
      verified: status === "APPROVED" // Automatically check 'verified' if approved
    }
  });

  revalidatePath("/admin/kyc");
}
