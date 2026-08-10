import { getCurrentOrg } from "@/lib/auth";
import { BadgeCheck, Building2, MapPin, Phone, Mail, FileText, Star, Clock, TrendingUp } from "lucide-react";

export default async function ProfilePage() {
  const org = await getCurrentOrg();

  return (
    <main className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="type-heading text-2xl">Organisation Profile</h1>
        <p className="type-body text-text-secondary mt-1">Your business identity on IndusMate.</p>
      </div>

      {/* Public Profile Card */}
      <section className="rounded-xl border border-line bg-surface-raised p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="size-5 text-amber" />
          <h2 className="text-lg font-semibold">Public Profile</h2>
          <span className="text-xs text-text-tertiary">(visible to counterparties before deal acceptance)</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-lg bg-surface-sunken p-3">
            <span className="text-xs text-text-tertiary">Display Name</span>
            <span className="font-medium">{org.name}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-surface-sunken p-3">
            <span className="text-xs text-text-tertiary">Pseudonym Handle</span>
            <span className="font-medium font-mono text-sm">{org.pseudonymHandle}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-surface-sunken p-3">
            <span className="text-xs text-text-tertiary">Business Type</span>
            <span className="font-medium capitalize">{org.type.toLowerCase().replace("_", " ")}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-surface-sunken p-3">
            <span className="text-xs text-text-tertiary flex items-center gap-1"><MapPin className="size-3" /> City</span>
            <span className="font-medium">{org.city}</span>
          </div>
        </div>
      </section>

      {/* Reputation Card */}
      <section className="rounded-xl border border-line bg-surface-raised p-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="size-5 text-amber" />
          <h2 className="text-lg font-semibold">Reputation</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-1 rounded-lg bg-surface-sunken p-4 text-center">
            <Star className="size-6 text-amber" />
            <span className="text-2xl font-bold font-mono">{org.rating.toFixed(1)}</span>
            <span className="text-xs text-text-tertiary">Rating</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-surface-sunken p-4 text-center">
            <TrendingUp className="size-6 text-teal" />
            <span className="text-2xl font-bold font-mono">{org.dealCount}</span>
            <span className="text-xs text-text-tertiary">Deals Completed</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-surface-sunken p-4 text-center">
            <Clock className="size-6 text-blue-500" />
            <span className="text-2xl font-bold font-mono">{org.onTimePct}%</span>
            <span className="text-xs text-text-tertiary">On-Time Delivery</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2">
          {org.verified ? (
            <span className="flex items-center gap-1 rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal">
              <BadgeCheck className="size-3.5" /> KYC Verified
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-amber/10 px-3 py-1 text-xs font-medium text-amber">
              Pending Verification
            </span>
          )}
        </div>
      </section>

      {/* Private Identity Card */}
      <section className="rounded-xl border border-line bg-surface-raised p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="size-5 text-amber" />
          <h2 className="text-lg font-semibold">Private Identity</h2>
          <span className="text-xs text-text-tertiary">(revealed only after deal acceptance)</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-lg bg-surface-sunken p-3">
            <span className="text-xs text-text-tertiary">Legal Name</span>
            <span className="font-medium">{org.legalName}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-surface-sunken p-3">
            <span className="text-xs text-text-tertiary">GSTIN</span>
            <span className="font-medium font-mono text-sm">{org.gstin}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-surface-sunken p-3">
            <span className="text-xs text-text-tertiary flex items-center gap-1"><Phone className="size-3" /> Contact</span>
            <span className="font-medium">{org.contactName} — {org.contactPhone}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-surface-sunken p-3">
            <span className="text-xs text-text-tertiary flex items-center gap-1"><Mail className="size-3" /> Email</span>
            <span className="font-medium text-sm">{org.contactEmail}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
