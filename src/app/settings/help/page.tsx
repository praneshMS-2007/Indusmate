import { HelpCircle, BookOpen, Shield, Scale, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

const FAQ = [
  {
    q: "How does sealed bidding work?",
    a: "When you bid on a listing, your bid amount is hidden from all other bidders. The listing owner can see bid amounts and reputation scores, but not your identity. Your identity is only revealed after a deal is accepted by both parties."
  },
  {
    q: "What happens after a deal is accepted?",
    a: "Once accepted, both parties' real identities (legal name, contact details, GSTIN) are revealed to each other. The deal then moves through: Contracted → In Execution → Settled → Rated."
  },
  {
    q: "Can I bid on any listing regardless of my role?",
    a: "Yes. IndusMate runs one engine for all five markets. While your dashboard is arranged for your business type, every user can post listings and bid on any market — raw materials, byproducts, equipment, labour, or freight."
  },
  {
    q: "How does the AI byproduct matcher work?",
    a: "When you post a byproduct listing with its chemical composition, our AI (powered by Google Gemini) analyses the specification — without being told the material name — and identifies which industries could use it as feedstock, along with price estimates and applicable Indian standards."
  },
  {
    q: "What is the KYC verification process?",
    a: "New users must upload role-specific documents (e.g., RC Book for Transporters, Factory License for Manufacturers). Platform administrators review these documents and either approve or reject your account. You cannot access the marketplace until approved."
  },
  {
    q: "How are prices determined?",
    a: "IndusMate supports two auction directions: Reverse (sellers bid prices down, used for freight and tenders) and Forward (buyers bid prices up, used for scarce byproducts). The listing owner sets the direction and a reference price."
  },
];

export default function HelpPage() {
  return (
    <main className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="type-heading text-2xl">Help & Support</h1>
        <p className="type-body text-text-secondary mt-1">Learn how IndusMate works and get answers to common questions.</p>
      </div>

      {/* Quick Links */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface-raised p-5 text-center">
          <BookOpen className="size-6 text-amber" />
          <span className="text-sm font-semibold">5 Markets</span>
          <span className="text-xs text-text-tertiary">Raw Materials, Byproducts, Equipment, Labour, Freight</span>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface-raised p-5 text-center">
          <Shield className="size-6 text-teal" />
          <span className="text-sm font-semibold">Sealed Bidding</span>
          <span className="text-xs text-text-tertiary">Bids are hidden. Identity revealed only after acceptance.</span>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface-raised p-5 text-center">
          <Scale className="size-6 text-blue-500" />
          <span className="text-sm font-semibold">Fair Pricing</span>
          <span className="text-xs text-text-tertiary">Reverse and forward auctions for every market.</span>
        </div>
      </section>

      {/* FAQ */}
      <section className="rounded-xl border border-line bg-surface-raised p-6">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="size-5 text-amber" />
          <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
        </div>

        <div className="flex flex-col divide-y divide-line">
          {FAQ.map((item, i) => (
            <div key={i} className="py-4 first:pt-0 last:pb-0">
              <h3 className="text-sm font-semibold">{item.q}</h3>
              <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-xl border border-line bg-surface-raised p-6">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="size-5 text-amber" />
          <h2 className="text-lg font-semibold">Still need help?</h2>
        </div>
        <p className="text-sm text-text-secondary">
          Contact IndusMate platform support at{" "}
          <a href="mailto:support@indusmate.com" className="text-amber hover:underline">support@indusmate.com</a>
        </p>
      </section>
    </main>
  );
}
