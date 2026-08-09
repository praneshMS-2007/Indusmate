import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Dark is the only theme. This is shop-floor software read on a projector
    // and in a plant yard — a white field in sunlight is a mirror.
    <html
      lang="en"
      className={`dark ${barlow.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</div>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
