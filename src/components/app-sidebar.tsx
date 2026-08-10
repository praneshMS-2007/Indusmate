"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, SETTINGS_ITEM } from "@/lib/nav";
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
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <Link href="/" className="flex items-center gap-3.5 px-5 py-5 mb-4 mt-2">
        <img 
          src="/logo.webp" 
          alt="IndusMate Logo" 
          width={48} 
          height={48} 
          className="size-12 rounded-lg object-contain bg-surface-raised p-1 shadow-e1 ring-1 ring-white/10" 
        />
        <span className="type-display text-2xl font-bold tracking-tight">IndusMate</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {[...NAV_ITEMS, SETTINGS_ITEM].map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-md transition-colors",
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-e1" : "bg-black/15 text-sidebar-foreground/60 dark:bg-white/10",
                )}
              >
                <Icon className="size-4" />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
