# IndusMate

> **One negotiation engine. Five industrial markets. Sealed anonymous bidding & AI-driven byproduct symbiosis for Indian industry.**

Built for **HackMatrix 2K26 — IEEE Computer Society SBC, MITS Gwalior**.

| Attribute | Details |
|---|---|
| **Project Title** | **IndusMate** |
| **Team Name** | **COLDSTACK** |
| **Live Demo** | [indusmate.vercel.app](https://indusmate.vercel.app) |
| **Repository** | [github.com/praneshMS-2007/Indusmate](https://github.com/praneshMS-2007/Indusmate) |
| **Demo Script** | [`DEMO.md`](./DEMO.md) — under 4 minutes, step-by-step walkthrough |

---

## 🎯 Problem Statement

Indian industrial commerce runs on phone calls, fragmented WhatsApp groups, and brokers. This creates three compounding failures:

1. **Price Discovery is Broken:** A manufacturer posting a freight need has no way to make transporters compete transparently. Intermediaries set prices arbitrarily, adding 12–18% in hidden markups.
2. **Bidding Leakage & Cartelization:** In traditional open tenders, bids leak between competitors. Sellers refrain from offering their true lowest prices because public disclosure exposes their margins to rival buyers.
3. **Unmapped Industrial Waste Streams:** A steel plant's slag is a cement plant's raw feedstock — but neither side knows it. Because byproducts are searched by name rather than chemical composition, sellable materials become expensive disposal costs.

Existing B2B portals treat each market — materials, equipment, labour, freight, waste — as separate products. IndusMate unifies all five into **one architectural engine**.

---

## ✨ Solution Overview

IndusMate treats negotiation as the core architecture rather than an ad-hoc feature.

### 💡 The Core Insight
A raw material lot, a waste stream, an idle machine-hour, a technician's shift, and a truck's return leg are all instances of the same abstract object: a **listable capacity** with a specification, a location, a time window, and a price that has not been decided yet.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ONE UNIVERSAL LISTING                           │
│  [Market Type]  [Spec Payload]  [Location & Window]  [Reference Price] │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      SEALED BIDDING & MASKING LAYER                    │
│      Pseudonym Handles · Star Ratings · Deal Count · On-Time %         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  ONE DEAL STATE MACHINE (ALL 5 MARKETS)                │
│   LISTED → BIDDING → COUNTERED → ACCEPTED → CONTRACTED → SETTLED       │
└────────────────────────────────────────────────────────────────────────┘
```

### 🔑 Key Capabilities

1. **One Engine, Five Markets:** Exactly one `Listing` model and one deal state machine serve **Freight, Raw Materials, Industrial Byproducts, Machinery/Equipment, and Skilled Labour**. Adding a sixth market is a single configuration change.
2. **Sealed, Anonymous Bidding Engine:** Bidders never see each other's amounts. The listing owner sees incoming bids with names, organisations, and contact details stripped server-side (`maskBid()`), replaced by pseudonymous handles and reputation metrics (`Transporter #4471 · 4.7/5 · 128 deals`). Identities are revealed **only when a deal reaches `ACCEPTED`**.
3. **AI-Driven Byproduct Symbiosis (Gemini 2.5):** Industrial waste streams are listed by specification (composition, moisture, hazardous class, volume). Google Gemini LLM evaluates the chemical spec to match selling factories directly with buying recyclers and manufacturers.
4. **Platform Admin KYC Verification & Audit Logs:** New organisations undergo multi-document KYC verification (GST, Factory License, PCB Clearance, RC Book). Platform administrators review pending submissions in `/admin/kyc` with real-time audit logs at `/admin/logs`.
5. **Role-Aware Bento Dashboards:** Customized views for **Manufacturers, Transporters, Suppliers, and Recyclers**, giving each industry persona tailored KPI metrics and priority cards.

---

## 🔄 The Deal Lifecycle State Machine

Every deal transition passes through a single immutable service function (`transitionDeal`) that validates authorization and appends to a `DealEvent` audit trail:

```
LISTED → BIDDING → COUNTERED → ACCEPTED → CONTRACTED → IN_EXECUTION → SETTLED → RATED

Terminal States: REJECTED | CANCELLED | EXPIRED
```

- **Reverse Auction (Price competes down):** Freight legs, raw material procurement, labour shifts.
- **Forward Auction (Price competes up):** Scarce industrial byproducts, in-demand heavy machinery.

---

## 🛠️ Technology Stack & Architecture

| Layer | Choice | Rationale / Benefit |
|---|---|---|
| **Framework** | Next.js 16 (App Router), React 19 | Server Components keep identity masking strictly server-side |
| **Language** | TypeScript (Strict Mode) | Discriminated unions type all 5 market spec payloads |
| **Database** | PostgreSQL (Supabase) + Prisma 6 | Managed relational storage with JSON spec columns |
| **Performance Layer** | `React.cache()` + PgBouncer Pooling | Deduplicates database queries; sub-100ms latency |
| **Authentication** | Auth.js (NextAuth v5) + Bcrypt | Secure credentials auth, HTTP-only JWT cookies, RBAC |
| **Styling** | Vanilla CSS + Tailwind CSS v4 | HSL theme design tokens, light/dark mode, mobile-first |
| **Maps & Routing** | Leaflet + OpenStreetMap / CARTO | Embedded route geometry without vendor lock-in |
| **AI / LLM** | Google Gemini API (`gemini-2.5-flash`) | Automated byproduct symbiosis waste stream matching |
| **Hosting** | Vercel | Global edge deployment with automatic GitHub integration |

---

## 👥 Team Members

**Team COLDSTACK**

| Member Name | Role | GitHub |
|---|---|---|
| **Pranesh M S** | Team Lead / Full-Stack Engineer | [@praneshMS-2007](https://github.com/praneshMS-2007) |
| **Avinash A S** | Frontend & Design Systems | [@AVINASHHZ](https://github.com/AVINASHHZ) |
| **Kannan S** | Backend & Database Architecture | [@kindlingkannan-web](https://github.com/kindlingkannan-web) |
| **Yashwanth** | Quality Assurance & Testing | [@yashliveinsaan](https://github.com/yashliveinsaan) |

---

## 🚀 Quickstart & Setup Instructions

### 1. Clone & Install
```bash
git clone https://github.com/praneshMS-2007/Indusmate.git
cd Indusmate
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure `.env` with your Supabase Postgres connection and Google Gemini API key:
```env
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=30"
DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
GEMINI_API_KEY="your_google_gemini_api_key"
AUTH_SECRET="a_very_secure_secret_key_for_indusmate"
AUTH_TRUST_HOST=true
```

> **Note on Database Connection:** `DATABASE_URL` connects via transaction pooler (port 6543) with `connection_limit=10` for serverless concurrency. `DIRECT_URL` connects via session pooler (port 5432) for running migrations.

### 3. Initialize Database & Seed Demo Accounts
```bash
npx prisma migrate dev
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
# → Open http://localhost:3000
```

### 5. Run Optimized Production Server (Fastest Local Experience)
```bash
npm run build
npm run start
# → Open http://localhost:3000 (Sub-100ms rendering)
```

---

## 🔐 Credentials & Demo Accounts

| Role | Username / Email | Password | Access Portal |
|---|---|---|---|
| **Platform Administrator** | `admin@indusmate.com` | `admin123` | `/admin/kyc` & `/admin/logs` |
| **Transporter** | `fleet@shrimata.com` | `password123` | Dashboard & Freight Bidding |
| **Manufacturer** | `supply@indus.com` | `password123` | Dashboard & Material Listings |
| **Supplier** | `raw@metals.com` | `password123` | Dashboard & Supply Bids |

---

## 🏛️ Architectural Invariants

These core rules are enforced across the codebase (see [`CLAUDE.md`](./CLAUDE.md)):

1. **One Listing Model, One State Machine:** Market-specific negotiation logic is strictly forbidden; all five markets share the same underlying architecture.
2. **Single State Transition Function:** `transitionDeal()` in `src/lib/deals.ts` is the ONLY function permitted to modify deal state.
3. **Strict Server-Side Identity Masking:** All bid data passes through `maskBid()` in `src/lib/masking.ts`. Leaking counterparty identity before `ACCEPTED` is a zero-tolerance bug.
4. **Server-Side Authorization:** Every action reads from `getCurrentOrg()` server-side; client-provided org IDs are never trusted.
5. **Protected AI Keys:** `GEMINI_API_KEY` is server-side only and never exposed to the client browser.
