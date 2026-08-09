"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/lib/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

/**
 * Persistent left rail, desktop only (`hidden lg:flex` — BottomTabBar takes
 * over below that breakpoint). Icon chips rather than bare icons: the active
 * destination gets a solid amber chip, everything else a neutral sunken one,
 * so the eye finds "where am I" before it reads a single word of label.
 */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface-raised lg:flex">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
        <span
          aria-hidden
          className="type-display grid size-8 shrink-0 place-items-center rounded-md bg-amber text-sm text-on-amber shadow-e1"
        >
          IM
        </span>
        <span className="type-display text-base tracking-tight">IndusMate</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-amber-muted text-amber"
                  : "text-text-secondary hover:bg-surface-overlay hover:text-text-primary",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-md transition-colors",
                  active ? "bg-amber text-on-amber shadow-e1" : "bg-surface-sunken text-text-tertiary",
                )}
              >
                <Icon className="size-4" />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line-subtle px-3 py-3">
        <ThemeToggle />
      </div>
    </aside>
  );
}
