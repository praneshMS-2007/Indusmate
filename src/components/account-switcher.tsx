"use client";

import { useTransition } from "react";
import Link from "next/link";
import { BadgeCheck, ChevronDown, Loader2, UserCog } from "lucide-react";
import type { OrgType } from "@prisma/client";

import type { DemoOrgOption } from "@/lib/auth";
import { switchDemoOrg } from "@/lib/auth-actions";
import { ORG_TYPE_META } from "@/components/org-meta";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TYPE_ORDER: OrgType[] = ["MANUFACTURER", "SUPPLIER", "TRANSPORTER", "RECYCLER"];

/**
 * The demo account switcher.
 *
 * Labelled "Demo account" on purpose — judges should never wonder whether we
 * are claiming to have built real authentication. Switching writes a cookie
 * server-side and revalidates the whole tree.
 *
 * Takes DemoOrgOption, never the Prisma row. This is a client component, so
 * every field it receives is serialised into the HTML of every page — and it
 * must never carry `pseudonymHandle`, or the handle → real-name mapping ships
 * to the browser and masked bidding is over. See DEMO_ORG_FIELDS in lib/auth.
 */
export function AccountSwitcher({
  current,
  orgs,
}: {
  current: DemoOrgOption;
  orgs: DemoOrgOption[];
}) {
  const [pending, startTransition] = useTransition();

  const CurrentIcon = ORG_TYPE_META[current.type].icon;

  function select(orgId: string) {
    if (orgId === current.id) return;
    startTransition(async () => {
      await switchDemoOrg(orgId);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-auto max-w-[75vw] justify-start gap-2 py-1.5 sm:max-w-none"
        >
          {pending ? (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          ) : (
            <CurrentIcon className={`size-4 shrink-0 ${ORG_TYPE_META[current.type].className}`} />
          )}
          <span className="flex min-w-0 flex-col items-start leading-tight">
            <span className="flex items-center gap-1 text-[10px] font-medium tracking-wide text-text-secondary uppercase">
              Demo account
            </span>
            <span className="flex w-full min-w-0 items-center gap-1">
              <span className="truncate text-sm font-medium">{current.name}</span>
              {current.verified && (
                <BadgeCheck className="size-3.5 shrink-0 text-teal" aria-label="KYC verified" />
              )}
            </span>
          </span>
          <ChevronDown className="ml-auto size-4 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="max-h-[70vh] w-72 overflow-y-auto">
        <DropdownMenuLabel className="text-xs font-normal text-text-secondary">
          Switch account — no password, this is a demo stub
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* The role picker is the better entry point — it leads with what the
            four postures mean, rather than twelve company names. */}
        <DropdownMenuItem asChild>
          <Link href="/welcome" className="gap-2">
            <UserCog className="size-4 text-amber" />
            <span className="text-sm">Choose by role instead</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {TYPE_ORDER.map((type) => {
          const group = orgs.filter((o) => o.type === type);
          if (group.length === 0) return null;
          const meta = ORG_TYPE_META[type];
          const Icon = meta.icon;

          return (
            <div key={type}>
              <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] tracking-wide uppercase">
                <Icon className={`size-3.5 ${meta.className}`} />
                {meta.label}
              </DropdownMenuLabel>
              {group.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onSelect={() => select(org.id)}
                  className="flex-col items-start gap-0.5"
                  data-active={org.id === current.id}
                >
                  <span className="flex w-full items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{org.name}</span>
                    {org.id === current.id && (
                      <span className="ml-auto shrink-0 text-[10px] text-text-secondary">
                        current
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {org.city} · {org.rating.toFixed(1)}/5 · {org.dealCount} deals
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
