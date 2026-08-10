import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

import { AppSidebar } from "@/components/app-sidebar";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/auth";
import { getCurrentOrg } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Three type roles, three jobs.
 *
 * Display — Barlow Condensed. The lettering on a plant hoarding, a gantry
 * sign, a consignment note header. Condensed and uppercase, used only for
 * page titles and section headers. Used on body copy it stops being signage
 * and starts being shouting.
 */
const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

/** Body — Inter. Chosen for one reason: it stays readable at 13px on a cheap
 *  Android panel, which is where this actually gets used. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Data — IBM Plex Mono. Every number on the platform: bid amounts, tonnages,
 * distances, reference ids, coordinates, timestamps.
 *
 * This is the single strongest cue that this is instrument software and not
 * another dashboard. A weighbridge prints in mono; an hour meter reads in
 * mono; a consignment note's figures are mono. Tabular figures also mean a
 * column of bids lines up digit-for-digit, so the owner compares magnitudes
 * by eye instead of reading each one.
 */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "IndusMate",
  description:
    "One negotiation engine. Five industrial markets. Sealed, anonymous bidding for Indian industry.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const hasOrg = !!session?.user && !!(session.user as any).orgId;

  let org = null;
  if (hasOrg) {
    try {
      org = await getCurrentOrg();
    } catch (e) {}
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Platform Admin routing
  if (org?.type === "PLATFORM_ADMIN" && !pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
    redirect("/admin/kyc");
  }

  // KYC guard for regular users
  if (org && org.type !== "PLATFORM_ADMIN" && org.kycStatus !== "APPROVED") {
    if (!pathname.startsWith("/onboarding") && !pathname.startsWith("/api")) {
      if (org.kycStatus === "PENDING_UPLOAD") redirect("/onboarding/kyc");
      if (org.kycStatus === "UNDER_REVIEW") redirect("/onboarding/kyc/pending");
      if (org.kycStatus === "REJECTED") redirect("/onboarding/kyc/rejected");
    }
  }

  return (
    // suppressHydrationWarning is the documented next-themes requirement:
    // the theme class is applied by an inline script before hydration, so
    // the server-rendered class list and the first client render legitimately
    // differ for one attribute, on purpose.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${barlow.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full bg-background text-foreground flex flex-col">
        <ThemeProvider>
          {hasOrg && org?.kycStatus === "APPROVED" && org.type !== "PLATFORM_ADMIN" ? (
            <div className="flex min-h-full flex-1">
              <AppSidebar />
              <div className="flex min-h-full min-w-0 flex-1 flex-col">
                <SiteHeader />
                <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 lg:pb-6">
                  {children}
                </main>
              </div>
              <BottomTabBar />
            </div>
          ) : (
            <main className="flex min-h-full flex-1 flex-col">
              {children}
            </main>
          )}
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
