import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * Status marker.
 *
 * Squared, not pill-shaped — this is a stencilled plant marking, not a chip in
 * a consumer app.
 *
 * NEVER USE COLOUR ALONE. Every semantic variant below is meant to be rendered
 * with an icon and a word inside it. A red badge that just says "12" tells a
 * colour-blind operator, or anyone looking at a washed-out projector, nothing
 * at all. The variants are named for meaning rather than hue so the call site
 * reads as intent.
 */
const badgeVariants = cva(
  [
    "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1",
    "rounded-sm border px-2 py-0.5",
    "text-[0.6875rem] font-semibold tracking-wide uppercase whitespace-nowrap",
    "[&>svg]:pointer-events-none [&>svg]:size-3!",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-transparent bg-amber text-on-amber",
        secondary: "border-transparent bg-secondary text-text-secondary",
        outline: "border-line-strong text-text-secondary",
        /** KYC verified, settled, circular-economy. */
        verified: "border-teal/40 bg-teal-muted text-teal",
        /** Sealed / withheld identity. The signature state. */
        masked: "border-masked/45 bg-masked-muted text-masked",
        warning: "border-warning/40 bg-warning-muted text-warning",
        danger: "border-danger/40 bg-danger-muted text-danger",
        /** Inert — cancelled, expired, closed. */
        muted: "border-line bg-surface-raised text-disabled-fg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
