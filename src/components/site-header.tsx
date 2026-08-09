import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";

import { getCurrentOrg, listDemoOrgs, toDemoOrgOption } from "@/lib/auth";
import { AccountSwitcher } from "@/components/account-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * The slim top bar above the content column.
 *
 * Navigation lives in AppSidebar (desktop) and BottomTabBar (mobile) now —
 * this strip is identity only: who you are acting as, your standing, and the
 * theme switch. The brand mark only reappears here below `lg`, where the
 * sidebar (which already carries it) is hidden.
 */
export async function SiteHeader() {
  const [current, orgs] = await Promise.all([getCurrentOrg(), listDemoOrgs()]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 lg:hidden">
          <span
            aria-hidden
            className="type-display grid size-7 place-items-center rounded-sm bg-amber text-xs text-on-amber"
          >
            IM
          </span>
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          {/* Current org's standing, always visible — reputation is the
              currency that replaces identity while bidding is sealed. */}
          <div className="hidden items-center gap-3 text-xs text-text-secondary md:flex">
            {current.verified && (
              <span className="flex items-center gap-1">
                <BadgeCheck className="size-3.5 text-teal" />
                KYC verified
              </span>
            )}
            <span className="type-data flex items-center gap-1">
              <Star className="size-3.5 fill-amber text-amber" />
              {current.rating.toFixed(1)}
              <span className="text-text-tertiary">· {current.dealCount} deals</span>
            </span>
          </div>

          {/* The sidebar carries its own toggle at lg+; this one covers
              every width the sidebar is hidden at. */}
          <div className="lg:hidden">
            <ThemeToggle collapsed />
          </div>

          {/* Narrowed before it crosses into a client component. The full
              row stays on the server. */}
          <AccountSwitcher current={toDemoOrgOption(current)} orgs={orgs} />
        </div>
      </div>
    </header>
  );
}
