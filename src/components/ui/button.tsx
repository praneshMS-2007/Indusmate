import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * IndusMate button.
 *
 * Sized for a thumb in a work glove, not a mouse pointer: the default is 44px
 * tall, which is the platform minimum touch target. shadcn ships 32px, which
 * is fine for a desktop admin panel and wrong for a plant yard.
 *
 * Exactly one variant is amber. If everything is primary, nothing is — amber
 * means "this is the control you operate", the same way it does on a machine.
 */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-md border border-transparent text-sm font-medium whitespace-nowrap",
    "transition-[background-color,border-color,color,opacity] duration-150",
    "outline-none select-none",
    // Pressed state is a real 1px travel — the panel-button feel.
    "active:translate-y-px",
    // Disabled stays readable. An operator needs to read the label to work out
    // why it is off.
    "disabled:pointer-events-none disabled:opacity-60",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        /** The action. Amber, dark text, appears once per view. */
        default: "bg-amber text-on-amber hover:bg-amber-strong",
        /** Secondary action with a compliant 3:1 boundary. */
        outline:
          "border-line-strong bg-transparent text-text-primary hover:bg-surface-raised hover:border-amber/60 aria-expanded:bg-surface-raised",
        secondary: "bg-secondary text-text-primary hover:bg-line-subtle",
        ghost:
          "text-text-secondary hover:bg-surface-raised hover:text-text-primary aria-expanded:bg-surface-raised",
        /** Destructive is outlined, not filled — a filled red button invites
         *  the very mis-click it is dangerous for. */
        destructive:
          "border-danger/50 bg-danger/10 text-danger hover:bg-danger/20 hover:border-danger",
        /** Circular-economy / settle actions. */
        teal: "bg-teal text-on-teal hover:bg-teal/85",
        link: "text-amber underline-offset-4 hover:underline",
      },
      size: {
        /** 44px — the platform minimum touch target. */
        default: "h-11 px-4",
        /** 36px visible, but `touch-target` expands the hit area to 44px. */
        sm: "h-9 px-3 text-[0.8125rem] touch-target",
        lg: "h-12 px-5 text-base",
        icon: "size-11",
        "icon-sm": "size-9 touch-target",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Shows a spinner, blocks input, and announces busy to screen readers. */
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {/* asChild hands rendering to Radix Slot, which accepts exactly ONE
          child — so children must pass through untouched. Wrapping them, or
          rendering a sibling spinner alongside them, throws "Slot failed to
          slot onto its children" at request time. A `loading` link is not a
          meaningful state anyway: navigate, don't spin. */}
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
