"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import {
  LISTING_TYPES,
  LISTING_TYPE_META,
  SPEC_FIELDS,
  type ListingType,
  type SpecField,
} from "@/lib/listing-spec";
import { CITY_NAMES } from "@/lib/cities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** `yyyy-mm-dd` / `yyyy-mm-ddThh:mm` for date inputs, N days from now. */
function isoDate(daysAhead: number, withTime = false) {
  const d = new Date(Date.now() + daysAhead * 86_400_000);
  const s = new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString();
  return withTime ? s.slice(0, 16) : s.slice(0, 10);
}

/**
 * ONE form for all five markets.
 *
 * Everything above the spec section is shared, because every listing is the
 * same abstract thing: a capacity with a location, a window, a quantity and an
 * undecided price. Below it, the fields come from SPEC_FIELDS[type] — a table,
 * not a branch. There are no five forms and no `if (type === "FREIGHT")`
 * anywhere in this file except the destination field, which exists because
 * freight is the only market with two locations.
 */
export function ListingForm({ initialType }: { initialType?: ListingType }) {
  const router = useRouter();
  const [type, setType] = useState<ListingType>(initialType ?? "FREIGHT");
  const meta = LISTING_TYPE_META[type];

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [common, setCommon] = useState({
    title: "",
    description: "",
    locationCity: "Malanpur",
    destCity: "Pithampur",
    windowStart: isoDate(2),
    windowEnd: isoDate(4),
    closesAt: isoDate(1, true),
    quantity: "",
    referencePrice: "",
  });

  const [direction, setDirection] = useState(meta.defaultDirection);
  const [unit, setUnit] = useState(meta.defaultUnit);
  const [spec, setSpec] = useState<Record<string, string | boolean>>({});

  const fields = useMemo(() => SPEC_FIELDS[type], [type]);

  function changeType(next: ListingType) {
    setType(next);
    setSpec({}); // The old market's spec has no meaning in the new one.
    setDirection(LISTING_TYPE_META[next].defaultDirection);
    setUnit(LISTING_TYPE_META[next].defaultUnit);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          direction,
          unit,
          spec,
          ...common,
          destCity: meta.hasDestination ? common.destCity : undefined,
          quantity: Number(common.quantity),
          referencePrice: Number(common.referencePrice),
        }),
      });

      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create the listing");
        return;
      }

      toast.success("Listing posted");
      router.push(`/listings/${data.id}`);
      router.refresh();
    } catch {
      setError("Network error — the listing was not created. Check your connection and retry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {/* ---- Market picker -------------------------------------------- */}
      <section className="flex flex-col gap-2">
        <Label>Market</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LISTING_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => changeType(t)}
              aria-pressed={t === type}
              className={
                "rounded-md border p-3 text-left transition-colors " +
                (t === type
                  ? "border-amber/60 bg-amber-muted/50"
                  : "border-line hover:border-line-strong")
              }
            >
              <span className="block text-sm font-medium">{LISTING_TYPE_META[t].label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-text-secondary">{meta.blurb}</p>
      </section>

      {/* ---- Shared fields — identical for every market ---------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            required
            value={common.title}
            onChange={(e) => setCommon({ ...common, title: e.target.value })}
            placeholder="12t auto components — Malanpur to Pithampur"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            value={common.description}
            onChange={(e) => setCommon({ ...common, description: e.target.value })}
            placeholder="Anything a counterparty needs to know before bidding."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>{meta.hasDestination ? "Origin" : "Location"}</Label>
            <Select
              value={common.locationCity}
              onValueChange={(v) => setCommon({ ...common, locationCity: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CITY_NAMES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {meta.hasDestination && (
            <div className="flex flex-col gap-1.5">
              <Label>Destination</Label>
              <Select
                value={common.destCity}
                onValueChange={(v) => setCommon({ ...common, destCity: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITY_NAMES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="windowStart">Window opens</Label>
            <Input
              id="windowStart"
              type="date"
              required
              value={common.windowStart}
              onChange={(e) => setCommon({ ...common, windowStart: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="windowEnd">Window closes</Label>
            <Input
              id="windowEnd"
              type="date"
              required
              value={common.windowEnd}
              onChange={(e) => setCommon({ ...common, windowEnd: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              inputMode="decimal"
              step="any"
              required
              value={common.quantity}
              onChange={(e) => setCommon({ ...common, quantity: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="referencePrice">
              {direction === "REVERSE" ? "Your budget" : "Asking price"} (₹)
            </Label>
            <Input
              id="referencePrice"
              type="number"
              inputMode="numeric"
              step="1"
              required
              value={common.referencePrice}
              onChange={(e) => setCommon({ ...common, referencePrice: e.target.value })}
            />
            <p className="text-xs text-text-secondary">Whole rupees, per {unit}.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="closesAt">Bidding closes</Label>
            <Input
              id="closesAt"
              type="datetime-local"
              required
              value={common.closesAt}
              onChange={(e) => setCommon({ ...common, closesAt: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Auction direction</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["REVERSE", "FORWARD"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(d)}
                aria-pressed={d === direction}
                className={
                  "flex items-start gap-2 rounded-md border p-3 text-left transition-colors " +
                  (d === direction
                    ? "border-amber/60 bg-amber-muted/50"
                    : "border-line hover:border-line-strong")
                }
              >
                {d === "REVERSE" ? (
                  <TrendingDown className="mt-0.5 size-4 shrink-0" />
                ) : (
                  <TrendingUp className="mt-0.5 size-4 shrink-0" />
                )}
                <span>
                  <span className="block text-sm font-medium">
                    {d === "REVERSE" ? "Reverse" : "Forward"}
                  </span>
                  <span className="block text-xs text-text-secondary">
                    {d === "REVERSE" ? "Sellers bid it down" : "Buyers bid it up"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Spec — the ONLY part that differs by market --------------- */}
      <section className="flex flex-col gap-4 rounded-md border border-line bg-surface-raised/50 p-4">
        <div>
          <h2 className="text-sm font-medium">{meta.label} specification</h2>
          <p className="text-xs text-text-secondary">
            These fields come from the typed spec for this market. Change the market above and they
            change with it.
          </p>
        </div>

        {fields.map((field) => (
          <SpecInput
            key={field.name}
            field={field}
            value={spec[field.name]}
            onChange={(v) => setSpec((s) => ({ ...s, [field.name]: v }))}
          />
        ))}
      </section>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? "Posting…" : "Post listing"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function SpecInput({
  field,
  value,
  onChange,
}: {
  field: SpecField;
  value: string | boolean | undefined;
  onChange: (v: string | boolean) => void;
}) {
  const id = `spec-${field.name}`;

  return (
    <div className="flex flex-col gap-1.5">
      {field.kind === "boolean" ? (
        <label htmlFor={id} className="flex items-center gap-2 text-sm">
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="size-4 accent-amber"
          />
          {field.label}
        </label>
      ) : (
        <>
          <Label htmlFor={id}>
            {field.label}
            {field.suffix && <span className="ml-1 text-text-secondary">({field.suffix})</span>}
            {field.required && <span className="ml-1 text-amber">*</span>}
          </Label>

          {field.kind === "select" ? (
            <Select value={(value as string) ?? ""} onValueChange={onChange}>
              <SelectTrigger id={id}>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={id}
              type={field.kind === "number" ? "number" : "text"}
              inputMode={field.kind === "number" ? "decimal" : undefined}
              step={field.kind === "number" ? "any" : undefined}
              required={field.required}
              placeholder={field.placeholder}
              value={(value as string) ?? ""}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </>
      )}

      {field.help && <p className="text-xs text-text-secondary">{field.help}</p>}
    </div>
  );
}
