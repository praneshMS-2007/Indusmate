import { getCurrentOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { LogoutButton } from "@/components/logout-button";
import { ShieldCheck, Users, LogOut, FileText, History } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let org;
  try {
    org = await getCurrentOrg();
  } catch (e) {
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    redirect("/login");
  }

  if (org.type !== "PLATFORM_ADMIN") {
    redirect("/");
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  const isKycActive = pathname === "/admin/kyc" || pathname === "/admin";
  const isLogsActive = pathname === "/admin/logs";

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
        
        <nav className="flex-1 px-4 py-2 flex flex-col gap-1">
          <Link 
            href="/admin/kyc" 
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              isKycActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
          >
            <ShieldCheck className="size-4" />
            KYC Verification
          </Link>

          <Link 
            href="/admin/logs" 
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              isLogsActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}
          >
            <History className="size-4" />
            Verification Logs
          </Link>
        </nav>
        
        <div className="p-4 border-t border-sidebar-border">
          <LogoutButton 
            label="Log out" 
            showIcon={true}
            variant="ghost" 
            className="flex w-full justify-start items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground" 
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-6 lg:hidden">
          <span className="type-display font-bold">Admin Portal</span>
          <LogoutButton 
            label=""
            showIcon={true}
            variant="ghost"
            className="text-text-tertiary px-2"
          />
        </header>
        <div className="p-6 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
