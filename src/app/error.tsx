"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Error boundary.
 *
 * Says what happened, what it means for the operator's work, and what to do —
 * in the same voice as the rest of the interface. Never a stack trace: the
 * digest is enough to find the real error in the server logs, and a wall of
 * JavaScript on a projector helps nobody.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The detail belongs in the console and the server logs, not on screen.
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <AlertTriangle className="size-9 text-amber" />

      <div>
        <h1 className="type-display text-2xl">That didn&apos;t load</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Something went wrong on our side, not yours. Nothing you had entered has been submitted,
          and no bid or deal has been changed.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>
          <RotateCcw className="size-4 mr-2" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/browse">Go to browse</Link>
        </Button>
      </div>

      {error.digest && (
        <p className="type-data text-xs text-text-tertiary">
          Reference {error.digest} — quote this if you report it.
        </p>
      )}
    </div>
  );
}
