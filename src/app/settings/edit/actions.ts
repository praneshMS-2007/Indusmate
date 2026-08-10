"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentOrg } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateOrgDetails(formData: FormData) {
  const org = await getCurrentOrg();

  const name = (formData.get("name") as string)?.trim();
  const legalName = (formData.get("legalName") as string)?.trim();
  const contactName = (formData.get("contactName") as string)?.trim();
  const contactPhone = (formData.get("contactPhone") as string)?.trim();
  const contactEmail = (formData.get("contactEmail") as string)?.trim();

  if (!name || !legalName || !contactName || !contactPhone || !contactEmail) {
    throw new Error("All fields are required");
  }

  await prisma.organisation.update({
    where: { id: org.id },
    data: { name, legalName, contactName, contactPhone, contactEmail },
  });

  revalidatePath("/settings");
  redirect("/settings/profile");
}
