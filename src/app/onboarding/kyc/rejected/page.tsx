import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { resubmitKyc } from "./actions";
import { LogoutButton } from "@/components/logout-button";

export default async function KycRejectedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let org;
  const jwtOrgId = (session.user as any).orgId;
  if (jwtOrgId) org = await prisma.organisation.findUnique({ where: { id: jwtOrgId } });
  if (!org) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { org: true } });
    org = user?.org;
  }
  if (!org) redirect("/welcome");

  if (org.kycStatus !== "REJECTED") {
    if (org.kycStatus === "PENDING_UPLOAD") redirect("/onboarding/kyc");
    if (org.kycStatus === "UNDER_REVIEW") redirect("/onboarding/kyc/pending");
    if (org.kycStatus === "APPROVED") redirect("/");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/20 bg-surface-raised p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <AlertTriangle className="size-8" />
        </div>
        <h1 className="type-display text-2xl font-bold text-red-500">Verification Denied</h1>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          We regret to inform you that your KYC verification was rejected by our platform administrators.
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          This could be due to <strong className="text-text-primary">invalid, illegible, or fraudulent documentation</strong>.
        </p>
        
        <div className="mt-6 rounded-lg bg-red-500/5 p-4 border border-red-500/10">
          <p className="text-xs text-red-500/90 text-left">
            <strong>Note:</strong> Repeated submission of fraudulent documents will result in a permanent ban.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <form action={resubmitKyc}>
            <Button type="submit" variant="default" className="w-full bg-red-600 hover:bg-red-700 text-white">
              Upload Documents Again
            </Button>
          </form>
          <LogoutButton 
            label="Log out" 
            variant="ghost" 
            className="w-full text-text-tertiary" 
          />
        </div>
      </div>
    </div>
  );
}
