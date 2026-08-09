# IndusMate

**Read `README.md` first — it is the project brief and it governs every decision
in this repo.**

## Non-negotiables (repeated here because they are easy to break)

1. **One listing model, one deal state machine.** Markets differ only by
   `listing_type` and a typed spec payload. If you are writing market-specific
   negotiation logic, the abstraction is wrong — stop and say so.

2. **`transitionDeal()` is the only place deal state changes.** No route
   handler and no React component mutates deal state directly.

3. **Identity is masked until ACCEPTED.** Every API response containing bid data
   must pass through `maskBid()` server-side. A bidder never sees another
   bidder's amount, in any state. Leaking identity before ACCEPTED is the
   highest-severity bug in this codebase.

4. **Authorisation reads from `getCurrentOrg()` server-side, never from the
   client.**

5. **Secrets stay server-side.** `GEMINI_API_KEY` is never prefixed with
   `NEXT_PUBLIC_` and never imported into a client component.

## Build hygiene
- Commit after every block.
- The Leaflet map must use `dynamic(..., { ssr: false })` — it touches `window`
  and will crash the server build otherwise.
- Feature freeze at 08:00: after that, bug fixes and seed data only.
