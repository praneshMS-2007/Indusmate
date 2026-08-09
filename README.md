# Industrial Nexus — Project Brief

## What we are building
Industrial Nexus is a B2B industrial marketplace for India. It connects
manufacturers, suppliers, and transport operators across five markets that all
run on ONE shared negotiation engine:

1. Raw materials — suppliers list stock, manufacturers buy
2. Industrial byproducts — plants list waste; other plants buy it as feedstock
3. Equipment sharing — plants rent out idle machinery by the hour
4. Skilled labour — certified technicians booked in scheduled blocks
5. Freight — companies post A-to-B transit needs; transporters bid

## The core thesis (this is the whole project)
Negotiation is not a feature bolted onto five marketplaces. It IS the
architecture.

Every object on the platform is the same abstract thing: a **listable
capacity** with a spec, a location, a time window, and a price that has not
been decided yet. A raw material lot, a waste stream, an idle machine-hour, a
technician's shift, and a truck's return leg are all the same row in the same
table with a different `listing_type`.

So there is exactly ONE listing model and ONE deal state machine. Markets
differ only by `listing_type` and a typed spec payload. If you ever find
yourself writing market-specific negotiation logic, the abstraction is wrong —
stop and tell me.

## The deal lifecycle (one state machine, all five markets)
```
LISTED -> BIDDING -> COUNTERED -> ACCEPTED -> CONTRACTED -> IN_EXECUTION
       -> SETTLED -> RATED
Terminal: REJECTED, CANCELLED, EXPIRED
```

State transitions happen in ONE service-layer function. No route handler and
no React component mutates deal state directly.

## The anonymity rule (most important business rule)
Bidding is sealed and anonymous.

- A bidder cannot see any other bid's value. Ever.
- The listing owner sees incoming bids with the bidder's legal name,
  organisation, and contact details HIDDEN.
- Instead the bidder shows as a pseudonymous handle plus reputation:
  "Verified Transporter #4471 · 4.7/5 · 128 deals · 96% on-time"
- Identity is revealed to both parties ONLY when the deal reaches ACCEPTED.

Leaking identity before ACCEPTED is the highest-severity bug in this codebase.
Every API response that includes bid data must be filtered server-side.

## Bidding runs in both directions
- **Reverse auction** (one buyer, many sellers, price competes DOWN):
  freight legs, raw material tenders, labour shifts.
- **Forward auction** (one seller, many buyers, price competes UP):
  scarce byproducts, in-demand equipment.

Same state machine, one flag on the listing.

## The innovation: byproduct discovery
The hard problem in industrial waste exchange is not listing — it is
discovery. A steel plant does not know its slag is a cement plant's feedstock.
Nobody searches for "slag."

So byproducts are listed by SPECIFICATION, not by name: composition, physical
form, moisture, contaminants, monthly volume, hazard class. The system then
pushes matches outward to plants that can consume that spec.

In this build, that matching is performed by an LLM call that takes the waste
spec and returns candidate consuming industries and an indicative value range.

## Users and roles
- **Manufacturer / Company** — posts needs, buys, rents, sells byproducts
- **Supplier** — lists raw materials
- **Transporter** — bids on freight legs from live position
- **All roles** — KYC-verified (mocked in this build), rated after each deal

## Tech stack (fixed — do not propose alternatives)
- Next.js App Router + TypeScript, strict mode
- Supabase Postgres, accessed via Prisma
- Tailwind + shadcn/ui
- Leaflet + react-leaflet with OpenStreetMap tiles (NO Google Maps, no API key)
- **Google Gemini API** for the assistant and byproduct matching
- Deployed on Vercel

> **Deviation from the original brief:** the original specified the Anthropic
> API. Changed to Google Gemini (`gemini-2.5-flash`) on the owner's instruction
> — the free tier removes a billing dependency during the hackathon. This is
> the only stack deviation.

## Build constraints — a 24-hour hackathon
- Auth is STUBBED: a demo account switcher over seeded users. Do not build
  real authentication. Do not install NextAuth or Supabase Auth.
- Payments, escrow, KYC verification, GST/e-way bill, and SMS are MOCKED.
  Build them as clearly-labelled stub services so the UI flow is complete.
- Freight is the fully-built market. The other four listing types must be
  creatable and browsable through the same engine, but need no bespoke UI.
- Everything must be demoable on a phone-width screen. Judges watch on a
  projector but often click through on a laptop at half width.

## How to work with me
I am a beginner.
- Show me the Implementation Plan, then wait.
- Prefer the boring, fastest working solution over the correct-but-slow one.
- Never refactor unprompted. Never add features I did not ask for.
- If something will take more than ~45 minutes, say so BEFORE starting and
  propose a cheaper version.
- If you hit an error twice, stop and tell me rather than trying a third fix.

---

# Running this project locally

```bash
npm install
cp .env.example .env     # then fill in real values
npx prisma migrate dev   # create the tables
npm run dev              # http://localhost:3000
```

## Environment variables
| Variable | Where it comes from |
|---|---|
| `DATABASE_URL` | Supabase → Connect → **Transaction pooler** (port 6543) |
| `DIRECT_URL` | Supabase → Connect → **Session pooler** (port 5432) |
| `GEMINI_API_KEY` | Google AI Studio → Get API key |

If the database password contains `@`, `:`, `/`, `?`, `#`, or `%`, it must be
URL-encoded in the connection string (`@` becomes `%40`). An un-encoded `@`
silently breaks connection-string parsing.

`.env` is git-ignored and must never be committed.
