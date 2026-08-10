"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Loader2, Star } from "lucide-react";
import type { OrgType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { ROLE_META } from "@/lib/roles";

export interface RoleGroup {
  type: OrgType;
}

/**
 * Role selection cards. Picking a role routes to the onboarding form
 * for that business type.
 */
export function RolePicker({ roles }: { roles: RoleGroup[] }) {
  const router = useRouter();

  function handleRoleClick(type: OrgType) {
    router.push(`/onboarding?role=${type}`);
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {roles.map(({ type }) => {
        const meta = ROLE_META[type];
        const Icon = meta.icon;
        return (
          <button
            key={type}
            type="button"
            onClick={() => handleRoleClick(type)}
            className={cn(
              "elevated group flex min-h-[44px] flex-col gap-2 rounded-md border bg-surface-raised p-4 text-left transition-colors",
              "border-line hover:border-amber/60",
            )}
          >
            <span className="flex items-center gap-2">
              <Icon className={cn("size-5 shrink-0", meta.accentClass)} aria-hidden />
              <span className="type-display text-base">{meta.label}</span>
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
