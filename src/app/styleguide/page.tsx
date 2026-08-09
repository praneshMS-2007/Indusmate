"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CircleSlash,
  Lock,
  RotateCcw,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";

import { MaskedBidCard } from "@/components/masked-bid-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ---------------------------------------------------------------------------
   Sample data for the signature element
   --------------------------------------------------------------------------- */

const SAMPLE_REPUTATION = {
  handle: "Verified Transporter #7734",
  rating: 4.9,
  dealCount: 241,
  onTimePct: 98,
  verified: true,
};

const SAMPLE_IDENTITY = {
  name: "Trishul Logistics Private Limited",
  city: "Pithampur",
  contactName: "Harpreet Singh Bhatia",
  contactPhone: "+91 99816 30052",
};

export default function StyleguidePage() {
  const [revealKey, setRevealKey] = useState(0);

  return (
    <main className="flex flex-col gap-12 pb-16">
      <header className="flex flex-col gap-2 border-b border-line pb-6">
        <p className="type-eyebrow">Industrial Nexus</p>
        <h1 className="type-display text-3xl sm:text-4xl">Design system</h1>
        <p className="max-w-prose text-sm text-text-secondary">
          Instrument-panel software for Indian heavy industry. Read on a mid-range Android in a
          plant yard, and on a projector from the back of a room. Legibility beats delight, every
          time.
        </p>
      </header>

      {/* ==================================================================
          THE SIGNATURE ELEMENT — first, because it is the point
          ================================================================== */}
      <Section
        title="Sealed bid"
        eyebrow="Signature element"
        note="A sealed bid is a sealed tender envelope. The identity block is physically obscured — hatched, locked, labelled — while the reputation figures stay fully legible beside it. The reading must be 'deliberately withheld', never 'failed to load'."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="type-eyebrow">Before acceptance — sealed</p>
            <MaskedBidCard
              rank={1}
              amount={54800}
              message="GPS-tracked multi-axle, driver on our own payroll. Can load a day early if the bay is free."
              reputation={SAMPLE_REPUTATION}
              best
            />
            <p className="text-xs text-text-tertiary">
              The organisation name is not in this DOM at all. Nothing is hidden with CSS — the
              server never sent it.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <p className="type-eyebrow">After acceptance — released</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRevealKey((k) => k + 1)}
                aria-label="Replay the reveal transition"
              >
                <RotateCcw />
                Replay
              </Button>
            </div>
            <MaskedBidCard
              key={revealKey}
              rank={1}
              amount={54800}
              message="GPS-tracked multi-axle, driver on our own payroll. Can load a day early if the bay is free."
              reputation={SAMPLE_REPUTATION}
              identity={SAMPLE_IDENTITY}
              best
              animateOnMount
            />
            <p className="text-xs text-text-tertiary">
              320ms wipe, left to right. A wipe rather than a fade because a fade dies under
              projector gamma. Honours <code className="type-data">prefers-reduced-motion</code>.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <p className="type-eyebrow">A ranked inbox, as the owner sees it</p>
          <div className="flex flex-col gap-2">
            <MaskedBidCard
              rank={1}
              amount={54800}
              reputation={SAMPLE_REPUTATION}
              message="Return leg, already empty back from Indore."
              best
            />
            <MaskedBidCard
              rank={2}
              amount={58500}
              reputation={{
                handle: "Verified Transporter #4471",
                rating: 4.7,
                dealCount: 128,
                onTimePct: 96,
                verified: true,
              }}
            />
            <MaskedBidCard
              rank={3}
              amount={61000}
              reputation={{
                handle: "Verified Transporter #5127",
                rating: 4.4,
                dealCount: 87,
                onTimePct: 91,
                verified: true,
              }}
              message="Firm price, no diesel escalation clause."
            />
          </div>
          <p className="text-xs text-text-tertiary">
            Ranked by amount, in mono with tabular figures so the column aligns digit-for-digit —
            the owner compares magnitudes by eye, the way a weighbridge ticket is read.
          </p>
        </div>
      </Section>

      {/* ==================================================================
          COLOUR
          ================================================================== */}
      <Section
        title="Colour"
        eyebrow="Tokens"
        note="Graphite base, safety amber for action, circular-economy teal for verified and settled, and a violet that appears nowhere else in the system so that 'sealed' can never be confused with anything. Every ratio below is measured, not estimated — run `npm run check:contrast`."
      >
        <div className="flex flex-col gap-6">
          <SwatchRow
            heading="Surfaces"
            swatches={[
              { name: "surface", hex: "#0d1012", note: "app chassis" },
              { name: "surface-raised", hex: "#151a1d", note: "cards, panels" },
              { name: "surface-overlay", hex: "#1e2529", note: "dialogs, menus" },
              { name: "surface-sunken", hex: "#080a0b", note: "inputs, wells" },
            ]}
          />
          <SwatchRow
            heading="Text — all AA or better on every surface"
            swatches={[
              { name: "text-primary", hex: "#f1f5f6", note: "17.4:1" },
              { name: "text-secondary", hex: "#a9b4b9", note: "9.0:1" },
              { name: "text-tertiary", hex: "#8a969c", note: "6.3:1" },
            ]}
          />
          <SwatchRow
            heading="Semantic roles"
            swatches={[
              { name: "amber", hex: "#f5a524", note: "action · 9.4:1" },
              { name: "teal", hex: "#2dd4bf", note: "verified · 10.3:1" },
              { name: "masked", hex: "#b494ff", note: "sealed · 7.8:1" },
              { name: "warning", hex: "#ffa23e", note: "warning · 9.5:1" },
              { name: "danger", hex: "#ff7a7a", note: "destructive · 7.6:1" },
              { name: "disabled-fg", hex: "#8a969c", note: "disabled · 6.3:1" },
            ]}
          />
        </div>

        <div className="mt-6 rounded-md border border-amber/30 bg-amber-muted/40 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4 text-amber" />
            Never convey status by colour alone
          </p>
          <p className="mt-1 max-w-prose text-sm text-text-secondary">
            Colour is the first thing a washed-out projector and a colour-blind operator both lose.
            Every status below pairs its hue with an icon and a word.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="verified">
              <BadgeCheck />
              Verified
            </Badge>
            <Badge variant="masked">
              <Lock />
              Sealed
            </Badge>
            <Badge variant="default">Bidding</Badge>
            <Badge variant="warning">
              <AlertTriangle />
              Closing soon
            </Badge>
            <Badge variant="danger">
              <XCircle />
              Rejected
            </Badge>
            <Badge variant="muted">
              <CircleSlash />
              Cancelled
            </Badge>
            <Badge variant="outline">Draft</Badge>
            <Badge variant="secondary">Reverse</Badge>
          </div>
        </div>
      </Section>

      {/* ==================================================================
          TYPE
          ================================================================== */}
      <Section
        title="Type"
        eyebrow="Three roles"
        note="Display for signage, body for reading, mono for every number. The mono is the strongest cue that this is instrument software: a weighbridge prints in mono, an hour meter reads in mono, a consignment note's figures are mono."
      >
        <div className="flex flex-col gap-6">
          <TypeSpec
            role="Display — Barlow Condensed"
            usage="Page titles and section headers only. Uppercase, tight tracking. On body copy it stops being signage and starts being shouting."
          >
            <p className="type-display text-4xl">Sealed bidding</p>
            <p className="type-display text-2xl">Negotiation engine</p>
            <p className="type-eyebrow">Eyebrow / section label</p>
          </TypeSpec>

          <TypeSpec
            role="Body — Inter"
            usage="Everything readable. Chosen because it holds up at 13px on a cheap Android panel, which is where this is actually used."
          >
            <p className="text-base">
              The listing owner sees incoming bids with the bidder&apos;s name, organisation and
              contact details stripped server-side.
            </p>
            <p className="text-sm text-text-secondary">
              Secondary — supporting copy, hints, metadata.
            </p>
            <p className="text-xs text-text-tertiary">Tertiary — timestamps, fine print.</p>
          </TypeSpec>

          <TypeSpec
            role="Data — IBM Plex Mono"
            usage="Every number: bid amounts, tonnages, distances, reference ids, coordinates, timestamps. Never prose. Tabular figures so columns align."
          >
            <div className="type-data flex flex-col gap-1 text-sm">
              <span>₹54,800 &nbsp; ₹58,500 &nbsp; ₹61,000</span>
              <span>12.0 t · 486 km · 34 cbm</span>
              <span>NX-EWB-88214 · 23.0993, 77.5205</span>
              <span>4.9/5 · 241 deals · 98% on-time</span>
            </div>
          </TypeSpec>
        </div>
      </Section>

      {/* ==================================================================
          SPACING, RADIUS, ELEVATION
          ================================================================== */}
      <Section
        title="Space, radius, elevation"
        eyebrow="Structure"
        note="An 8px rhythm, small radii, and cast shadow rather than glow. Panels sit on the chassis; they do not float above it."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <p className="type-eyebrow mb-2">8px scale</p>
            <div className="flex flex-col gap-1.5">
              {[
                ["2", 8],
                ["3", 12],
                ["4", 16],
                ["6", 24],
                ["8", 32],
                ["12", 48],
              ].map(([step, px]) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="type-data w-12 text-xs text-text-tertiary">{px}px</span>
                  <span className="h-2 bg-amber/60" style={{ width: `${px}px` }} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-text-tertiary">
              Tailwind&apos;s 4px base is kept so existing utilities stay valid; the convention is
              to use even steps, which land on the 8px grid.
            </p>
          </div>

          <div>
            <p className="type-eyebrow mb-2">Radius — small</p>
            <div className="flex flex-wrap gap-3">
              {[
                ["sm", "2px", "rounded-sm"],
                ["md", "3px", "rounded-md"],
                ["lg", "4px", "rounded-lg"],
                ["xl", "6px", "rounded-xl"],
              ].map(([name, px, cls]) => (
                <div key={name} className="flex flex-col items-center gap-1">
                  <div className={`size-12 border border-line-strong bg-surface-raised ${cls}`} />
                  <span className="type-data text-xs text-text-tertiary">{px}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-text-tertiary">Machined edges, not pillows.</p>
          </div>

          <div>
            <p className="type-eyebrow mb-2">Elevation</p>
            <div className="flex flex-col gap-3">
              {[
                ["e1", "shadow-e1", "resting panel"],
                ["e2", "shadow-e2", "raised / hover"],
                ["e3", "shadow-e3", "dialog"],
              ].map(([name, cls, use]) => (
                <div
                  key={name}
                  className={`rounded-md border border-line bg-surface-raised px-3 py-2 text-xs ${cls}`}
                >
                  <span className="type-data">{name}</span>
                  <span className="ml-2 text-text-tertiary">{use}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-md border border-line bg-surface-raised p-4">
          <p className="type-eyebrow mb-2">44px minimum touch target</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Default is 44px</Button>
            <Button size="sm">36px + expanded hit area</Button>
            <Button size="lg">48px</Button>
            <Button size="icon" aria-label="Icon button">
              <Truck />
            </Button>
          </div>
        </div>
      </Section>

      {/* ==================================================================
          BUTTONS — every variant, every state
          ================================================================== */}
      <Section title="Buttons" eyebrow="Components" note="Exactly one variant is amber. If everything is primary, nothing is.">
        <StateTable
          columns={["Default", "Hover", "Focus", "Disabled", "Loading"]}
          rows={[
            ["Primary", <Button key="a">Place bid</Button>, <Button key="b" className="bg-amber-strong">Place bid</Button>, <Button key="c" className="ring-2 ring-amber/30 outline-2 outline-amber outline-offset-2">Place bid</Button>, <Button key="d" disabled>Place bid</Button>, <Button key="e" loading>Placing bid</Button>],
            ["Outline", <Button key="a" variant="outline">Counter</Button>, <Button key="b" variant="outline" className="border-amber/60 bg-surface-raised">Counter</Button>, <Button key="c" variant="outline" className="outline-2 outline-amber outline-offset-2">Counter</Button>, <Button key="d" variant="outline" disabled>Counter</Button>, <Button key="e" variant="outline" loading>Countering</Button>],
            ["Secondary", <Button key="a" variant="secondary">Save draft</Button>, <Button key="b" variant="secondary" className="bg-line-subtle">Save draft</Button>, <Button key="c" variant="secondary" className="outline-2 outline-amber outline-offset-2">Save draft</Button>, <Button key="d" variant="secondary" disabled>Save draft</Button>, <Button key="e" variant="secondary" loading>Saving</Button>],
            ["Teal", <Button key="a" variant="teal">Settle deal</Button>, <Button key="b" variant="teal" className="bg-teal/85">Settle deal</Button>, <Button key="c" variant="teal" className="outline-2 outline-amber outline-offset-2">Settle deal</Button>, <Button key="d" variant="teal" disabled>Settle deal</Button>, <Button key="e" variant="teal" loading>Settling</Button>],
            ["Destructive", <Button key="a" variant="destructive">Reject bid</Button>, <Button key="b" variant="destructive" className="border-danger bg-danger/20">Reject bid</Button>, <Button key="c" variant="destructive" className="outline-2 outline-amber outline-offset-2">Reject bid</Button>, <Button key="d" variant="destructive" disabled>Reject bid</Button>, <Button key="e" variant="destructive" loading>Rejecting</Button>],
            ["Ghost", <Button key="a" variant="ghost">Cancel</Button>, <Button key="b" variant="ghost" className="bg-surface-raised text-text-primary">Cancel</Button>, <Button key="c" variant="ghost" className="outline-2 outline-amber outline-offset-2">Cancel</Button>, <Button key="d" variant="ghost" disabled>Cancel</Button>, <Button key="e" variant="ghost" loading>Cancelling</Button>],
          ]}
        />
        <p className="mt-3 text-xs text-text-tertiary">
          Hover and focus columns are simulated with utility classes so every state is visible at
          once — the real components produce these from <code className="type-data">:hover</code>{" "}
          and <code className="type-data">:focus-visible</code>.
        </p>
      </Section>

      {/* ==================================================================
          FORM CONTROLS
          ================================================================== */}
      <Section title="Form controls" eyebrow="Components" note="44px tall, 16px text on mobile so iOS does not zoom the viewport on focus, and a 3:1 boundary so the control is identifiable.">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Default">
            <Input placeholder="Palletised auto components" />
          </Field>

          <Field label="With value">
            <Input defaultValue="12t auto components — Malanpur to Pithampur" />
          </Field>

          <Field label="Numeric — mono, tabular">
            <Input data-numeric defaultValue="54800" inputMode="numeric" />
          </Field>

          <Field label="Disabled">
            <Input disabled defaultValue="Locked after bidding opens" />
          </Field>

          <Field label="Error" error="Enter an amount above ₹0. Bids cannot be zero or negative.">
            <Input aria-invalid defaultValue="-500" data-numeric />
          </Field>

          <Field label="Select">
            <Select defaultValue="32ft multi-axle">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="32ft multi-axle">32ft multi-axle</SelectItem>
                <SelectItem value="22ft container">22ft container</SelectItem>
                <SelectItem value="19ft truck">19ft truck</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Select — disabled">
            <Select disabled>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Not available" />
              </SelectTrigger>
              <SelectContent />
            </Select>
          </Field>

          <Field label="Textarea">
            <Textarea rows={3} placeholder="Anything a counterparty needs to know before bidding." />
          </Field>
        </div>
      </Section>

      {/* ==================================================================
          CARD, TABLE, DIALOG
          ================================================================== */}
      <Section title="Surfaces" eyebrow="Components">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="type-eyebrow">Card</p>
            <div className="rounded-md border border-line bg-surface-raised p-4 shadow-e1">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline">Freight</Badge>
                <Badge variant="secondary">Bidding</Badge>
              </div>
              <h3 className="mt-3 font-medium">12t auto components — Malanpur to Pithampur</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Palletised transmission housings. Delivery window is firm.
              </p>
              <div className="mt-3 flex items-end justify-between border-t border-line-subtle pt-3">
                <div>
                  <p className="type-eyebrow">Budget</p>
                  <p className="type-data text-lg">₹62,000</p>
                </div>
                <span className="type-data text-xs text-amber">closes in 30h</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="type-eyebrow">Dialog</p>
            <div className="rounded-md border border-line bg-surface-raised p-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open confirmation</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="type-display text-xl">Accept this bid?</DialogTitle>
                    <DialogDescription>
                      Accepting creates the deal and releases both organisations&apos; identities.
                      This cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="rounded-md border border-line bg-surface-sunken p-3">
                    <p className="type-eyebrow">Winning bid</p>
                    <p className="type-data text-xl text-amber">₹54,800</p>
                    <p className="type-data mt-1 text-xs text-text-secondary">
                      Verified Transporter #7734 · 4.9/5 · 241 deals
                    </p>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost">Keep bidding open</Button>
                    </DialogClose>
                    <Button>Accept bid</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <p className="type-eyebrow">Table — figures in mono, right-aligned</p>
          <div className="overflow-x-auto rounded-md border border-line">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bidder</TableHead>
                  <TableHead>Reputation</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ["Verified Transporter #7734", "4.9/5 · 241", 54800, "Leading"],
                  ["Verified Transporter #4471", "4.7/5 · 128", 58500, "Active"],
                  ["Verified Transporter #5127", "4.4/5 · 87", 61000, "Active"],
                ].map(([handle, rep, amt, status]) => (
                  <TableRow key={handle as string}>
                    <TableCell className="type-data text-masked">{handle}</TableCell>
                    <TableCell className="type-data text-text-secondary">{rep}</TableCell>
                    <TableCell className="type-data text-right">
                      ₹{(amt as number).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status === "Leading" ? "default" : "secondary"}>
                        {status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Section>

      {/* ==================================================================
          STATE PATTERNS
          ================================================================== */}
      <Section
        title="Loading, empty, error"
        eyebrow="Patterns"
        note="The three states that decide whether an app feels finished. An empty state that only says 'No results' has wasted the one moment it had to help."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <p className="type-eyebrow">Loading</p>
            <div className="flex flex-col gap-2 rounded-md border border-line bg-surface-raised p-4">
              <div className="h-3 w-20 animate-pulse rounded-sm bg-line" />
              <div className="h-5 w-full animate-pulse rounded-sm bg-line" />
              <div className="h-5 w-3/5 animate-pulse rounded-sm bg-line" />
              <div className="mt-2 h-8 w-24 animate-pulse rounded-sm bg-line" />
            </div>
            <p className="text-xs text-text-tertiary">
              Skeleton in the shape of the content, never a blank flash or a centred spinner.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="type-eyebrow">Empty</p>
            <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-line-strong p-6 text-center">
              <ShieldCheck className="size-7 text-text-tertiary" />
              <div>
                <p className="font-medium">No bids yet</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Bidding closes in 30 hours. Transporters within 200 km were notified when you
                  posted.
                </p>
              </div>
              <Button size="sm" variant="outline">
                Share this listing
              </Button>
            </div>
            <p className="text-xs text-text-tertiary">
              Says what happens next and offers the action, rather than reporting a count of zero.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="type-eyebrow">Error</p>
            <div className="rounded-md border border-danger/40 bg-danger-muted/40 p-4">
              <p className="flex items-center gap-2 font-medium">
                <AlertTriangle className="size-4 text-danger" />
                Bid not placed
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Your bid of ₹54,800 is above the reserve for this reverse auction. Enter an amount
                below ₹62,000 and try again.
              </p>
              <Button size="sm" variant="outline" className="mt-3">
                Edit bid
              </Button>
            </div>
            <p className="text-xs text-text-tertiary">
              What went wrong, why, and the specific next action. Never a stack trace.
            </p>
          </div>
        </div>
      </Section>
    </main>
  );
}

/* ---------------------------------------------------------------------------
   Local layout helpers — styleguide only
   --------------------------------------------------------------------------- */

function Section({
  title,
  eyebrow,
  note,
  children,
}: {
  title: string;
  eyebrow?: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 border-b border-line-subtle pb-3">
        {eyebrow && <p className="type-eyebrow">{eyebrow}</p>}
        <h2 className="type-display text-2xl">{title}</h2>
        {note && <p className="max-w-prose text-sm text-text-secondary">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function SwatchRow({
  heading,
  swatches,
}: {
  heading: string;
  swatches: Array<{ name: string; hex: string; note: string }>;
}) {
  return (
    <div>
      <p className="type-eyebrow mb-2">{heading}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {swatches.map((s) => (
          <div key={s.name} className="overflow-hidden rounded-md border border-line">
            <div className="h-12 w-full" style={{ backgroundColor: s.hex }} />
            <div className="bg-surface-raised px-2 py-1.5">
              <p className="type-data truncate text-[11px]">{s.name}</p>
              <p className="type-data text-[10px] text-text-tertiary">{s.hex}</p>
              <p className="text-[10px] text-text-tertiary">{s.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeSpec({
  role,
  usage,
  children,
}: {
  role: string;
  usage: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-line bg-surface-raised p-4">
      <p className="type-data text-xs text-amber">{role}</p>
      <p className="mt-1 mb-3 max-w-prose text-xs text-text-tertiary">{usage}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function StateTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<[string, ...React.ReactNode[]]>;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full min-w-[42rem] border-collapse">
        <thead>
          <tr className="border-b border-line bg-surface-raised">
            <th className="type-eyebrow p-3 text-left">Variant</th>
            {columns.map((c) => (
              <th key={c} className="type-eyebrow p-3 text-left">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, ...cells]) => (
            <tr key={name} className="border-b border-line-subtle last:border-0">
              <td className="p-3 text-sm font-medium whitespace-nowrap">{name}</td>
              {cells.map((cell, i) => (
                <td key={i} className="p-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && (
        <p className="flex items-start gap-1.5 text-xs text-danger">
          <AlertTriangle className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
