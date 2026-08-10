# HACKMATRIX 2026 — OFFICIAL PROJECT DOCUMENTATION

> **IEEE COMPUTER SOCIETY STUDENT BRANCH CHAPTER**  
> **Madhav Institute of Technology and Science (MITS), Gwalior**  
> *Event: HackMatrix 2026 — Round 2*  
> *Theme: Choose Your Reality. Build Your Future.*  

---

## 📌 Project & Team Metadata

| Field | Details |
|---|---|
| **Team Name** | **COLDSTACK** |
| **Team Leader Name & Contact** | **Pranesh M S** (`praneshms2007@gmail.com` \| `+91 9488344710`) |
| **Team Members** | Pranesh M S, Avinash A S, Kannan S, Yashwanth |
| **Problem Statement** | **PS-B2B-01** (B2B Industrial Market Fragmentation & Supply Chain Inefficiency) |
| **Event Name** | HackMatrix 2026 - Round 2 |
| **Project Title** | **IndusMate** — Unified Sealed B2B Industrial Bidding Engine & AI Symbiosis |

---

## 🔗 Official Project Links

- **GitHub Repository Link (Public):** [https://github.com/praneshMS-2007/Indusmate](https://github.com/praneshMS-2007/Indusmate)
- **Live Deployed Link (Vercel):** [https://indusmate.vercel.app](https://indusmate.vercel.app)
- **Demo Video Drive Link:** [https://drive.google.com/drive/folders/1uNk-gQDxbypHJ-23VQl4YRwfi5fk1_gH](https://drive.google.com/drive/folders/1uNk-gQDxbypHJ-23VQl4YRwfi5fk1_gH)
- **Presentation Deck Canva Link:** [https://canva.link/rbn90jqm4jr5e5m](https://canva.link/rbn90jqm4jr5e5m)

---

## 🖼️ Platform Preview & Visual Features

IndusMate's UI is designed specifically for industrial operators on plant floors and logistics managers:

1. **Role-Aware Bento Dashboards (`/`):** Customized operational dashboards for **Manufacturers, Transporters, Suppliers, and Recyclers**, giving each industry persona tailored KPI metrics and priority cards.
2. **Enterprise Admin KYC & Audit Logs (`/admin/kyc` & `/admin/logs`):** Multi-document verification queue for GST certificates, factory licenses, and RC books with a complete historical audit log.
3. **Sealed-Bid Anonymity Panel (`/listings/[id]`):** Pseudonym handles (`Transporter #4471 · 4.7/5 Rating · 128 Deals`) hide bidder identities until deal acceptance.
4. **AI Waste-to-Resource Symbiosis Matcher:** Evaluates chemical specifications of industrial waste streams using Google Gemini 2.5 LLM to match selling factories with recycling buyers.
5. **Interactive Route Map (`/map`):** Embedded Leaflet OpenStreetMap cluster map for freight corridors and industrial zones.

---

## 📝 Project Summary

**IndusMate** is a unified B2B industrial trading and byproduct symbiosis platform designed specifically for Indian manufacturing MSMEs, fleet transporters, raw material suppliers, and recyclers.

Built on the core insight that a raw material lot, an idle machine-hour, a technician's shift, a waste byproduct stream, and a truck's return leg are all instances of the same abstract object — a **listable capacity** with a specification, a location, a time window, and a price that has not been decided yet — IndusMate unifies five distinct industrial markets onto **one single database model and one universal deal state machine**.

It introduces strict server-side sealed anonymous bidding to prevent price cartelization and middleman margins (12–18%), alongside an AI-powered byproduct symbiosis engine using Google Gemini 2.5 to match industrial waste streams directly with recycling feedstocks.

---

## ⚠️ Problem Being Solved

Indian industrial commerce operates through informal phone calls, fragmented WhatsApp groups, and commission brokers, creating four compounding failures:

1. **Broken Price Discovery & Middleman Markups:** Freight rates and raw material prices are set arbitrarily by intermediaries, imposing 12–18% unnecessary markups and inflating MSME operational costs.
2. **Public Bid Leakage & Price Cartelization:** Traditional open tenders leak tenderer amounts before closing. Suppliers refrain from offering their true lowest prices because public disclosure exposes their commercial margins to rival buyers.
3. **Unmapped Industrial Waste & Byproducts:** 68% of industrial waste (fly ash, slag, chemical sludge, spent catalyst) is landfilled because factories search materials by brand name rather than chemical composition, turning sellable resources into disposal costs.
4. **Unutilized Logistics Fleet Backhaul:** Transporters return with empty trucks on 35% of interstate routes due to lack of real-time return-leg freight visibility.

---

## 🌟 Unique Selling Point (USP)

- **One Engine, Five Markets:** Exactly one `Listing` database model and one state machine power all 5 markets (Freight, Raw Materials, Byproducts, Equipment, Labour). Adding a 6th market requires zero structural code changes — only a spec configuration payload.
- **Strict Server-Side Sealed Anonymity (`maskBid()`):** Bidders never see rival amounts. Listing owners view pseudonymous handles and reputation metrics (`Transporter #4471 · 4.7/5 · 128 deals`). Private identities (GSTIN, legal name, phone) are released strictly upon deal `ACCEPTED`.
- **AI Waste-to-Resource Symbiosis Engine:** Uses Google Gemini 2.5 LLM to analyze chemical & physical specifications of industrial byproducts and match selling factories directly with buying recyclers.
- **Enterprise Admin KYC & Real-Time Audit Logs:** Full multi-document KYC verification flow with dedicated administrative queue (`/admin/kyc`) and transparent audit logging (`/admin/logs`).
- **Sub-100ms Request-Level Performance:** Powered by Next.js 16 App Router, React 19, `React.cache()` query memoization, WebP compressed assets, Vercel Mumbai (`bom1`) edge functions, and Supabase PgBouncer connection pooling.

---

## 🔥 Key Features

1. **Sealed-Bid Negotiation Engine:** Supports both Reverse Auctions (price competes down for freight/raw materials) and Forward Auctions (price competes up for scarce byproducts).
2. **Role-Aware Bento Dashboards:** Customized dashboards for Manufacturers, Transporters, Suppliers, and Recyclers with role-specific KPI metrics.
3. **AI Byproduct Symbiosis Matcher:** Automated chemical spec mapping, potential applications, per-tonne market valuation, and counterparty discovery.
4. **Admin KYC Verification & Audit History:** Platform administrators review factory licenses, GST certificates, and RC books with full state audit logs.
5. **Interactive Location & Route Tracking:** Built-in Leaflet OpenStreetMap interactive cluster map and distance calculator.
6. **Instant UX Feedback:** Form submit buttons feature `useFormStatus` zero-latency loading indicators to prevent duplicate submissions.

---

## 🛠️ Technical Stack

| Layer | Technologies Used | Implementation Role |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS + Tailwind v4 | Mobile-first responsive UI, Server Components for identity masking |
| **Backend** | Next.js Server Actions, Web API Route Handlers, Node.js | Type-safe server actions, RESTful document APIs |
| **Database** | PostgreSQL (Supabase) + Prisma 6 ORM | Request-level `React.cache()` memoization, PgBouncer pooling |
| **AI / LLM** | Google Gemini 2.5 Flash API (`@google/genai`) | Automated byproduct waste stream matching & economic valuation |
| **Auth & Security** | Auth.js (NextAuth v5), Bcrypt, HTTP-only JWT Cookies | Credentials auth, RBAC guards, Admin KYC verification |
| **Deployment** | Vercel Cloud Serverless (`bom1` region) + Supabase Managed DB | Sub-100ms global production edge hosting |

---

## 🚀 Future Scope & Roadmap

- **Q3 2026 — Real-Time Counter-Offers & GSTN API:** Integrate WebSockets for live counter-bidding and automated government GSTN verification.
- **Q4 2026 — Payment Escrow Integration:** Integrate Razorpay / Cashfree escrow gateways to hold funds until milestone settlement.
- **Q1 2027 — Logistics Ecosystem Integration:** Connect directly with FASTag and NIC e-Way Bill portals for automated freight tracking.
- **2027+ — Industrial Hub Pilot & Scaling:** Deployment across Pithampur, Malanpur, and Mandideep industrial corridors, expanding to SAARC cross-border trade.

---

## 👥 Team & Execution Statement

**Team COLDSTACK:** Pranesh M S (Lead / Full-Stack), Avinash A S (Frontend & Design Systems), Kannan S (Backend & Database Architecture), Yashwanth (QA & Testing).

*"Combining deep expertise in full-stack Next.js web engineering, scalable database architecture, AI integration, and domain knowledge of Indian industrial supply chains to deliver a secure, frictionless B2B marketplace."*
