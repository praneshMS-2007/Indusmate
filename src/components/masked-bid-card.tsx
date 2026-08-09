"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Lock, Phone, Star, Unlock } from "lucide-react";

import { rupees } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Reputation without identity. This is the entire payload a viewer is allowed
 * to see about a counterparty before a deal reaches ACCEPTED.
 */
export interface BidReputation {
  handle: string;
  rating: number;
  dealCount: number;
  onTimePct: number;
  verified: boolean;
}

/**
 * Released ONLY at ACCEPTED.
 *
 * SECURITY, not styling: when a bid is sealed this prop must be absent — not
 * hidden with CSS, not rendered at opacity 0, ABSENT. A redaction you can read
 * by opening view-source is theatre. The server is responsible for never
 * sending it; this component is responsible for never inventing a way to hold
 * it early.
 */
export interface BidIdentity {
  name: string;
  city: string;
  contactName: string;
  contactPhone: string;
}

export interface MaskedBidCardProps {
  rank?: number;
  amount: number;
  message?: string | null;
  reputation: BidReputation;
  /** Present only once the deal is ACCEPTED. */
  identity?: BidIdentity | null;
  /** Marks the leading bid in the ranked inbox. */
  best?: boolean;
  /** Plays the reveal transition on mount. Used at the accept moment. */
  animateOnMount?: boolean;
  className?: string;
}

/**
 * THE SIGNATURE ELEMENT.
 *
 * A sealed bid is a sealed tender envelope. Where the organisation's name
 * would be there is a physically obscured panel — diagonal hatching in the
 * masked violet, the visual language of barricade tape across a doorway. The
 * reputation figures sit beside it in mono, entirely legible.
 *
 * The reading has to be "deliberately withheld", never "failed to load".
 * That distinction is the whole product thesis, so the hatch is paired with a
 * lock glyph and the word SEALED: three independent signals, none of them
 * colour on its own.
 */
export function MaskedBidCard({
  rank,
  amount,
  message,
  reputation,
  identity,
  best = false,
  animateOnMount = false,
  className,
}: MaskedBidCardProps) {
  const revealed = Boolean(identity);

  // Drives the wipe. When the card arrives already revealed and is not being
  // animated, skip straight to the end state so a page refresh does not replay
  // the transition every time.
  const [wiping, setWiping] = useState(false);
  useEffect(() => {
    if (revealed && animateOnMount) {
      setWiping(true);
      const t = setTimeout(() => setWiping(false), 400);
      return () => clearTimeout(t);
    }
  }, [revealed, animateOnMount]);

  return (
    <article
      data-state={revealed ? "revealed" : "sealed"}
      className={cn(
        // elevated-flat, not elevated: this card is never itself a link, so a
        // hover-lift would promise clickability it does not have. Depth
        // without the motion cue.
        "elevated-flat relative flex flex-col gap-3 rounded-md border bg-surface-raised p-4 transition-colors",
        revealed ? "border-teal/45" : "border-masked/30",
        best && "ring-1 ring-amber/40",
        className,
      )}
    >
      {/* --- top row: rank, seal state, amount ------------------------- */}
      <div className="flex items-start gap-3">
        {rank !== undefined && (
          <span
            className={cn(
              "type-data grid size-7 shrink-0 place-items-center rounded-sm border text-xs font-semibold",
              best
                ? "border-amber/50 bg-amber-muted text-amber"
                : "border-line text-text-tertiary",
            )}
            aria-label={`Rank ${rank}`}
          >
            {rank}
          </span>
        )}

        <div className="min-w-0 flex-1">
          {/* -------- THE IDENTITY SLOT -------- */}
          <div className="relative min-h-[26px]">
            {revealed ? (
              <>
                {/* The real name sits underneath. The redaction wipes off it. */}
                <p className="reveal-name flex items-center gap-1.5 text-base leading-tight font-semibold">
                  <span className="truncate">{identity!.name}</span>
                  {reputation.verified && (
                    <BadgeCheck className="size-4 shrink-0 text-teal" aria-hidden />
                  )}
                </p>
                {wiping && (
                  <span
                    aria-hidden
                    className="redaction reveal-panel absolute inset-0 block"
                  />
                )}
              </>
            ) : (
              /* Sealed. The name is not in this DOM at all — there is nothing
                 here to un-hide, because the server never sent it. */
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="redaction relative block h-[22px] w-[min(11rem,55%)]"
                >
                  <Lock className="absolute top-1/2 left-2 size-3 -translate-y-1/2 text-masked" />
                </span>
                <span className="sr-only">
                  Bidder identity is sealed until this deal is accepted.
                </span>
                <Badge variant="masked" className="gap-1">
                  <Lock aria-hidden />
                  Sealed
                </Badge>
              </div>
            )}
          </div>

          {/* -------- reputation: always fully legible -------- */}
          <p className="type-data mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-secondary">
            <span className={revealed ? "" : "text-masked"}>{reputation.handle}</span>
            <span aria-hidden className="text-text-tertiary">
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="size-3 fill-amber text-amber" aria-hidden />
              {reputation.rating.toFixed(1)}/5
            </span>
            <span aria-hidden className="text-text-tertiary">
              ·
            </span>
            <span>{reputation.dealCount} deals</span>
            <span aria-hidden className="text-text-tertiary">
              ·
            </span>
            <span>{reputation.onTimePct}% on-time</span>
          </p>
        </div>

        {/* -------- the number -------- */}
        <div className="shrink-0 text-right">
          <p className="type-eyebrow">Bid</p>
          <p
            className={cn(
              "type-data text-lg leading-tight font-semibold",
              best ? "text-amber" : "text-text-primary",
            )}
          >
            {rupees(amount)}
          </p>
        </div>
      </div>

      {message && (
        <p className="border-t border-line-subtle pt-3 text-sm text-text-secondary">
          &ldquo;{message}&rdquo;
        </p>
      )}

      {/* -------- contact, released only on acceptance -------- */}
      {revealed && (
        <div className="reveal-name flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-teal/25 pt-3 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1.5 text-teal">
            <Unlock className="size-3.5" aria-hidden />
            Identity released
          </span>
          <span>{identity!.city}</span>
          <span className="inline-flex items-center gap-1.5">
            <Phone className="size-3.5" aria-hidden />
            <span className="type-data">{identity!.contactPhone}</span>
          </span>
          <span>{identity!.contactName}</span>
        </div>
      )}
    </article>
  );
}
