import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Industrial Nexus",
  description:
    "One negotiation engine. Five industrial markets. Sealed, anonymous bidding for Indian industry.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Dark is the only theme. This is shop-floor software shown on a
    // projector — a light theme washes out and the amber accent dies.
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SiteHeader />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</div>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
