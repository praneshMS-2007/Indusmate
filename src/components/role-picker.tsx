"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Loader2, Star } from "lucide-react";
import type { OrgType } from "@prisma/client";

import type { DemoOrgOption } from "@/lib/auth";
import { switchDemoOrg } from "@/lib/auth-actions";
import { ROLE_META } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Only serialisable data crosses the boundary.
 *
 * RoleMeta carries `icon`, which is a function component, and functions cannot
 * be passed from a server component to a client one. So the server sends ids
 * and rows; this component looks the meta up itself from the same shared
 * module. Worth noting the type checker cannot see this class of bug — it took
 * an actual render to surface it.
 */
interface RoleGroup {
  type: OrgType;
  orgs: DemoOrgOption[];
}

/**
 * Two steps, deliberately. Choose the role, then choose which organisation of
 * that role you are acting as.
 *
 * Splitting it matters: the first screen is about the PRODUCT — four postures
 * toward one engine, described in the operator's own language. The second is
 * just demo plumbing. Collapsing them into one list of twelve companies would
 * bury the idea under the mechanism.
 */
export function RolePicker({ roles }: { roles: RoleGroup[] }) {
  const router = useRouter();
  const [chosen, setChosen] = useState<OrgType | null>(null);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function pickOrg(orgId: string) {
    setBusyId(orgId);
    startTransition(async () => {
      await switchDemoOrg(orgId);
      router.push("/");
    });
  }

  if (chosen === null) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {roles.map(({ type, orgs }) => {
          const meta = ROLE_META[type];
          const Icon = meta.icon;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setChosen(type)}
              className={cn(
                "elevated group flex min-h-[44px] flex-col gap-2 rounded-md border bg-surface-raised p-4 text-left transition-colors",
                "border-line hover:border-amber/60",
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className={cn("size-5 shrink-0", meta.accentClass)} aria-hidden />
                <span className="type-display text-base">{meta.label}</span>
                <span className="type-data ml-auto text-xs text-text-tertiary">
                  {orgs.length}
                </span>
              </span>
              <span className="text-sm text-text-secondary">{meta.tagline}</span>
              <span className="type-eyebrow mt-1 border-t border-line-subtle pt-2 text-text-tertiary">
                {meta.posture}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  const group = roles.find((r) => r.type === chosen)!;
  const groupMeta = ROLE_META[chosen];
  const Icon = groupMeta.icon;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setChosen(null)} disabled={pending}>
          <ArrowLeft />
          Back
        </Button>
        <span className="flex items-center gap-1.5 text-sm text-text-secondary">
          <Icon className={cn("size-4", groupMeta.accentClass)} aria-hidden />
          Acting as a {groupMeta.label.toLowerCase()} — pick which one
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {group.orgs.map((org) => (
          <button
            key={org.id}
            type="button"
            onClick={() => pickOrg(org.id)}
            disabled={pending}
            className={cn(
              "elevated flex min-h-[44px] items-center gap-3 rounded-md border border-line bg-surface-raised p-3 text-left transition-colors",
              "hover:border-amber/60 disabled:opacity-60",
            )}
          >
            {busyId === org.id ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-amber" aria-hidden />
            ) : (
              <Icon className={cn("size-4 shrink-0", groupMeta.accentClass)} aria-hidden />
            )}
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1">
                <span className="truncate text-sm font-medium">{org.name}</span>
                {org.verified && (
                  <BadgeCheck className="size-3.5 shrink-0 text-teal" aria-label="KYC verified" />
                )}
              </span>
              <span className="type-data flex items-center gap-1 text-[11px] text-text-secondary">
                {org.city}
                <Star className="size-2.5 fill-amber text-amber" aria-hidden />
                {org.rating.toFixed(1)} · {org.dealCount} deals
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
