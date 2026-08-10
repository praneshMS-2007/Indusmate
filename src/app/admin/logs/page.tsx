import { prisma } from "@/lib/prisma";
import { BadgeCheck, FileText, XCircle, History, CheckCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { processKyc } from "../kyc/actions";
import Link from "next/link";

export default async function AdminLogsPage() {
  const processedOrgs = await prisma.organisation.findMany({
    where: { 
      kycStatus: {
        in: ["APPROVED", "REJECTED"]
      }
    },
    include: { kycDocuments: true },
    orderBy: { createdAt: "desc" }
  });

  const approvedCount = processedOrgs.filter(o => o.kycStatus === "APPROVED").length;
  const rejectedCount = processedOrgs.filter(o => o.kycStatus === "REJECTED").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="type-display text-3xl font-bold">Verification Logs</h1>
          <p className="text-text-secondary mt-1">Audit log of all approved and rejected organisation KYC verifications.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/kyc">
            <Button variant="outline" size="sm">
              View Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-line bg-surface-raised p-4 flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal">
            <CheckCircle className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-teal">{approvedCount}</div>
            <div className="text-xs text-text-tertiary font-medium">Approved Organisations</div>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface-raised p-4 flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
            <XCircle className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">{rejectedCount}</div>
            <div className="text-xs text-text-tertiary font-medium">Rejected Organisations</div>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface-raised p-4 flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber">
            <History className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber">{processedOrgs.length}</div>
            <div className="text-xs text-text-tertiary font-medium">Total Audited Records</div>
          </div>
        </div>
      </div>

      {/* Log Entries */}
      {processedOrgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line p-12 text-center text-text-tertiary">
          <History className="mb-4 size-12 opacity-50" />
          <p className="font-medium text-text-primary">No logs recorded yet</p>
          <p className="mt-1 text-sm">When you approve or reject organisation verifications in the queue, logs will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {processedOrgs.map(org => {
            const isApproved = org.kycStatus === "APPROVED";
            return (
              <div key={org.id} className="rounded-xl border border-line bg-surface-raised p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-line-subtle pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold">{org.legalName}</h2>
                      <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs font-semibold text-text-secondary border border-line">
                        {org.type}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        isApproved ? "bg-teal-500/15 text-teal" : "bg-red-500/15 text-red-500"
                      }`}>
                        {isApproved ? (
                          <>
                            <CheckCircle className="size-3.5" /> APPROVED
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3.5" /> REJECTED
                          </>
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      Contact: <strong className="text-text-primary">{org.contactName}</strong> ({org.contactPhone} &middot; {org.contactEmail})
                    </p>
                    <p className="text-sm text-text-secondary">
                      Location: {org.city} &middot; GSTIN: <span className="font-mono text-xs text-text-primary">{org.gstin}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isApproved ? (
                      <form action={processKyc.bind(null, org.id, "REJECTED")}>
                        <Button type="submit" variant="outline" size="sm" className="text-red-500 hover:bg-red-500/10 hover:text-red-600">
                          <XCircle className="mr-1.5 size-3.5" /> Revoke & Reject
                        </Button>
                      </form>
                    ) : (
                      <form action={processKyc.bind(null, org.id, "APPROVED")}>
                        <Button type="submit" size="sm" className="bg-teal text-on-teal hover:bg-teal/90 font-semibold">
                          <BadgeCheck className="mr-1.5 size-3.5" /> Re-Approve
                        </Button>
                      </form>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">Verified Documents ({org.kycDocuments.length})</h3>
                  {org.kycDocuments.length === 0 ? (
                    <p className="text-xs text-text-tertiary">No uploaded document files recorded.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {org.kycDocuments.map(doc => (
                        <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3">
                          <div className="rounded bg-teal/10 p-2 text-teal">
                            <FileText className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold">{doc.documentType}</p>
                            <a 
                              href={`/api/documents/${doc.id}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="truncate text-xs text-amber hover:underline block"
                            >
                              {doc.fileName}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
