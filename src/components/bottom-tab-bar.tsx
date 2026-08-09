"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * Replaces the horizontal-scroll nav below `lg`. A thumb reaches a fixed
 * bottom bar without the "did I scroll past a destination" doubt a
 * horizontal-scroll strip always carries — every one of the five
 * destinations is on screen at once, at 360px, with no swiping.
 *
 * `env(safe-area-inset-bottom)` keeps it clear of the home-indicator gesture
 * bar on notched phones — the exact device this app expects to be judged on.
 */
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-raised/95 backdrop-blur supports-[backdrop-filter]:bg-surface-raised/85 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-[56px] flex-col items-center justify-center gap-1 py-1.5"
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid size-7 place-items-center rounded-md transition-colors",
                    active ? "bg-amber text-on-amber" : "text-text-tertiary",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span
                  className={cn(
                    "truncate text-[10px] leading-none font-medium",
                    active ? "text-amber" : "text-text-tertiary",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
