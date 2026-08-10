import { Loader2 } from "lucide-react";

/**
 * Root loading boundary.
 *
 * Next.js streams this instantly while the root layout's async work
 * (getSession, getCurrentOrg, database queries) resolves. Without this,
 * the browser shows a blank white page until the server component tree
 * finishes rendering — which can be 3–8 seconds on a Vercel cold start.
 *
 * With this, users see a branded loading state in <200ms.
 */
export default function RootLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2 className="size-8 animate-spin text-amber" />
      <p className="text-sm text-text-secondary animate-pulse">Loading IndusMate…</p>
    </div>
  );
}
