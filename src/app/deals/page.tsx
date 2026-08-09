import Link from "next/link";
import { Handshake } from "lucide-react";

import { getCurrentOrg } from "@/lib/auth";
import { getDealsForOrg } from "@/lib/bid-queries";
import { DealCard, type DealCardData } from "@/components/deal-card";
import { Button } from "@/components/ui/button";
import type { ListingType } from "@/lib/listing-spec";

export default async function DealsPage() {
  const org = await getCurrentOrg();
  const deals = await getDealsForOrg(org.id);

  // Identity is safe to expose here without masking: a Deal row only exists
  // because it reached ACCEPTED, and this query already restricts to deals
  // this organisation is a party to.
  const cards: DealCardData[] = deals.map((d) => {
    const isBuyer = d.buyerOrgId === org.id;
    const other = isBuyer ? d.sellerOrg : d.buyerOrg;
    return {
      id: d.id,
      state: d.state,
      price: d.price,
      role: isBuyer ? "buyer" : "seller",
      listing: { id: d.listing.id, title: d.listing.title, type: d.listing.type as ListingType },
      counterparty: {
        name: other.name,
        legalName: other.legalName,
        city: other.city,
        contactName: other.contactName,
        contactPhone: other.contactPhone,
        verified: other.verified,
        rating: other.rating,
      },
      events: d.events.map((e) => ({
        id: e.id,
        fromState: e.fromState,
        toState: e.toState,
        actorName: e.actorOrg.name,
        note: e.note,
        createdAt: e.createdAt,
      })),
    };
  });

  return (
    <main className="flex flex-col gap-5">
      <div>
        <h1 className="type-display text-2xl">Deals</h1>
        <p className="text-sm text-text-secondary">
          Every deal <span className="text-text-primary">{org.name}</span> is party to, and the
          audit trail behind it.
        </p>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-line-strong py-16 text-center">
          <Handshake className="size-8 text-text-tertiary" />
          <div>
            <p className="font-medium">No deals yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-text-secondary">
              A deal is created the moment a bid is accepted — that is also when both sides learn
              who they are dealing with. Place a bid or accept one to start.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/browse">Browse open listings</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {cards.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </main>
  );
}
