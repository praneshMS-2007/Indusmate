"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Phone,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import type { DealState } from "@prisma/client";

import {
  DEAL_EVENT_LABEL,
  DEAL_STATE_LABEL,
  availableEvents,
  permittedEvents,
  type DealEventName,
} from "@/lib/deals";

/** Is anyone able to move this deal, even if not the current viewer? */
function availableEventsExist(state: DealState): boolean {
  return availableEvents(state).length > 0;
}
import { formatDateTime, rupees } from "@/lib/format";
import { LISTING_TYPE_META, type ListingType } from "@/lib/listing-spec";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface DealCardData {
  id: string;
  state: DealState;
  price: number;
  role: "buyer" | "seller";
  listing: { id: string; title: string; type: ListingType };
  counterparty: {
    name: string;
    legalName: string;
    city: string;
    contactName: string;
    contactPhone: string;
    verified: boolean;
    rating: number;
  };
  events: Array<{
    id: string;
    fromState: DealState | null;
    toState: DealState;
    actorName: string;
    note: string | null;
    createdAt: Date;
  }>;
}

const STATE_VARIANT: Partial<Record<DealState, "verified" | "default" | "muted" | "danger">> = {
  ACCEPTED: "default",
  CONTRACTED: "default",
  IN_EXECUTION: "default",
  SETTLED: "verified",
  RATED: "verified",
  CANCELLED: "muted",
  REJECTED: "danger",
  EXPIRED: "muted",
};

/**
 * One deal, its counterparty, its available moves and its audit trail.
 *
 * Every button here posts an EVENT, never a target state — the server decides
 * what that event means from the current state. A client that could name the
 * destination could skip a step.
 */
export function DealCard({ deal }: { deal: DealCardData }) {
  const router = useRouter();
  const [busy, setBusy] = useState<DealEventName | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTrail, setShowTrail] = useState(false);

  // Only what THIS party may do. A button that always 403s reads as a broken
  // app rather than as an action that was never theirs.
  const events = permittedEvents(deal.state, deal.role);
  const meta = LISTING_TYPE_META[deal.listing.type];

  async function fire(event: DealEventName) {
    setBusy(event);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      });
      const data = (await res.json()) as { error?: string; state?: DealState };
      if (!res.ok) {
        setError(data.error ?? "That move was refused.");
        return;
      }
      toast.success(`Deal is now ${DEAL_STATE_LABEL[data.state!].toLowerCase()}.`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="elevated-flat flex flex-col gap-4 rounded-md border border-line bg-surface-raised p-4">
      <div className="flex flex-wrap items-start gap-2">
        <Badge variant="outline" className={meta.badgeClass}>
          {meta.label}
        </Badge>
        <Badge variant={STATE_VARIANT[deal.state] ?? "secondary"}>
          {DEAL_STATE_LABEL[deal.state]}
        </Badge>
        <Badge variant="secondary">You are the {deal.role}</Badge>
        <span className="type-data ml-auto text-lg font-semibold">{rupees(deal.price)}</span>
      </div>

      <Link href={`/listings/${deal.listing.id}`} className="group">
        <h3 className="leading-snug font-medium group-hover:text-amber">
          {deal.listing.title}
          <ArrowRight className="ml-1 inline size-3.5 transition-transform group-hover:translate-x-0.5" />
        </h3>
      </Link>

      {/* Identity is released here because the deal exists — reaching ACCEPTED
          is the only way a Deal row comes into being. */}
      <div className="flex flex-col gap-1 rounded-md border border-teal/30 bg-teal-muted/30 p-3">
        <p className="type-eyebrow flex items-center gap-1.5">
          <Unlock className="size-3 text-teal" />
          Counterparty — identity released
        </p>
        <p className="flex items-center gap-1.5 font-medium">
          {deal.counterparty.legalName}
          {deal.counterparty.verified && <BadgeCheck className="size-4 text-teal" />}
        </p>
        <p className="type-data flex flex-wrap items-center gap-x-3 text-xs text-text-secondary">
          <span>{deal.counterparty.city}</span>
          <span className="inline-flex items-center gap-1">
            <Phone className="size-3" />
            {deal.counterparty.contactPhone}
          </span>
          <span className="font-sans">{deal.counterparty.contactName}</span>
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger-muted/40 p-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
          {error}
        </p>
      )}

      {events.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {events.map((event) => (
            <Button
              key={event}
              size="sm"
              variant={event === "CANCEL" ? "destructive" : event === "SETTLE" ? "teal" : "default"}
              loading={busy === event}
              onClick={() => fire(event)}
            >
              {DEAL_EVENT_LABEL[event]}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-tertiary">
          {availableEventsExist(deal.state)
            ? `Waiting on the ${deal.role === "buyer" ? "seller" : "buyer"} — the next move is theirs.`
            : `This deal has reached ${DEAL_STATE_LABEL[deal.state].toLowerCase()} — no further moves.`}
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowTrail((s) => !s)}
          aria-expanded={showTrail}
          className="type-eyebrow flex items-center gap-1 hover:text-text-secondary"
        >
          <ChevronDown className={`size-3 transition-transform ${showTrail ? "rotate-180" : ""}`} />
          Audit trail ({deal.events.length})
        </button>

        {showTrail && (
          <ol className="mt-2 flex flex-col gap-2 border-l border-line pl-3">
            {deal.events.map((e) => (
              <li key={e.id} className="text-xs">
                <p className="type-data text-text-secondary">
                  {e.fromState ? `${e.fromState} → ` : ""}
                  <span className="text-amber">{e.toState}</span>
                </p>
                <p className="text-text-tertiary">
                  {e.actorName} · {formatDateTime(e.createdAt)}
                </p>
                {e.note && <p className="mt-0.5 text-text-secondary">{e.note}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </article>
  );
}
