"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Gavel, Lock, ShieldCheck, Unlock } from "lucide-react";
import { toast } from "sonner";

import type { MaskedBid } from "@/lib/masking";
import { rupees } from "@/lib/format";
import { MaskedBidCard } from "@/components/masked-bid-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BidPanelProps {
  listingId: string;
  direction: "REVERSE" | "FORWARD";
  isOwner: boolean;
  bids: MaskedBid[];
  ownBid: MaskedBid | null;
  totalBids: number;
  dealState: string | null;
  dealId: string | null;
  referencePrice: number;
  unit: string;
  closed: boolean;
  awarded: boolean;
}

/**
 * The bid panel — sealed submission, the masked inbox, counters, and the
 * accept gateway where identity is released.
 *
 * Everything rendered here has already been through maskBid() on the server.
 * This component never receives a rival's bid, so there is nothing here it
 * could leak even if it tried.
 */
export function BidPanel(props: BidPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Set after an accept so the winning card plays the reveal once. */
  const [justRevealed, setJustRevealed] = useState<string | null>(null);

  async function call(url: string, body: object, action: string): Promise<boolean> {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return false;
      }
      return true;
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="type-display flex items-center gap-2 text-lg">
          <Gavel className="size-4 text-amber" />
          {props.isOwner ? "Bid inbox" : "Your bid"}
        </h2>
        {props.isOwner && (
          <Badge variant={props.totalBids > 0 ? "masked" : "outline"} className="gap-1">
            <Lock />
            {props.totalBids} sealed
          </Badge>
        )}
      </header>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger-muted/40 p-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
          {error}
        </p>
      )}

      {props.isOwner ? (
        <OwnerInbox {...props} busy={busy} justRevealed={justRevealed} onAccept={async (bidId) => {
          if (await call(`/api/bids/${bidId}`, { action: "accept" }, `accept:${bidId}`)) {
            setJustRevealed(bidId);
            toast.success("Bid accepted. Identities released to both parties.");
            router.refresh();
          }
        }} onReject={async (bidId) => {
          if (await call(`/api/bids/${bidId}`, { action: "reject" }, `reject:${bidId}`)) {
            toast.success("Bid rejected. The bidder stays anonymous.");
            router.refresh();
          }
        }} onCounter={async (bidId, amount, note) => {
          if (await call(`/api/bids/${bidId}`, { action: "counter", amount, note }, `counter:${bidId}`)) {
            toast.success(`Counter-offer sent at ${rupees(amount)}.`);
            router.refresh();
            return true;
          }
          return false;
        }} />
      ) : (
        <BidderView {...props} busy={busy} onPlace={async (amount, message) => {
          if (await call(`/api/listings/${props.listingId}/bids`, { amount, message }, "place")) {
            toast.success("Bid placed. It is sealed — nobody can see your number.");
            router.refresh();
            return true;
          }
          return false;
        }} onAcceptCounter={async (bidId) => {
          if (await call(`/api/bids/${bidId}`, { action: "accept-counter" }, "accept-counter")) {
            setJustRevealed(bidId);
            toast.success("Counter accepted. Identities released to both parties.");
            router.refresh();
          }
        }} onRecounter={async (bidId, amount) => {
          if (await call(`/api/bids/${bidId}`, { action: "recounter", amount }, "recounter")) {
            toast.success(`Counter sent at ${rupees(amount)}.`);
            router.refresh();
            return true;
          }
          return false;
        }} />
      )}
    </section>
  );
}

/* ========================================================================== */
/* Owner                                                                       */
/* ========================================================================== */

