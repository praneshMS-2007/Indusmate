import Link from "next/link";
import { PackageOpen, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentOrg } from "@/lib/auth";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";

export default async function MyListingsPage() {
  const org = await getCurrentOrg();

  const listings = await prisma.listing.findMany({
    where: { ownerOrgId: org.id },
    include: { _count: { select: { bids: true } } },
    orderBy: [{ status: "asc" }, { closesAt: "asc" }],
  });

  return (
    <main className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Listings</h1>
          <p className="text-sm text-muted-foreground">
            Posted by <span className="text-foreground">{org.name}</span>
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/listings/new">
            <Plus className="size-4" />
            Post a listing
          </Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/60 py-16 text-center">
          <PackageOpen className="size-8 text-muted-foreground/50" />
          <div>
            <p className="font-medium">{org.name} has not posted anything yet</p>
            <p className="text-sm text-muted-foreground">
              Any of the five markets, one form.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/listings/new">
              <Plus className="size-4" />
              Post your first listing
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} bidCount={l._count.bids} />
          ))}
        </div>
      )}
    </main>
  );
}
