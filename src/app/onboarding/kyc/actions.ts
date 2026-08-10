"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function submitKycDocuments(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Look up org via JWT first, then fall back to User relationship
  let org;
  const jwtOrgId = (session.user as any).orgId;
  if (jwtOrgId) {
    org = await prisma.organisation.findUnique({ where: { id: jwtOrgId } });
  }
  if (!org) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { org: true } });
    org = user?.org;
  }
  if (!org) {
    throw new Error("No organization found");
  }

  // Get all uploaded document types from the form
  const entries = Array.from(formData.entries());
  
  // Store actual files as Base64 strings in the database
  for (const [key, value] of entries) {
    if (value instanceof File && value.size > 0) {
      const buffer = Buffer.from(await value.arrayBuffer());
      const base64Data = buffer.toString("base64");
      
      await prisma.kycDocument.create({
        data: {
          orgId: org.id,
          documentType: key,
          fileName: value.name,
          mimeType: value.type || "application/octet-stream",
          fileData: base64Data
        }
      });
    }
  }

  // Update status to UNDER_REVIEW
  await prisma.organisation.update({
    where: { id: org.id },
    data: { kycStatus: "UNDER_REVIEW" }
  });

  // Redirect to the pending page
  redirect("/onboarding/kyc/pending");
}
