# Industrial Nexus

> One negotiation engine. Five industrial markets. Adding a sixth is
> configuration, not code.

**Built for HackMatrix 2K26 — IEEE Computer Society SBC, MITS Gwalior.**

| | |
|---|---|
| **Project Title** | Industrial Nexus |
| **Team Name** | **COLDSTACK** |
| **Live Demo** | _Deployment pending — link goes here_ |
| **Repository** | https://github.com/praneshMS-2007/Indusmate |

---

## Problem Statement

Indian industrial commerce runs on phone calls, WhatsApp groups and brokers.
That creates three compounding failures:

1. **Price discovery is broken.** A manufacturer posting a freight need has no
   way to make transporters compete. Whoever the broker knows wins, at whatever
   price the broker sets.

2. **Bidding is not confidential.** When bids leak between bidders, the process
   stops being a market and becomes a negotiation about who found out what.
   Sellers avoid bidding honestly because their price becomes public knowledge.

3. **Industrial waste has no discovery mechanism.** A steel plant's slag is a
   cement plant's raw feedstock — but the steel plant does not know that, and
   the cement plant does not search for "slag." The two never meet, so a
   sellable byproduct becomes a disposal cost. This is a discovery problem, not
   a listing problem, and no existing marketplace solves it.

Existing B2B portals treat each market — materials, equipment, labour, freight,
waste — as a separate product with its own bespoke logic. That is why none of
them cover all five, and why adding a market is a rewrite.

## Solution Overview

Industrial Nexus treats negotiation as the architecture rather than a feature.

**The insight:** a raw material lot, a waste stream, an idle machine-hour, a
technician's shift and a truck's return leg are all the same abstract object —
a **listable capacity** with a spec, a location, a time window, and a price that
has not been decided yet. So they are the same row in the same table with a
different `listing_type` and a typed spec payload.

That yields three things:

**1. One engine, five markets.** Exactly one `Listing` model and one deal state
machine serve raw materials, byproducts, equipment sharing, skilled labour and
freight. Markets differ only by their spec payload. A sixth market is a config
change, not a codebase.

**2. Sealed, anonymous bidding.** Bidders never see each other's amounts. The
listing owner sees incoming bids with the bidder's name, organisation and
contact details stripped server-side, replaced by a pseudonymous handle and
reputation aggregates — `Verified Transporter #4471 · 4.7/5 · 128 deals ·
96% on-time`. Identity is revealed to both sides **only** when the deal reaches
`ACCEPTED`. You choose on merit, then find out who you chose. Masking is
enforced in the API layer, not the UI, so it cannot be bypassed by reading the
network tab.

**3. AI-driven byproduct symbiosis.** Byproducts are listed by *specification*
— composition, physical form, moisture, contaminants, monthly volume, hazard
class — never by name. An LLM then works outward from that spec to the
industries that can consume it as feedstock, what they use it for, and an
indicative value range per tonne in India, cross-referenced against real
organisations on the platform. Fly ash stops being a disposal cost and becomes
cement, bricks and road base.

### The deal lifecycle — one state machine, all five markets

```
LISTED → BIDDING → COUNTERED → ACCEPTED → CONTRACTED → IN_EXECUTION
       → SETTLED → RATED

Terminal states: REJECTED, CANCELLED, EXPIRED
```

Every transition passes through a single service function that validates the
move is legal, validates the actor is permitted to make it, and appends to an
immutable `DealEvent` audit log. No route handler and no React component
mutates deal state directly.

Bidding runs in both directions on the same machine, set by one flag:
- **Reverse auction** — one buyer, many sellers, price competes *down*
  (freight legs, raw material tenders, labour shifts)
- **Forward auction** — one seller, many buyers, price competes *up*
  (scarce byproducts, in-demand equipment)

## Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19 | Server components keep masking logic server-side by default |
| Language | TypeScript, strict mode | Discriminated unions type the five spec payloads |
| Database | Supabase Postgres | Managed, free tier, `ap-south-1` region |
| ORM | Prisma 6 | Typed queries; JSON column for the spec payload |
| UI | Tailwind CSS v4 + shadcn/ui | Mobile-first, no design system to build |
| Maps | Leaflet + react-leaflet + OpenStreetMap | No API key, no billing, no vendor lock-in |
| AI | Google Gemini (`gemini-2.5-flash`) | Free tier; strict JSON mode for match cards |
| Hosting | Vercel | Zero-config Next.js deploys on every push |

**Scope honesty — what is mocked in a 24-hour build:** authentication is a demo
account switcher over seeded organisations (no passwords, clearly labelled in
the UI). Payments, escrow, KYC verification, GST/e-way bill generation and SMS
are clearly-labelled stub services, so the UI flow is complete end-to-end
without pretending the integrations exist. Freight is the fully-built market;
the other four are creatable and browsable through the same engine.

## Team Members

**Team COLDSTACK**

| Name | GitHub |
|---|---|
| Pranesh M S — *Team Lead* | [@praneshMS-2007](https://github.com/praneshMS-2007) |
| Avinash A S | [@AVINASHHZ](https://github.com/AVINASHHZ) |
| Kannan S | [@kindlingkannan-web](https://github.com/kindlingkannan-web) |
| Yashwanth | [@yashliveinsaan](https://github.com/yashliveinsaan) |

## Setup Instructions

### Prerequisites
- Node.js 20 or newer (`node -v`)
- A Supabase project (free tier)
- A Google AI Studio API key (free tier)

### 1. Clone and install
```bash
git clone https://github.com/praneshMS-2007/Indusmate.git
cd Indusmate
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Then fill in `.env`:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → **Connect** → *Transaction pooler* (port **6543**) |
| `DIRECT_URL` | Supabase → **Connect** → *Session pooler* (port **5432**) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) → Get API key |

> **Two URLs, deliberately.** The app runs on the transaction pooler because
> serverless functions open and close connections constantly and a direct
> connection exhausts the limit. Prisma migrations cannot run through the
> transaction pooler, so they use the session pooler instead.

> **URL-encode your password.** If it contains `@`, `:`, `/`, `?`, `#` or `%`,
> encode it — `@` becomes `%40`. An un-encoded `@` is read as the
> password/host separator and breaks the connection string with a confusing
> error.

### 3. Create the tables and seed demo data
```bash
npx prisma migrate dev
npm run seed
```

### 4. Run
```bash
npm run dev          # → http://localhost:3000
```

There is no login. Use the **Demo account** switcher in the header to change
which organisation you are acting as.

> **Testing the anonymity rule:** use two different browser *profiles*, not two
> tabs. Demo auth is cookie-based, so two tabs share one identity and masking
> will look broken when it is working correctly.

### Deploying
Push to `main` — Vercel builds automatically. Add all three environment
variables in the Vercel dashboard (**Settings → Environment Variables**),
pasting values **without** surrounding quotes.

---

## Project structure

```
prisma/schema.prisma     the single Listing model + deal state machine tables
prisma/seed.ts           12 organisations, 15 listings, bids and deals
src/app/api/             route handlers — every bid response passes maskBid()
src/lib/deals.ts         transitionDeal() — the ONLY place deal state changes
src/lib/masking.ts       maskBid() — server-side identity stripping
src/lib/listing-spec.ts  the discriminated union typing all five spec payloads
```

## Architectural invariants

These are the rules the codebase is built to enforce. See `CLAUDE.md`.

1. One listing model, one state machine. Market-specific negotiation logic
   means the abstraction is wrong.
2. `transitionDeal()` is the only place deal state changes.
3. Every API response containing bid data passes through `maskBid()`.
   **Leaking identity before `ACCEPTED` is the highest-severity bug in this
   codebase.**
4. Authorisation reads from `getCurrentOrg()` server-side, never from the
   client.
5. `GEMINI_API_KEY` is never prefixed `NEXT_PUBLIC_` and never reaches a client
   component.
