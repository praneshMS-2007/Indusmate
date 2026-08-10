import { getCurrentOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, LogOut } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let org;
  try {
    org = await getCurrentOrg();
  } catch (e) {
    redirect("/login");
  }

  if (org.type !== "PLATFORM_ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-line bg-sidebar text-sidebar-foreground hidden lg:flex flex-col">
        <div className="p-6">
          <Link href="/admin/kyc" className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-amber text-on-amber">
              <ShieldCheck className="size-5" />
            </div>
            <span className="type-display text-xl font-bold">Admin Portal</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-2">
          <Link href="/admin/kyc" className="flex items-center gap-3 rounded-md bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground">
            <ShieldCheck className="size-4" />
            KYC Verification
          </Link>
        </nav>
        
        <div className="p-4 border-t border-sidebar-border">
          <Link href="/api/auth/signout" className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <LogOut className="size-4" />
            Log out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-6 lg:hidden">
          <span className="type-display font-bold">Admin Portal</span>
          <Link href="/api/auth/signout">
            <LogOut className="size-5 text-text-tertiary" />
          </Link>
        </header>
        <div className="p-6 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