function OwnerInbox({
  bids,
  direction,
  dealState,
  busy,
  justRevealed,
  onAccept,
  onReject,
  onCounter,
}: BidPanelProps & {
  busy: string | null;
  justRevealed: string | null;
  onAccept: (bidId: string) => void;
  onReject: (bidId: string) => void;
  onCounter: (bidId: string, amount: number, note: string) => Promise<boolean>;
}) {
  const settled = dealState !== null;

  if (bids.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-line-strong p-6 text-center">
        <ShieldCheck className="size-7 text-text-tertiary" />
        <div>
          <p className="font-medium">No bids yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            When bids arrive they appear here sealed — you will see each bidder&apos;s price and
            track record, but not who they are.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!settled && (
        <p className="flex items-start gap-2 rounded-md border border-masked/30 bg-masked-muted/40 p-3 text-xs text-text-secondary">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-masked" />
          <span>
            Ranked by price, {direction === "REVERSE" ? "cheapest" : "highest"} first. Identities
            stay sealed until you accept one.
          </span>
        </p>
      )}

      {bids.map((bid, i) => (
        <OwnerBidRow
          key={bid.id}
          bid={bid}
          rank={i + 1}
          best={i === 0}
          settled={settled}
          busy={busy}
          animate={justRevealed === bid.id}
          onAccept={onAccept}
          onReject={onReject}
          onCounter={onCounter}
        />
      ))}
    </div>
  );
}

