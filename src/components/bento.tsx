import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BENTO_SPAN, type BentoSpan } from "@/lib/roles";
import { cn } from "@/lib/utils";

/**
 * The bento grid.
 *
 * Twelve columns on desktop, six at tablet, four on a phone — and every row a
 * role composes must sum to 12, so the grid never leaves a ragged half-empty
 * line. That constraint is what separates a bento from a pile of cards: the
 * sizes vary, the rows do not.
 *
 * Spacing is the existing 8px system (gap-3 = 12px, gap-4 = 16px at lg), so
 * the dashboard sits on the same rhythm as every other screen rather than
 * inventing a second one.
 */
export function Bento({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-12 gap-3 lg:gap-4", className)}>{children}</div>
  );
}

export function BentoCard({
  span,
  hero = false,
  heroClass,
  title,
  eyebrow,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
}: {
  span: BentoSpan;
  /** The one card this role opens for. Gets the accent border. */
  hero?: boolean;
  /** Role accent classes, applied only when hero. */
  heroClass?: string;
  title: string;
  eyebrow?: string;
  icon?: LucideIcon;
  /** Optional "see all" link in the header. */
  action?: { label: string; href: string };
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "elevated flex min-w-0 flex-col rounded-md border bg-surface-raised",
        hero && heroClass ? heroClass : "border-line",
        BENTO_SPAN[span],
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-line-subtle px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <span
              aria-hidden
              className="grid size-7 shrink-0 place-items-center rounded-md bg-surface-sunken text-text-secondary"
            >
              <Icon className="size-3.5" />
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && <p className="type-eyebrow">{eyebrow}</p>}
            <h2 className="truncate text-sm font-medium">{title}</h2>
          </div>
        </div>
        {action && (
          <Link
            href={action.href}
            className="flex shrink-0 items-center gap-1 rounded-sm text-xs text-text-secondary transition-colors hover:text-amber"
          >
            {action.label}
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        )}
      </header>

      <div className={cn("flex min-w-0 flex-1 flex-col p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/**
 * The KPI bar — four cells that always resolve to one clean row.
 *
 * Every tile is a link. A number an operator cannot act on is decoration, and
 * this interface does not have room for decoration.
 */
export function KpiTile({
  label,
  value,
  suffix,
  href,
  icon: Icon,
  urgent = false,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  href: string;
  icon: LucideIcon;
  urgent?: boolean;
}) {
  const lit = urgent && Number(value) > 0;

  return (
    <Link
      href={href}
      className={cn(
        "elevated group flex min-w-0 flex-col justify-between gap-3 rounded-md border p-3.5 transition-colors",
        BENTO_SPAN.quarter,
        lit
          ? "border-amber/50 bg-amber-muted/25 hover:border-amber"
          : "border-line bg-surface-raised hover:border-line-strong",
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="truncate text-[11px] leading-tight text-text-secondary">{label}</span>
        <span
          aria-hidden
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-md",
            lit ? "bg-amber text-on-amber" : "bg-surface-sunken text-text-tertiary",
          )}
        >
          <Icon className="size-3.5" />
        </span>
      </span>
      <span className="flex items-baseline gap-0.5">
        <span
          className={cn(
            "type-data text-2xl leading-none font-semibold",
            lit ? "text-amber" : "text-text-primary",
          )}
        >
          {value}
        </span>
        {suffix && <span className="type-data text-xs text-text-tertiary">{suffix}</span>}
      </span>
    </Link>
  );
}

/**
 * Empty state inside a bento cell. Smaller and quieter than a page-level one —
 * a card that is empty because nothing has happened yet is normal, not a
 * failure, and should not shout.
 */
export function BentoEmpty({
  icon: Icon,
  children,
  action,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
      <Icon className="size-6 text-text-tertiary" aria-hidden />
      <p className="max-w-[28ch] text-xs text-text-secondary">{children}</p>
      {action && (
        <Link
          href={action.href}
          className="text-xs font-medium text-amber transition-colors hover:text-amber-strong"
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}
