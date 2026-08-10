import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROLE_META } from "@/lib/roles";
import { OnboardingForm } from "./onboarding-form";
import type { OrgType } from "@prisma/client";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  // If user already has an org, redirect to home
  if ((session.user as any).orgId) {
    redirect("/");
  }

  const params = await searchParams;
  const roleParam = params.role as string;
  const isValidRole = ["MANUFACTURER", "SUPPLIER", "TRANSPORTER", "RECYCLER"].includes(roleParam);
  
  if (!isValidRole) {
    redirect("/welcome"); // Go back and pick a valid role
  }

  const role = roleParam as OrgType;
  const meta = ROLE_META[role];
  const Icon = meta.icon;

  return (
    <div className="flex min-h-dvh flex-col items-center bg-surface p-4 pt-12">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <header className="flex flex-col gap-2 text-center">
          <p className="type-eyebrow">Step 2 of 3</p>
          <h1 className="type-heading text-2xl">Complete your profile</h1>
          <p className="type-body text-sm">
            Set up your organisation details as a <strong>{meta.label}</strong>.
          </p>
        </header>

        <div className="elevated rounded-xl border border-line bg-surface-raised p-6 shadow-e2">
          <div className="mb-6 flex items-center gap-3 rounded-md border border-line-subtle bg-surface-sunken p-3">
            <Icon className={`size-6 ${meta.accentClass}`} />
            <div>
              <p className="text-sm font-medium">{meta.label}</p>
              <p className="type-caption">{meta.tagline}</p>
            </div>
          </div>
          
          <OnboardingForm role={role} />
        </div>
      </div>
    </div>
  );
}
