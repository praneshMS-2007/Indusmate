import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Clock, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function KycPendingPage() {
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

  if (org.kycStatus !== "UNDER_REVIEW") {
    if (org.kycStatus === "PENDING_UPLOAD") redirect("/onboarding/kyc");
    if (org.kycStatus === "REJECTED") redirect("/onboarding/kyc/rejected");
    if (org.kycStatus === "APPROVED") redirect("/");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface-raised p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
          <Clock className="size-8" />
        </div>
        <h1 className="type-display text-2xl font-bold">Verification Pending</h1>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          Thank you for submitting your documents. Our platform administrators are currently reviewing them. 
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          This process ensures a safe trading environment and usually takes <strong className="text-text-primary">2-4 hours</strong>.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button asChild variant="outline">
            <Link href="/onboarding/kyc/pending">
              <RefreshCcw className="mr-2 size-4" />
              Check Status Again
            </Link>
          </Button>
          <Button asChild variant="ghost" className="text-text-tertiary">
            <Link href="/api/auth/signout">Log out</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
