import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";

import { getCurrentOrg } from "@/lib/auth";
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
  const current = await getCurrentOrg();

  return (
    <header className="relative z-30 mx-4 mt-4 mb-4 lg:mx-6 lg:mb-6 rounded-xl bg-[#3E2723] text-white shadow-lg border border-[#4E3733]">
      <div className="flex items-center justify-between lg:justify-evenly px-5 py-3.5">
        
        {/* Mobile Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 lg:hidden">
          <span
            aria-hidden
            className="type-display grid size-8 place-items-center rounded-sm bg-amber text-sm text-on-amber"
          >
            IM
          </span>
        </Link>

        {/* Desktop: KYC verified */}
        {current.verified ? (
          <span className="hidden lg:flex items-center gap-2 font-medium text-white">
            <BadgeCheck className="size-5" />
            KYC verified
          </span>
        ) : (
          <span className="hidden lg:block" />
        )}

        {/* Desktop: Rating */}
        <span className="hidden lg:flex type-data items-center gap-2 text-white">
          <Star className="size-5 fill-amber-400 text-amber-400" />
          <span className="text-base font-semibold">{current.rating.toFixed(1)}</span>
          <span className="text-white ml-1">· {current.dealCount} deals</span>
        </span>

        {/* Both: Right side (Theme toggle on mobile + Company Name) */}
        <div className="flex items-center gap-4 text-right">
          <div className="lg:hidden">
            <ThemeToggle collapsed />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-wide text-white">{current.name}</span>
            <span className="type-caption text-white">{current.type}</span>
          </div>
        </div>
        
      </div>
    </header>
  );
}
