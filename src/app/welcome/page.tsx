import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { OrgType } from "@prisma/client";
import { RolePicker } from "@/components/role-picker";

const ROLE_ORDER: OrgType[] = ["MANUFACTURER", "SUPPLIER", "TRANSPORTER", "RECYCLER"];

/**
 * Role selection page — shown to authenticated users who have not yet
 * completed onboarding (i.e. they have no orgId yet).
 *
 * Unauthenticated visitors are sent to /login.
 */
export default async function WelcomePage() {
  const session = await auth();

  // Unauthenticated users go to login
  if (!session?.user) {
    redirect("/login");
  }

  // Users who already have an org go to the dashboard
  if ((session.user as any).orgId) {
    redirect("/");
  }

  const byRole = ROLE_ORDER.map((type) => ({ type }));

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 py-6 px-4">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="type-display text-2xl sm:text-4xl">Which of these are you?</h1>
        <p className="mx-auto max-w-prose text-sm text-text-secondary">
          IndusMate runs five markets on one platform. Your role determines how your dashboard and tools are arranged. Pick your primary business function to get started.
        </p>
      </header>

      <RolePicker roles={byRole} />

      <p className="text-center text-xs text-text-tertiary">
        Every role can reach every screen. Nothing here is locked — a transporter can still post a byproduct listing if they want to.
      </p>
    </main>
  );
}
