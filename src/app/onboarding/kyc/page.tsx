import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitKycDocuments } from "./actions";
import { AlertCircle, FileText, UploadCloud } from "lucide-react";

export default async function KycUploadPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Try JWT orgId first, then fall back to database lookup.
  // After onboarding, the JWT hasn't refreshed yet so orgId may be missing.
  let org;
  const jwtOrgId = (session.user as any).orgId;
  if (jwtOrgId) {
    org = await prisma.organisation.findUnique({ where: { id: jwtOrgId } });
  }
  if (!org) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { org: true } });
    org = user?.org;
  }
  if (!org) redirect("/welcome");

  if (org.kycStatus !== "PENDING_UPLOAD") {
    if (org.kycStatus === "UNDER_REVIEW") redirect("/onboarding/kyc/pending");
    if (org.kycStatus === "REJECTED") redirect("/onboarding/kyc/rejected");
    if (org.kycStatus === "APPROVED") redirect("/");
  }

  // Determine required documents based on OrgType
  let requiredDocs: { id: string; label: string; desc: string }[] = [];
  
  switch (org.type) {
    case "TRANSPORTER":
      requiredDocs = [
        { id: "RC_BOOK", label: "RC Book (Registration Certificate)", desc: "Upload the RC for your primary fleet vehicles." },
        { id: "VEHICLE_PERMIT", label: "National/State Vehicle Permit", desc: "Valid permit documentation." },
        { id: "FLEET_INSURANCE", label: "Fleet Insurance Policy", desc: "Active commercial insurance." },
      ];
      break;
    case "MANUFACTURER":
      requiredDocs = [
        { id: "FACTORY_LICENSE", label: "Factory License", desc: "Valid license under the Factories Act." },
        { id: "GST_CERT", label: "GST Certificate", desc: "Your GST registration document." },
        { id: "PCB_CLEARANCE", label: "Pollution Control Board Clearance", desc: "Valid Consent to Operate (CTO)." },
      ];
      break;
    case "SUPPLIER":
      requiredDocs = [
        { id: "GST_CERT", label: "GST Certificate", desc: "Your GST registration document." },
        { id: "TRADE_LICENSE", label: "Trade License", desc: "Issued by the local municipal authority." },
      ];
      break;
    case "RECYCLER":
      requiredDocs = [
        { id: "PCB_AUTH", label: "PCB Authorization", desc: "Authorization under E-Waste / Hazardous Waste Rules." },
        { id: "HAZMAT_LICENSE", label: "Hazardous Waste License", desc: "Valid license for handling hazardous materials." },
        { id: "GST_CERT", label: "GST Certificate", desc: "Your GST registration document." },
      ];
      break;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface p-4">
      <div className="w-full max-w-2xl rounded-xl border border-line bg-surface-raised p-6 shadow-sm sm:p-10">
        
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <UploadCloud className="size-6" />
          </div>
          <h1 className="type-display text-2xl font-bold">Upload KYC Documents</h1>
          <p className="mt-2 text-sm text-text-secondary">
            As a <strong className="text-text-primary">{org.type}</strong>, you need to provide the following documents to verify your business before you can start trading on IndusMate.
          </p>
        </div>

        <form action={submitKycDocuments} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {requiredDocs.map((doc) => (
              <div key={doc.id} className="flex flex-col gap-2 rounded-lg border border-line-subtle p-4">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-text-tertiary" />
                  <label htmlFor={doc.id} className="font-semibold text-sm">{doc.label}</label>
                </div>
                <p className="text-xs text-text-tertiary">{doc.desc}</p>
                <Input 
                  type="file" 
                  id={doc.id} 
                  name={doc.id} 
                  required 
                  className="mt-2 cursor-pointer text-sm"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
            ))}
          </div>
          
          <div className="flex items-start gap-3 rounded-lg bg-blue-500/10 p-4 text-blue-600 dark:text-blue-400">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <p className="text-xs leading-relaxed">
              Your documents will be reviewed by our platform administrators. This process typically takes 2-4 hours. You will be unable to access the main platform until your account is approved.
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              Submit Documents
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
