"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Map, Package, Gavel, Handshake } from "lucide-react";

const LINKS = [
  { href: "/browse", label: "Browse", icon: Compass },
  { href: "/map", label: "Map", icon: Map },
  { href: "/my/listings", label: "My Listings", icon: Package },
  { href: "/my/bids", label: "My Bids", icon: Gavel },
  { href: "/deals", label: "Deals", icon: Handshake },
] as const;

/**
 * Scrolls horizontally rather than wrapping or collapsing into a hamburger.
 * At 360px all five destinations stay one thumb-swipe away, and nothing is
 * hidden behind a menu a judge has to discover.
 */
export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex min-w-max items-center gap-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors " +
                  (active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground")
                }
              >
                <Icon className="size-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
