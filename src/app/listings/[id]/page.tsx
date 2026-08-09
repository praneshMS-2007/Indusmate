import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Clock, Handshake, MapPin, Star, TrendingDown, TrendingUp } from "lucide-react";

import { DEAL_STATE_LABEL } from "@/lib/deals";

import { getCurrentOrg } from "@/lib/auth";
import { getListingBidView } from "@/lib/bid-queries";
import { BidPanel } from "@/components/bid-panel";
import { SymbiosisMatcher } from "@/components/symbiosis-matcher";
import { RouteMap } from "@/components/map/route-map";
import { LISTING_TYPE_META, specSummary, type ListingType } from "@/lib/listing-spec";
import { formatWindow, rupees, timeRemaining } from "@/lib/format";
import { ORG_TYPE_META } from "@/components/org-meta";
import { Badge } from "@/components/ui/badge";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const viewer = await getCurrentOrg();
  // Bid data only ever arrives through this helper, which masks. The page has
  // no access to an unmasked bid to accidentally render.
  const view = await getListingBidView(id, viewer.id);
  if (!view) notFound();

  const { listing } = view;

  const meta = LISTING_TYPE_META[listing.type as ListingType];
  const reverse = listing.direction === "REVERSE";
  const isOwner = listing.ownerOrgId === viewer.id;
  const spec = specSummary(listing.type as ListingType, listing.spec);
  const OwnerIcon = ORG_TYPE_META[listing.ownerOrg.type].icon;

  return (
    <main className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={meta.badgeClass}>
              {meta.label}
            </Badge>
            <Badge variant="secondary" className="gap-1 text-[11px]">
              {reverse ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
              {reverse ? "Reverse — price competes down" : "Forward — price competes up"}
            </Badge>
            <Badge variant="secondary">{listing.status}</Badge>
            {isOwner && <Badge className="bg-amber text-black">Your listing</Badge>}
          </div>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{listing.title}</h1>

          {listing.description && (
            <p className="max-w-prose text-sm text-text-secondary">{listing.description}</p>
          )}
        </header>

        <section className="elevated-flat grid grid-cols-2 gap-4 rounded-md border border-line bg-surface-raised p-4 sm:grid-cols-4">
          <Fact
            icon={<MapPin className="size-3.5" />}
            label={listing.destCity ? "Route" : "Location"}
            value={
              listing.destCity
                ? `${listing.locationCity} → ${listing.destCity}`
                : listing.locationCity
            }
          />
          <Fact
            icon={<Clock className="size-3.5" />}
            label="Window"
            value={formatWindow(listing.windowStart, listing.windowEnd)}
          />
          <Fact
            label="Quantity"
            value={`${listing.quantity.toLocaleString("en-IN")} ${listing.unit}`}
          />
          <Fact
            label={reverse ? "Budget" : "Asking"}
            value={rupees(listing.referencePrice)}
            hint={`per ${listing.unit}`}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">{meta.label} specification</h2>
          <dl className="elevated-flat divide-y divide-border/40 overflow-hidden rounded-md border border-line bg-surface-raised">
            {spec.map((row) => (
              <div key={row.label} className="grid grid-cols-3 gap-3 px-4 py-2.5 text-sm">
                <dt className="col-span-1 text-text-secondary">{row.label}</dt>
                <dd className="col-span-2 break-words">{row.value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-text-secondary">
            Stored as a typed JSON payload on the shared listing table — the only thing that differs
            between this and a freight leg.
          </p>
        </section>

        {listing.type === "FREIGHT" &&
          listing.destLat !== null &&
          listing.destLng !== null && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-medium">Route</h2>
              <RouteMap
                origin={[listing.locationLat, listing.locationLng]}
                originLabel={listing.locationCity}
                destination={[listing.destLat, listing.destLng]}
                destinationLabel={listing.destCity ?? "Destination"}
              />
            </section>
          )}

        {listing.type === "BYPRODUCT" && <SymbiosisMatcher listingId={listing.id} />}
      </div>

      {/* ---- Sidebar ------------------------------------------------- */}
      <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
        <section className="elevated-flat rounded-md border border-line bg-surface-raised p-4">
          <h2 className="mb-3 text-xs tracking-wide text-text-secondary uppercase">
            Listed by
          </h2>
          <div className="flex items-start gap-3">
            <OwnerIcon className={`mt-0.5 size-5 ${ORG_TYPE_META[listing.ownerOrg.type].className}`} />
            <div className="min-w-0">
              <p className="flex items-center gap-1 font-medium">
                <span className="truncate">{listing.ownerOrg.name}</span>
                {listing.ownerOrg.verified && (
                  <BadgeCheck className="size-4 shrink-0 text-teal" aria-label="KYC verified" />
                )}
              </p>
              <p className="text-xs text-text-secondary">{listing.ownerOrg.city}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
                <Star className="size-3 fill-amber text-amber" />
                {listing.ownerOrg.rating.toFixed(1)}/5 · {listing.ownerOrg.dealCount} deals ·{" "}
                {listing.ownerOrg.onTimePct}% on-time
              </p>
            </div>
          </div>
          <p className="mt-3 border-t border-line/40 pt-3 text-xs text-text-secondary">
            The party who posts is public. It is the <strong className="text-foreground">bidders</strong>{" "}
            who stay sealed.
          </p>
        </section>

        <section className="elevated-flat rounded-md border border-line bg-surface-raised p-4">
          <div className="mb-3 flex items-center justify-between border-b border-line-subtle pb-3">
            <span className="type-eyebrow">Bidding</span>
            <span className="type-data text-xs text-amber">{timeRemaining(listing.closesAt)}</span>
          </div>

          <BidPanel
            listingId={listing.id}
            direction={listing.direction as "REVERSE" | "FORWARD"}
            isOwner={view.isOwner}
            bids={view.bids}
            ownBid={view.ownBid}
            totalBids={view.totalBids}
            dealState={view.deal?.state ?? null}
            dealId={view.deal?.id ?? null}
            referencePrice={listing.referencePrice}
            unit={listing.unit}
            closed={new Date(listing.closesAt).getTime() <= Date.now()}
            awarded={listing.status === "AWARDED"}
          />

          {view.deal && (
            <Link
              href="/deals"
              className="mt-4 flex items-center justify-between gap-2 rounded-md border border-teal/40 bg-teal-muted/40 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <Handshake className="size-4 text-teal" />
                Deal {DEAL_STATE_LABEL[view.deal.state].toLowerCase()}
              </span>
              <span className="type-data text-teal">{rupees(view.deal.price)}</span>
            </Link>
          )}
        </section>
      </aside>
    </main>
  );
}

function Fact({
  icon,
  label,
  value,
  hint,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[11px] tracking-wide text-text-secondary uppercase">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium" title={value}>
        {value}
      </p>
      {hint && <p className="text-[11px] text-text-secondary">{hint}</p>}
    </div>
  );
}
