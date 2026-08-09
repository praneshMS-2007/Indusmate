import type { OrgType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { RolePicker } from "@/components/role-picker";

const ROLE_ORDER: OrgType[] = ["MANUFACTURER", "SUPPLIER", "TRANSPORTER", "RECYCLER"];

/**
 * The entry experience — "which of these are you?".
 *
 * This is where a real product would collect a role at signup. There is no
 * signup here and we are not going to pretend otherwise: the page is labelled
 * a demo, there are no passwords, and picking an organisation simply sets the
 * same cookie the header switcher sets.
 *
 * It earns its place anyway, because role is the single input that decides how
 * the whole interface arranges itself. Asking for it up front is honest about
 * that, and it gives a judge the fastest possible route to the point of the
 * product: pick two different roles in succession and watch one engine present
 * two completely different working days.
 */
export default async function WelcomePage() {
  const orgs = await prisma.organisation.findMany({
    // Public reputation fields only. This is handed to a client component, so
    // it must never carry identity or the pseudonym handle — see
    // DEMO_ORG_FIELDS in lib/auth.ts for why the two can never travel together.
    select: {
      id: true,
      name: true,
      type: true,
      city: true,
      verified: true,
      rating: true,
      dealCount: true,
      onTimePct: true,
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  // Serialisable only — RoleMeta carries icon components, which cannot cross
  // into a client component. RolePicker looks the meta up itself.
  const byRole = ROLE_ORDER.map((type) => ({
    type,
    orgs: orgs.filter((o) => o.type === type),
  }));

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 py-6">
      <header className="flex flex-col gap-2 text-center">
        <p className="type-eyebrow">Demo — no signup, no password</p>
        <h1 className="type-display text-2xl sm:text-4xl">Which of these are you?</h1>
        <p className="mx-auto max-w-prose text-sm text-text-secondary">
          IndusMate runs five markets on one listing table and one deal state machine. Your role
          does not change that engine — it changes how your working day is arranged on top of it.
          Pick one, then come back and pick another to see the same platform from the other side.
        </p>
      </header>

      <RolePicker roles={byRole} />

      <p className="text-center text-xs text-text-tertiary">
        Every role can reach every screen. Nothing here is locked — a transporter can still post a
        byproduct listing if they want to.
      </p>
    </main>
  );
}
