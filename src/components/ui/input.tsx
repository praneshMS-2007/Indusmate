import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * 44px tall, boundary at 3:1, and `text-base` on small screens — anything
 * under 16px makes iOS Safari zoom the viewport on focus, which on a form
 * this long is genuinely disorienting.
 *
 * Pass `data-numeric` for figures: bid amounts, tonnages, distances. It
 * switches the field to IBM Plex Mono with tabular figures so the value reads
 * like an instrument, matching how the same number renders everywhere else.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md border border-input bg-surface-sunken px-3 py-2",
        "text-base text-text-primary transition-colors outline-none md:text-sm",
        "placeholder:text-text-tertiary",
        "hover:border-line-strong/80",
        "focus-visible:border-amber focus-visible:ring-2 focus-visible:ring-amber/30",
        // Disabled is dimmed but still legible.
        "disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-disabled-fg disabled:opacity-80",
        // Error. Never colour alone — the field pairs this with a message
        // rendered beneath it by the form.
        "aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/25",
        // Figures render as instrument data.
        "data-[numeric]:type-data",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
