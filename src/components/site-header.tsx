import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";

import { getCurrentOrg, listDemoOrgs, toDemoOrgOption } from "@/lib/auth";
import { AccountSwitcher } from "@/components/account-switcher";
import { MainNav } from "@/components/main-nav";

export async function SiteHeader() {
  const [current, orgs] = await Promise.all([getCurrentOrg(), listDemoOrgs()]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="flex items-center gap-3 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span
              aria-hidden
              className="type-display grid size-7 place-items-center rounded-sm bg-amber text-xs text-on-amber"
            >
              IM
            </span>
            <span className="type-display hidden text-base tracking-tight sm:inline">
              IndusMate
            </span>
          </Link>

          <div className="ml-auto flex min-w-0 items-center gap-3">
            {/* Current org's standing, always visible — reputation is the
                currency that replaces identity while bidding is sealed. */}
            <div className="hidden items-center gap-3 text-xs text-muted-foreground md:flex">
              {current.verified && (
                <span className="flex items-center gap-1">
                  <BadgeCheck className="size-3.5 text-teal-400" />
                  KYC verified
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {current.rating.toFixed(1)}
                <span className="opacity-70">· {current.dealCount} deals</span>
              </span>
            </div>

            {/* Narrowed before it crosses into a client component. The full
                row stays on the server. */}
            <AccountSwitcher current={toDemoOrgOption(current)} orgs={orgs} />
          </div>
        </div>

        <div className="pb-2">
          <MainNav />
        </div>
      </div>
    </header>
  );
}
