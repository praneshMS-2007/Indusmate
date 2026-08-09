import { Compass, Gavel, Handshake, Map, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * The five destinations, named for what the operator has rather than the
 * table it comes from. One list, two renderers: AppSidebar (desktop rail)
 * and BottomTabBar (mobile) both map over this rather than each keeping
 * their own copy — a sixth destination gets added once, not twice.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/browse", label: "Browse", icon: Compass },
  { href: "/map", label: "Map", icon: Map },
  { href: "/my/listings", label: "My listings", icon: Package },
  { href: "/my/bids", label: "My bids", icon: Gavel },
  { href: "/deals", label: "Deals", icon: Handshake },
];
