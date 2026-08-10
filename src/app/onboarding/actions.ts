"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { OrgType } from "@prisma/client";
import { redirect } from "next/navigation";

export async function submitOnboarding(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const role = formData.get("role") as OrgType;
  const orgName = formData.get("orgName") as string;
  const legalName = formData.get("legalName") as string;
  const city = formData.get("city") as string;
  const gstin = formData.get("gstin") as string;
  const contactName = formData.get("contactName") as string;
  const contactPhone = formData.get("contactPhone") as string;

  if (!role || !orgName || !legalName || !city || !gstin || !contactName || !contactPhone) {
    return { error: "All fields are required" };
  }

  // Check if user already has an org
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.orgId) {
    return { error: "You already have an organisation attached." };
  }

  // Generate a random pseudonym handle
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const pseudonymHandle = `Verified ${role.charAt(0) + role.slice(1).toLowerCase()} #${randomSuffix}`;

  try {
    const org = await prisma.organisation.create({
      data: {
        name: orgName,
        type: role,
        city,
        lat: Number(formData.get("lat")) || 28.6139,
        lng: Number(formData.get("lng")) || 77.2090,
        legalName,
        contactName,
        contactPhone,
        contactEmail: session.user.email!,
        gstin,
        pseudonymHandle,
        verified: false, // Wait for KYC
        kycStatus: "PENDING_UPLOAD",
        rating: 0,
        dealCount: 0,
        onTimePct: 0,
        users: {
          connect: { id: session.user.id }
        }
      }
    });

    return { success: true, orgId: org.id };
  } catch (err: any) {
    console.error("Failed to create org:", err);
    return { error: "Failed to create organisation. Please try again." };
  }
}
