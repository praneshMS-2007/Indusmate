import { prisma } from "@/lib/prisma";
import { BadgeCheck, FileText, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { processKyc } from "./actions";

export default async function AdminKycPage() {
  const pendingOrgs = await prisma.organisation.findMany({
    where: { kycStatus: "UNDER_REVIEW" },
    include: { kycDocuments: true },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="type-display text-3xl font-bold">KYC Verification Queue</h1>
        <p className="text-text-secondary mt-1">Review and approve documents for new organisations.</p>
      </div>

      {pendingOrgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line p-12 text-center text-text-tertiary">
          <BadgeCheck className="mb-4 size-12 opacity-50" />
          <p className="font-medium text-text-primary">No pending verifications</p>
          <p className="mt-1 text-sm">All caught up! New users will appear here when they upload their documents.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingOrgs.map(org => (
            <div key={org.id} className="rounded-xl border border-line bg-surface-raised p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-line-subtle pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{org.legalName}</h2>
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                      {org.type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    Contact: {org.contactName} ({org.contactPhone}) &middot; {org.city}
                  </p>
                  <p className="text-sm text-text-secondary">GSTIN: {org.gstin}</p>
                </div>
                
                <div className="flex gap-2">
                  <form action={processKyc.bind(null, org.id, "REJECTED")}>
                    <Button type="submit" variant="outline" className="text-red-500 hover:bg-red-500/10 hover:text-red-600">
                      <XCircle className="mr-2 size-4" /> Reject
                    </Button>
                  </form>
                  <form action={processKyc.bind(null, org.id, "APPROVED")}>
                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                      <BadgeCheck className="mr-2 size-4" /> Approve
                    </Button>
                  </form>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-text-secondary">Uploaded Documents</h3>
                {org.kycDocuments.length === 0 ? (
                  <p className="text-sm text-red-400">No documents found. User bypassed upload?</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {org.kycDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
                        <div className="rounded bg-blue-500/10 p-2 text-blue-500">
                          <FileText className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{doc.documentType}</p>
                          <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer" className="truncate text-xs text-amber hover:underline">
                            {doc.fileName}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
