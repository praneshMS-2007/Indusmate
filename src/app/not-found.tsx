import Link from "next/link";
import { Compass, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <SearchX className="size-9 text-text-tertiary" />

      <div>
        <h1 className="type-display text-2xl">Nothing here</h1>
        <p className="mt-2 text-sm text-text-secondary">
          This listing or deal does not exist, or it was removed. Listings also disappear from
          public view once they have been awarded.
        </p>
      </div>

      <Button asChild>
        <Link href="/browse">
          <Compass />
          Browse open listings
        </Link>
      </Button>
    </main>
  );
}
