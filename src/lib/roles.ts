/**
 * Role lenses.
 *
 * THE RULE, and it is the same rule as listing-spec.ts:
 *
 *   Role changes COMPOSITION, never CAPABILITY.
 *
 * A transporter and a manufacturer see different dashboards. They do not get
 * different engines. Every role can reach every route, post any listing type
 * and bid on anything — nothing in this file grants or withholds a permission,
 * and nothing in src/lib/deals.ts, bids.ts or masking.ts imports it. If you
 * find yourself writing `if (role === ...)` inside the engine, the abstraction
 * is wrong; stop, exactly as CLAUDE.md says for market-specific logic.
 *
 * What a role actually is: an organisation's habitual posture toward one
 * shared auction engine. A transporter almost always BIDS on someone else's
 * reverse auction. A supplier almost always POSTS a forward one. Same table,
 * same state machine, opposite side of the same negotiation. This table
 * encodes that posture so the interface can open on the thing that role came
 * to do, instead of a generic feed that serves nobody in particular.
 *
 * `homeMarkets` is a DEFAULT FILTER, never a restriction. It seeds the browse
 * link and the dashboard feed. A recycler who wants to hire a crane still
 * can — the nav still lists everything.
 */

import type { OrgType } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  Factory,
  Gavel,
  Handshake,
  Package,
  Plus,
  Recycle,
  Search,
  Truck,
} from "lucide-react";

import type { ListingType } from "./listing-spec";

// ---------------------------------------------------------------------------
// Dashboard cards
// ---------------------------------------------------------------------------

/**
 * Every card the dashboard knows how to render. A role picks which of these
 * appear and in what order — it cannot invent a new one, which keeps four
 * dashboards from drifting into four codebases.
 */
export type DashboardCardId =
  /** Sealed bids sitting on MY listings, waiting for me to accept or counter. */
  | "decisions-waiting"
  /** Listings I have posted, with their sealed bid counts. */
  | "my-listings"
  /** Bids I have placed on other people's listings. */
  | "my-bids"
  /** Open listings in my home markets that I could bid on right now. */
  | "market-feed"
  /** Deals I am party to that are mid-flight. */
  | "deals-active"
  /** My standing — the number that decides whether anyone picks my bid. */
  | "reputation";

/**
 * Bento spans. Static class strings, never interpolated — Tailwind scans
 * source text at build time, so a computed `col-span-${n}` is purged and the
 * card silently renders full width. This bit us once already with badge
 * colours; it is not going to bite us twice.
 *
 * Every row a role composes must sum to 12 on desktop, or the grid leaves a
 * ragged gap. The layouts below are checked by hand for exactly that.
 */
export const BENTO_SPAN = {
  full: "col-span-12",
  half: "col-span-12 lg:col-span-6",
  third: "col-span-12 sm:col-span-6 lg:col-span-4",
  twoThirds: "col-span-12 lg:col-span-8",
  quarter: "col-span-6 lg:col-span-3",
} as const;

export type BentoSpan = keyof typeof BENTO_SPAN;

export interface DashboardCardSlot {
  id: DashboardCardId;
  span: BentoSpan;
  /** Marks the one card this role opens for. Rendered with the accent border. */
  hero?: boolean;
}

// ---------------------------------------------------------------------------
// KPI bar
// ---------------------------------------------------------------------------

/**
 * The four numbers across the top. Four, always — a 4x quarter row resolves to
 * exactly 12 columns, which is what keeps the bar symmetrical at every
 * breakpoint (4 across on desktop, 2x2 on mobile).
 */
export type KpiId =
  | "open-listings-mine"
  | "sealed-bids-inbound"
  | "my-live-bids"
  | "deals-in-flight"
  | "deals-to-fulfil"
  | "market-open-now"
  | "on-time-pct"
  | "rating"
  | "win-rate";

export interface RoleMeta {
  label: string;
  icon: LucideIcon;
  /** Full static Tailwind classes — see the BENTO_SPAN note about purging. */
  accentClass: string;
  /** Border/background pairing for the hero card. */
  heroClass: string;
  /** What this role is here to do, in their own words. Shown under the name. */
  tagline: string;
  /**
   * Which side of the auction this role habitually sits on. Shown verbatim on
   * the dashboard because it is the clearest one-line proof that four very
   * different businesses are running the same engine.
   */
  posture: string;
  primary: { label: string; href: string; icon: LucideIcon };
  secondary: { label: string; href: string; icon: LucideIcon };
  /** Seeds the feed and the browse link. A default, NOT a restriction. */
  homeMarkets: ListingType[];
  kpis: [KpiId, KpiId, KpiId, KpiId];
  cards: DashboardCardSlot[];
}

// ---------------------------------------------------------------------------
// The four lenses
// ---------------------------------------------------------------------------

