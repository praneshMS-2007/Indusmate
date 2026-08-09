/** Shared display formatting. Kept out of components so every market renders
 *  identically — there is no per-market display logic anywhere. */

/** Whole rupees, Indian digit grouping. Money is Int throughout. */
export function rupees(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

/** Compact form for cards: ₹62,000 → ₹62.0k, ₹1,20,000 → ₹1.2L */
export function rupeesShort(amount: number): string {
  if (amount >= 100_000) return "₹" + (amount / 100_000).toFixed(1) + "L";
  if (amount >= 1_000) return "₹" + (amount / 1_000).toFixed(1) + "k";
  return "₹" + amount;
}

/**
 * "closes in 4h 20m", "closes in 3 days", "closed".
 * Deliberately coarse — a live-ticking countdown is a distraction on stage.
 */
export function timeRemaining(closesAt: Date | string): string {
  const ms = new Date(closesAt).getTime() - Date.now();
  if (ms <= 0) return "closed";

  const mins = Math.floor(ms / 60_000);
  const h = Math.floor(mins / 60);
  const d = Math.floor(h / 24);

  if (d >= 2) return `closes in ${d} days`;
  if (h >= 1) return `closes in ${h}h ${mins % 60}m`;
  return `closes in ${mins}m`;
}

const DATE_FMT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

/** "12 Aug – 14 Aug" */
export function formatWindow(start: Date | string, end: Date | string): string {
  return `${DATE_FMT.format(new Date(start))} – ${DATE_FMT.format(new Date(end))}`;
}

export function formatDateTime(d: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}
