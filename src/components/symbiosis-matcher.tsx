"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Beaker,
  Loader2,
  RotateCcw,
  Sparkles,
  Star,
} from "lucide-react";

import type { SymbiosisResult, MatchConfidence } from "@/lib/symbiosis";
import { rupees } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CONFIDENCE_LABEL: Record<MatchConfidence, string> = {
  HIGH: "High confidence",
  MEDIUM: "Medium confidence",
  LOW: "Low confidence",
};

const CONFIDENCE_CLASS: Record<MatchConfidence, string> = {
  HIGH: "border-teal/40 text-teal",
  MEDIUM: "border-amber/40 text-amber",
  LOW: "border-line-strong text-text-secondary",
};

/**
 * The innovation-slide feature, made real. A byproduct listing carries no
 * name — only a measured specification (composition, form, moisture,
 * contaminants, source process). This asks Gemini to work outward from that
 * spec to the industries that can consume it as feedstock, an indicative
 * Indian ex-works value range, and — where a real fit exists — the organisation
 * on this platform that could buy it.
 *
 * Idle until asked: on every other listing type the button simply is not
 * rendered (see the caller). On a byproduct listing it starts idle so the
 * page never fires a paid API call just because someone opened the tab.
 */
export function SymbiosisMatcher({ listingId }: { listingId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SymbiosisResult | null>(null);

  async function run(force: boolean) {
    setState("loading");
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}/symbiosis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setState("error");
        return;
      }
      setResult(data as SymbiosisResult);
      setState("done");
    } catch {
      setError("Could not reach the matcher. Check your connection and try again.");
      setState("error");
    }
  }

  if (state === "idle") {
    return (
      <section className="elevated-flat rounded-md border border-teal/30 bg-teal-muted/20 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="type-display text-base">Find buyers for this waste</h2>
            <p className="mt-1 text-sm text-text-secondary">
              This listing was written by specification, not by name. Ask the matcher which
              industries can take it as feedstock, and whether anyone already on IndusMate is
              one of them.
            </p>
          </div>
        </div>
        <Button className="mt-3" onClick={() => run(false)}>
          <Sparkles />
          Find buyers for this waste
        </Button>
      </section>
    );
  }

  if (state === "loading") {
    return (
      <section className="rounded-md border border-teal/30 bg-teal-muted/20 p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 shrink-0 animate-spin text-teal" aria-hidden />
          <div>
            <p className="font-medium">Reading the specification…</p>
            <p className="text-sm text-text-secondary">
              Matching composition, source process and hazard class against Indian industrial
              demand. Usually under ten seconds.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="rounded-md border border-danger/40 bg-danger-muted/30 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium">The matcher could not finish</p>
            <p className="mt-1 text-sm text-text-secondary" role="alert">
              {error}
            </p>
          </div>
        </div>
        <Button className="mt-3" variant="outline" size="sm" onClick={() => run(false)}>
          <RotateCcw />
          Try again
        </Button>
      </section>
    );
  }

  // state === "done"
  const r = result!;
  return (
    <section className="elevated flex flex-col gap-4 rounded-md border border-teal/30 bg-teal-muted/10 p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="type-eyebrow flex items-center gap-1.5 text-teal">
            <Sparkles className="size-3.5" aria-hidden />
            AI symbiosis match{r.cached ? " · cached" : ""}
          </p>
          <h2 className="type-display mt-1 text-base">
            Identified as {r.identifiedMaterial}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">{r.identificationBasis}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className={CONFIDENCE_CLASS[r.identificationConfidence]}>
            {CONFIDENCE_LABEL[r.identificationConfidence]}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            loading={false}
            onClick={() => run(true)}
            title="Ask again, bypassing the cached answer"
          >
            <RotateCcw />
            Regenerate
          </Button>
        </div>
      </header>

      {r.onPlatform.length > 0 && (
        <div>
          <h3 className="type-eyebrow mb-2">On IndusMate right now</h3>
          <div className="flex flex-col gap-2">
            {r.onPlatform.map((org) => (
              <div
                key={org.orgId}
                className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-amber/40 bg-amber-muted/20 p-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-medium">
                    <span className="truncate">{org.name}</span>
                    {org.verified && (
                      <BadgeCheck className="size-4 shrink-0 text-teal" aria-label="KYC verified" />
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {org.city} · <Star className="inline size-3 fill-amber text-amber" />{" "}
                    {org.rating.toFixed(1)}/5 · {org.dealCount} deals
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">{org.reason}</p>
                </div>
                <Badge className="shrink-0 bg-amber text-black">On platform</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="type-eyebrow mb-2">Industries that can use this</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {r.matches.map((m, i) => (
            <article
              key={i}
              className="elevated-flat flex flex-col gap-2 rounded-md border border-line bg-surface-raised p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-medium">
                    <Beaker className="size-3.5 shrink-0 text-teal" aria-hidden />
                    <span className="truncate">{m.industry}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">{m.application}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("shrink-0 text-[10px]", CONFIDENCE_CLASS[m.confidence])}
                >
                  {m.confidence}
                </Badge>
              </div>

              <p className="text-sm text-text-secondary">{m.whyItFits}</p>

              <div className="mt-1 flex items-end justify-between gap-2 border-t border-line-subtle pt-2">
                <div>
                  <p className="text-[11px] text-text-tertiary">Substitutes for {m.substitutesFor}</p>
                  <p className="text-[11px] text-text-tertiary">{m.processingRequired}</p>
                </div>
                <p className="type-data shrink-0 text-right text-sm font-semibold text-teal">
                  {rupees(m.valueLowInrPerTonne)}–{rupees(m.valueHighInrPerTonne)}
                  <span className="block text-[10px] font-normal text-text-tertiary">per tonne</span>
                </p>
              </div>

              {m.standard !== "No specific standard" && (
                <p className="type-data text-[11px] text-text-tertiary">{m.standard}</p>
              )}
            </article>
          ))}
        </div>
      </div>

      {r.cautions.length > 0 && (
        <div className="rounded-md border border-warning/40 bg-warning-muted/30 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-warning">
            <AlertTriangle className="size-3.5" aria-hidden />
            Handling and compliance
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-text-secondary">
            {r.cautions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-text-tertiary">
        Generated by {r.model} from this listing&apos;s specification alone — the material&apos;s
        name was never given to the model. Values are indicative, not a quote.
      </p>
    </section>
  );
}