export const ROLE_META: Record<OrgType, RoleMeta> = {
  /**
   * Buys almost everything and sells its own waste. The scarce resource is
   * the operator's ATTENTION, so the dashboard opens on the only screen where
   * money is actually decided: sealed bids awaiting a call.
   */
  MANUFACTURER: {
    label: "Manufacturer",
    icon: Factory,
    accentClass: "text-amber",
    heroClass: "border-amber/40 bg-amber-muted/20",
    tagline: "Buys inputs, moves output, sells what is left over.",
    posture: "Posts reverse auctions to buy — and forward auctions to sell byproducts.",
    primary: { label: "Post a requirement", href: "/listings/new", icon: Plus },
    secondary: { label: "Browse the corridor", href: "/browse", icon: Search },
    homeMarkets: ["RAW_MATERIAL", "FREIGHT", "LABOUR", "EQUIPMENT", "BYPRODUCT"],
    kpis: ["sealed-bids-inbound", "open-listings-mine", "deals-in-flight", "rating"],
    cards: [
      { id: "decisions-waiting", span: "twoThirds", hero: true },
      { id: "reputation", span: "third" },
      { id: "my-listings", span: "half" },
      { id: "deals-active", span: "half" },
      { id: "market-feed", span: "full" },
    ],
  },

  /**
   * Sells material into other people's tenders. Two jobs, both first-class:
   * list stock, and find tenders worth bidding into.
   */
  SUPPLIER: {
    label: "Supplier",
    icon: Package,
    accentClass: "text-sky-400",
    heroClass: "border-sky-500/40 bg-sky-500/10",
    tagline: "Lists stock, and bids into tenders worth winning.",
    posture: "Sells on forward auctions, and competes on reverse ones.",
    primary: { label: "List available stock", href: "/listings/new?type=RAW_MATERIAL", icon: Plus },
    secondary: { label: "Find open tenders", href: "/browse?type=RAW_MATERIAL", icon: Search },
    homeMarkets: ["RAW_MATERIAL", "BYPRODUCT", "EQUIPMENT"],
    kpis: ["open-listings-mine", "sealed-bids-inbound", "my-live-bids", "win-rate"],
    cards: [
      { id: "my-listings", span: "twoThirds", hero: true },
      { id: "reputation", span: "third" },
      { id: "decisions-waiting", span: "half" },
      { id: "my-bids", span: "half" },
      { id: "market-feed", span: "full" },
    ],
  },

  /**
   * Does not post. Hunts. A transporter's entire working day is "what can I
   * bid on before it closes", so the market feed IS the dashboard, and their
   * on-time percentage — the number that decides whether anyone picks them —
   * sits beside it rather than buried in a profile page.
   */
  TRANSPORTER: {
    label: "Transporter",
    icon: Truck,
    accentClass: "text-rose-400",
    heroClass: "border-rose-500/40 bg-rose-500/10",
    tagline: "Fills empty return legs by bidding freight down.",
    posture: "Almost always the bidder — competes on reverse auctions.",
    primary: { label: "Find loads", href: "/browse?type=FREIGHT", icon: Search },
    secondary: { label: "Offer a return leg", href: "/listings/new?type=FREIGHT", icon: Plus },
    homeMarkets: ["FREIGHT"],
    kpis: ["market-open-now", "my-live-bids", "deals-to-fulfil", "on-time-pct"],
    cards: [
      { id: "market-feed", span: "twoThirds", hero: true },
      { id: "reputation", span: "third" },
      { id: "my-bids", span: "half" },
      { id: "deals-active", span: "half" },
      { id: "my-listings", span: "full" },
    ],
  },

  /**
   * The mirror image of a manufacturer's byproduct problem. Where a plant asks
   * "who will take this waste", a recycler asks "what waste can I feed my
   * line". Identical listings, identical engine, opposite direction of travel
   * — which is precisely why the symbiosis matcher belongs on both screens.
   */
  RECYCLER: {
    label: "Recycler",
    icon: Recycle,
    accentClass: "text-teal",
    heroClass: "border-teal/40 bg-teal-muted/20",
    tagline: "Turns somebody else's disposal cost into feedstock.",
    posture: "Bids up on forward auctions to secure byproduct volume.",
    primary: { label: "Find feedstock", href: "/browse?type=BYPRODUCT", icon: Search },
    secondary: { label: "List recovered material", href: "/listings/new?type=RAW_MATERIAL", icon: Plus },
    homeMarkets: ["BYPRODUCT", "RAW_MATERIAL"],
    kpis: ["market-open-now", "my-live-bids", "deals-in-flight", "rating"],
    cards: [
      { id: "market-feed", span: "twoThirds", hero: true },
      { id: "reputation", span: "third" },
      { id: "my-bids", span: "half" },
      { id: "deals-active", span: "half" },
      { id: "my-listings", span: "full" },
    ],
  },
};

// ---------------------------------------------------------------------------
// KPI presentation
// ---------------------------------------------------------------------------

export interface KpiMeta {
  label: string;
  /** Where the number goes when tapped. Every KPI is a door, not a decoration. */
  href: string;
  icon: LucideIcon;
  /** Suffix rendered small after the value, e.g. "%" or "open". */
  suffix?: string;
  /** Amber-highlight when non-zero — used for things demanding a response. */
  urgent?: boolean;
}

export const KPI_META: Record<KpiId, KpiMeta> = {
  "sealed-bids-inbound": {
    label: "Sealed bids awaiting you",
    href: "/my/listings",
    icon: Gavel,
    urgent: true,
  },
  "open-listings-mine": { label: "Your live listings", href: "/my/listings", icon: Package },
  "my-live-bids": { label: "Your live bids", href: "/my/bids", icon: Gavel },
  "deals-in-flight": { label: "Deals in flight", href: "/deals", icon: Handshake },
  "deals-to-fulfil": { label: "Loads to run", href: "/deals", icon: Truck },
  "market-open-now": { label: "Open in your markets", href: "/browse", icon: Search },
  "on-time-pct": { label: "On-time record", href: "/deals", icon: Truck, suffix: "%" },
  "rating": { label: "Your rating", href: "/deals", icon: Handshake, suffix: "/5" },
  "win-rate": { label: "Bid win rate", href: "/my/bids", icon: Gavel, suffix: "%" },
};

/** Browse URL seeded with this role's markets — a starting point, not a cage. */
export function homeBrowseHref(role: OrgType): string {
  const markets = ROLE_META[role].homeMarkets;
  return markets.length === 1 ? `/browse?type=${markets[0]}` : "/browse";
}
