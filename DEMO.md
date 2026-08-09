# IndusMate — demo script

**Target: under 4 minutes.** Live at **https://indusmate.vercel.app** — no
login, no setup. The header's **Demo account** switcher changes which seeded
organisation you're acting as; that's the entire auth system, and it's the
mechanism that makes this whole demo possible from one browser tab.

Run `npm run seed` right before presenting if the database has been touched
by anything other than this script (local dev and production share one
Supabase instance — see `CLAUDE.md`).

---

## 0. Open on Browse (10s)

Land on `/browse`. Say the thesis in one breath:

> "Five industrial markets — raw materials, byproducts, equipment, labour,
> freight. One listing table, one deal engine. The only thing that differs
> between a truck leg and a waste stream is the spec payload."

Point at the badges on the cards — five colours, one grid, one form behind
`/listings/new` for all of them.

## 1. Sealed bidding — the masking moment (90s)

Switch account to **Chambal Steel & Alloys** (`org_chambal_steel`, the
default). Open the listing **"12t auto components — Malanpur to
Pithampur"**.

- Point at the bid inbox: **3 sealed bids**, ranked cheapest-first (reverse
  auction — this is a freight tender, price competes down). Each row shows a
  price and a reputation line — `Verified Transporter #7734 · 4.9/5 · 241
  deals · 98% on-time` — and a hatched, locked panel where a name would be.
- Open DevTools → Network → reload the bid request. Show the raw JSON:
  `"identity": null` on every row. **Say it plainly**: this isn't CSS hiding
  a name, the server never sent one. That's `maskBid()` — every bid response
  in this app passes through it before it leaves the database.
- Switch account to **MP Cargo Movers** (`org_mp_cargo`), one of the three
  bidders. Reopen the same listing: they see exactly **one** bid — their
  own. The other two amounts do not exist anywhere in their payload, not
  redacted, absent.

## 2. Accept → the reveal (45s)

Switch back to **Chambal Steel & Alloys**. In the bid inbox, hit **Accept**
on the leading bid (Trishul Logistics, sealed as `Verified Transporter
#7734`).

- Watch the redaction wipe off in ~400ms, the real name and contact
  underneath. That transition respects `prefers-reduced-motion` — mention it
  if there's time, skip it if there isn't.
- This is the whole product in one click: **choose on merit, then find out
  who you chose.**
- Jump to `/deals` and show the new deal's audit trail — `LISTED → BIDDING →
  ACCEPTED`, each row naming the actor. That log is append-only; nothing
  in this app mutates deal state outside `transitionDeal()`.

## 3. The innovation slide, made real (60s)

Switch account to **Vindhya Thermal Power** (`org_vindhya_power`). Open
**"Class F fly ash — 4,200 t/month, ESP-collected"**.

- Scroll to the specification table: composition, moisture, contaminants,
  source process. **No product name anywhere on this listing** — say that
  out loud, it's the point.
- Hit **Find buyers for this waste**. In ~5-10 seconds Gemini returns:
  cement manufacturing, ready-mix concrete, fly ash bricks, road
  embankment — each with a value range per tonne and the governing IS
  standard, reasoned from the numbers on screen, not from the word
  "fly ash."
- Point at the **on-platform match**: Banmore Cement Industries, already
  seeded, already real. A steel plant's waste just found a buyer that exists
  on this platform right now.

## 4. The map (20s)

Open `/map`. Every open listing across the MP corridor, colour-coded by
market. Point at the dashed line on a freight leg — pickup to drop, drawn
from the same lat/lng every other view uses.

## 5. Close (15s)

> "Sealed bidding, a real state machine, and an AI matcher that turns
> disposal cost into revenue — all running on one table and one engine.
> Adding a sixth market is a config change, not a rewrite."

---

## If something breaks on stage

- **Matcher is slow or errors:** it has a "Regenerate" control and fails
  honestly with a typed message — never a fabricated result. If it's
  genuinely down, fall back to the pre-run screenshots and say so; don't
  pretend.
- **Wrong account shows the wrong bids:** the demo cookie is per-browser
  profile, not per-tab. Two tabs share one identity — use one tab, switch
  the account, and refresh.
- **Data looks wrong (missing bids, deals in odd states):** `npm run seed`
  restores the exact state this script assumes. Do this before presenting,
  not during.
- **A judge asks to see the raw API:** DevTools → Network → the `/bids`
  request → Response tab. That's the strongest five seconds of the whole
  demo — the leak scan (`npm run check:leaks`) checks this same thing
  automatically, 11 routes, zero leaks.
