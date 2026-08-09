import { Factory, Package, Truck, Recycle, type LucideIcon } from "lucide-react";
import type { OrgType } from "@prisma/client";

export const ORG_TYPE_META: Record<
  OrgType,
  { label: string; icon: LucideIcon; className: string }
> = {
  MANUFACTURER: {
    label: "Manufacturer",
    icon: Factory,
    className: "text-amber",
  },
  SUPPLIER: {
    label: "Supplier",
    icon: Package,
    className: "text-sky-400",
  },
  TRANSPORTER: {
    label: "Transporter",
    icon: Truck,
    className: "text-rose-400",
  },
  RECYCLER: {
    label: "Recycler",
    icon: Recycle,
    className: "text-teal",
  },
};

/**
 * Reputation line shown wherever a counterparty appears — masked or not.
 * Identical formatting either way, so the only thing that changes on reveal
 * is the name above it.
 */
export function ReputationLine({
  rating,
  dealCount,
  onTimePct,
  className,
}: {
  rating: number;
  dealCount: number;
  onTimePct: number;
  className?: string;
}) {
  return (
    <span className={className}>
      {rating.toFixed(1)}/5 · {dealCount} deals · {onTimePct}% on-time
    </span>
  );
}
