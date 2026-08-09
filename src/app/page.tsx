import Link from "next/link";
import { ArrowRight, Layers, Lock, Repeat } from "lucide-react";

import { getCurrentOrg } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { KPI_META, ROLE_META, type DashboardCardId } from "@/lib/roles";
import { Bento, BentoCard, KpiTile } from "@/components/bento";
import {
  ActiveDealsCard,
  DecisionsWaitingCard,
  MarketFeedCard,
  MyBidsCard,
  MyListingsCard,
  ReputationCard,
} from "@/components/dashboard/cards";
import { Button } from "@/components/ui/button";

/** Header text per card. Kept here so all four dashboards share one vocabulary. */
const CARD_CHROME: Record<
  DashboardCardId,
  { title: string; eyebrow?: string; action?: { label: string; href: string } }
> = {
  "decisions-waiting": {
    title: "Decisions waiting on you",
    eyebrow: "Sealed",
    action: { label: "All listings", href: "/my/listings" },
  },
  "my-listings": {
    title: "Your listings",
    action: { label: "See all", href: "/my/listings" },
  },
  "my-bids": {
    title: "Your live bids",
    action: { label: "See all", href: "/my/bids" },
  },
  "market-feed": {
    title: "Open in your markets",
    eyebrow: "Closing soonest first",
    action: { label: "Browse all", href: "/browse" },
  },
  "deals-active": {
    title: "Deals in flight",
    action: { label: "See all", href: "/deals" },
  },
  reputation: {
    title: "How counterparties see you",
  },
};

/**
 * The role-aware dashboard.
 *
 * Four organisation types, four compositions, ONE engine underneath. Nothing
 * on this page grants or withholds a capability — every role can still reach
 * every route, post any listing type and bid on anything. The role decides
 * which cards appear and in what order, and that is the whole of it.
 *
 * Which is exactly the platform's thesis one layer up: switching from a
 * manufacturer to a transporter reorganises this screen completely while the
 * table, the state machine and the masking rules underneath stay identical.
 */
export default async function Home() {
  const org = await getCurrentOrg();
  const data = await getDashboardData(org);

  const role = ROLE_META[org.type];
  const RoleIcon = role.icon;
  const PrimaryIcon = role.primary.icon;
  const SecondaryIcon = role.secondary.icon;

  return (
    <main className="flex flex-col gap-4 lg:gap-5">
      {/* ---- Identity strip: who you are, what you do here ---------------- */}
      <header className="elevated-flat flex flex-col gap-4 rounded-md border border-line bg-surface-raised p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-md border border-line bg-surface">
              <RoleIcon className={`size-5 ${role.accentClass}`} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="type-eyebrow">
                {role.label} · {org.city}
              </p>
              <h1 className="type-display truncate text-xl sm:text-2xl">{org.name}</h1>
              <p className="mt-0.5 text-sm text-text-secondary">{role.tagline}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={role.primary.href}>
                <PrimaryIcon className="size-4" />
                {role.primary.label}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={role.secondary.href}>
                <SecondaryIcon className="size-4" />
                {role.secondary.label}
              </Link>
            </Button>
          </div>
        </div>

        {/* The one line that proves four businesses share one engine. */}
        <p className="flex items-start gap-2 border-t border-line-subtle pt-3 text-xs text-text-secondary">
          <Repeat className="mt-0.5 size-3.5 shrink-0 text-text-tertiary" aria-hidden />
          <span>
            <span className="text-foreground">{role.posture}</span> Same listing table, same deal
            state machine as every other role — only this screen is arranged differently.
          </span>
        </p>
      </header>

      {/* ---- KPI bar: four cells, one clean row --------------------------- */}
      <Bento>
        {role.kpis.map((id) => {
          const meta = KPI_META[id];
          const raw = data.kpis[id];
          return (
            <KpiTile
              key={id}
              label={meta.label}
              value={id === "rating" ? raw.toFixed(1) : raw}
              suffix={meta.suffix}
              href={meta.href}
              icon={meta.icon}
              urgent={meta.urgent}
            />
          );
        })}
      </Bento>

      {/* ---- The bento ---------------------------------------------------- */}
      <Bento>
        {role.cards.map((slot) => {
          const chrome = CARD_CHROME[slot.id];
          return (
            <BentoCard
              key={slot.id}
              span={slot.span}
              hero={slot.hero}
              heroClass={role.heroClass}
              title={chrome.title}
              eyebrow={chrome.eyebrow}
              action={chrome.action}
              bodyClassName={slot.id === "reputation" ? undefined : "py-2"}
            >
              {slot.id === "decisions-waiting" && <DecisionsWaitingCard data={data} />}
              {slot.id === "my-listings" && <MyListingsCard data={data} />}
              {slot.id === "my-bids" && <MyBidsCard data={data} />}
              {slot.id === "market-feed" && <MarketFeedCard data={data} role={org.type} />}
              {slot.id === "deals-active" && <ActiveDealsCard data={data} />}
              {slot.id === "reputation" && <ReputationCard org={org} />}
            </BentoCard>
          );
        })}
      </Bento>

      {/* ---- The thesis, stated once ------------------------------------- */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="elevated-flat rounded-md border border-masked/30 bg-masked-muted/30 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="size-4 text-masked" aria-hidden />
            Bidding here is sealed
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            No bidder sees another bidder&apos;s number. Owners see reputation without identity —
            a handle, a rating, a completion record. Names, contacts and GSTIN are released to
            both sides only once a deal is accepted.
          </p>
        </div>
        <Link
          href="/browse"
          className="elevated group flex flex-col rounded-md border border-line bg-surface-raised p-4 transition-colors hover:border-amber/50"
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Layers className="size-4 text-amber" aria-hidden />
            One engine, five markets
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Raw materials, byproducts, equipment, labour and freight are one table with one deal
            state machine. Your dashboard is arranged for a {role.label.toLowerCase()} — the
            engine underneath is the same one everyone else uses.
          </p>
          <span className="mt-2 flex items-center gap-1 text-xs font-medium text-amber">
            Browse every market
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>
    </main>
  );
}