function OwnerBidRow({
  bid,
  rank,
  best,
  settled,
  busy,
  animate,
  onAccept,
  onReject,
  onCounter,
}: {
  bid: MaskedBid;
  rank: number;
  best: boolean;
  settled: boolean;
  busy: string | null;
  animate: boolean;
  onAccept: (bidId: string) => void;
  onReject: (bidId: string) => void;
  onCounter: (bidId: string, amount: number, note: string) => Promise<boolean>;
}) {
  const [countering, setCountering] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const closed = bid.status === "REJECTED" || bid.status === "WITHDRAWN";

  return (
    <div className="flex flex-col gap-2">
      <MaskedBidCard
        rank={rank}
        amount={bid.amount}
        message={bid.message}
        reputation={bid.reputation}
        identity={bid.identity}
        best={best && !closed}
        animateOnMount={animate}
        className={closed ? "opacity-60" : undefined}
      />

      {bid.counterAmount !== null && (
        <p className="type-data flex items-center gap-2 rounded-md border border-amber/30 bg-amber-muted/30 px-3 py-2 text-xs">
          <span className="type-eyebrow">Your counter</span>
          <span className="text-amber">{rupees(bid.counterAmount)}</span>
          <span className="font-sans text-text-tertiary">awaiting their response</span>
        </p>
      )}

      {!settled && !closed && (
        <div className="flex flex-col gap-2">
          {countering ? (
            <div className="flex flex-col gap-2 rounded-md border border-line bg-surface-raised p-3">
              <Label htmlFor={`counter-${bid.id}`}>Counter at</Label>
              <Input
                id={`counter-${bid.id}`}
                data-numeric
                type="number"
                inputMode="numeric"
                placeholder="51000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Textarea
                rows={2}
                placeholder="Why this number. Optional."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  loading={busy === `counter:${bid.id}`}
                  onClick={async () => {
                    const n = Number(amount);
                    if (!Number.isFinite(n) || n <= 0) return;
                    if (await onCounter(bid.id, n, note)) {
                      setCountering(false);
                      setAmount("");
                      setNote("");
                    }
                  }}
                >
                  Send counter
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCountering(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                loading={busy === `accept:${bid.id}`}
                onClick={() => onAccept(bid.id)}
              >
                <Unlock />
                Accept bid
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCountering(true)}>
                Counter
              </Button>
              <Button
                size="sm"
                variant="destructive"
                loading={busy === `reject:${bid.id}`}
                onClick={() => onReject(bid.id)}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ========================================================================== */
/* Bidder                                                                      */
/* ========================================================================== */

function BidderView({
  ownBid,
  direction,
  referencePrice,
  unit,
  closed,
  awarded,
  dealState,
  busy,
  onPlace,
  onAcceptCounter,
  onRecounter,
}: BidPanelProps & {
  busy: string | null;
  onPlace: (amount: number, message: string) => Promise<boolean>;
  onAcceptCounter: (bidId: string) => void;
  onRecounter: (bidId: string, amount: number) => Promise<boolean>;
}) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [recounterAmount, setRecounterAmount] = useState("");

  if (!ownBid && (closed || awarded)) {
    return (
      <div className="rounded-md border border-dashed border-line-strong p-6 text-center">
        <p className="font-medium">Bidding has closed</p>
        <p className="mt-1 text-sm text-text-secondary">
          {awarded ? "This listing has been awarded." : "The deadline for this listing has passed."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {ownBid ? (
        <>
          <MaskedBidCard
            amount={ownBid.amount}
            message={ownBid.message}
            reputation={ownBid.reputation}
            identity={ownBid.identity}
            animateOnMount={Boolean(ownBid.identity) && dealState === "ACCEPTED"}
          />

          <p className="flex items-start gap-2 rounded-md border border-masked/30 bg-masked-muted/40 p-3 text-xs text-text-secondary">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-masked" />
            <span>
              This is the only bid you can see. Other bidders&apos; prices are sealed from you, and
              yours from them — now and after the deal closes.
            </span>
          </p>

          {/* The owner has countered — respond. */}
          {ownBid.counterAmount !== null && ownBid.status === "COUNTERED" && (
            <div className="flex flex-col gap-3 rounded-md border border-amber/40 bg-amber-muted/30 p-4">
              <div>
                <p className="type-eyebrow">Counter-offer received</p>
                <p className="type-data mt-1 text-2xl text-amber">{rupees(ownBid.counterAmount)}</p>
                {ownBid.counterNote && (
                  <p className="mt-1 text-sm text-text-secondary">
                    &ldquo;{ownBid.counterNote}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <Button
                  loading={busy === "accept-counter"}
                  onClick={() => onAcceptCounter(ownBid.id)}
                >
                  <Unlock />
                  Accept {rupees(ownBid.counterAmount)}
                </Button>
              </div>

              <div className="flex flex-col gap-2 border-t border-amber/20 pt-3">
                <Label htmlFor="recounter">Or come back with</Label>
                <div className="flex gap-2">
                  <Input
                    id="recounter"
                    data-numeric
                    type="number"
                    inputMode="numeric"
                    placeholder={String(ownBid.counterAmount)}
                    value={recounterAmount}
                    onChange={(e) => setRecounterAmount(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    loading={busy === "recounter"}
                    onClick={async () => {
                      const n = Number(recounterAmount);
                      if (!Number.isFinite(n) || n <= 0) return;
                      if (await onRecounter(ownBid.id, n)) setRecounterAmount("");
                    }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!closed && !awarded && ownBid.status === "ACTIVE" && (
            <details className="rounded-md border border-line bg-surface-raised p-3">
              <summary className="cursor-pointer text-sm font-medium">Revise your bid</summary>
              <div className="mt-3 flex flex-col gap-2">
                <Input
                  data-numeric
                  type="number"
                  inputMode="numeric"
                  placeholder={String(ownBid.amount)}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Button
                  size="sm"
                  loading={busy === "place"}
                  onClick={async () => {
                    const n = Number(amount);
                    if (!Number.isFinite(n) || n <= 0) return;
                    if (await onPlace(n, message)) setAmount("");
                  }}
                >
                  Update bid
                </Button>
              </div>
            </details>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-4">
          <div>
            <Label htmlFor="bid-amount">Your bid (₹ per {unit})</Label>
            <p className="mt-1 text-xs text-text-tertiary">
              {direction === "REVERSE"
                ? `Their budget is ${rupees(referencePrice)}. Lower bids rank higher.`
                : `They are asking ${rupees(referencePrice)}. Higher bids rank higher.`}
            </p>
          </div>
          <Input
            id="bid-amount"
            data-numeric
            type="number"
            inputMode="numeric"
            placeholder={String(referencePrice)}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Textarea
            rows={3}
            placeholder="Anything that makes your bid stronger — equipment, timing, track record."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button
            loading={busy === "place"}
            onClick={async () => {
              const n = Number(amount);
              if (!Number.isFinite(n) || n <= 0) return;
              if (await onPlace(n, message)) {
                setAmount("");
                setMessage("");
              }
            }}
          >
            <Lock />
            Place sealed bid
          </Button>
          <p className="text-xs text-text-tertiary">
            Sealed: the owner sees your price and track record, not your name. Other bidders see
            nothing at all.
          </p>
        </div>
      )}
    </div>
  );
}
