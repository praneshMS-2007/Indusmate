"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { LISTING_TYPES, LISTING_TYPE_META, type ListingType } from "@/lib/listing-spec";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const STATUSES = ["OPEN", "BIDDING", "AWARDED", "CLOSED", "CANCELLED", "EXPIRED"] as const;

const ALL = "__all__";

export function BrowseFilters({
  cities,
  active,
}: {
  cities: string[];
  active: { type?: string; city?: string; status?: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function withParam(key: string, value: string | null): string {
    const next = new URLSearchParams(params.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const hasFilters = Boolean(active.type || active.city || active.status);

  return (
    <div className="flex flex-col gap-3">
      {/* Market chips. Links, not buttons — they work before hydration and
          each one is a shareable URL. */}
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max items-center gap-1.5">
          <FilterChip href={withParam("type", null)} active={!active.type}>
            All markets
          </FilterChip>
          {LISTING_TYPES.map((t: ListingType) => (
            <FilterChip key={t} href={withParam("type", t)} active={active.type === t}>
              {LISTING_TYPE_META[t].label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={active.city ?? ALL}
          onValueChange={(v) => router.push(withParam("city", v === ALL ? null : v))}
        >
          <SelectTrigger className="w-[150px]" size="sm" aria-label="Filter by city">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All cities</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={active.status ?? ALL}
          onValueChange={(v) => router.push(withParam("status", v === ALL ? null : v))}
        >
          <SelectTrigger className="w-[150px]" size="sm" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button asChild variant="ghost" size="sm">
            <Link href={pathname}>
              <X className="size-3.5" />
              Clear
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={
        "rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors " +
        (active
          ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
          : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground")
      }
    >
      {children}
    </Link>
  );
}
