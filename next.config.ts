import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Performance: Compress responses with gzip/brotli for smaller payloads.
   * Vercel's edge CDN handles this automatically, but this covers local
   * production builds and self-hosted deployments.
   */
  compress: true,

  /**
   * Performance: Aggressive static asset caching. Public assets
   * (logo.webp, login-bg.webp, fonts) get long-lived immutable
   * Cache-Control headers so the browser never re-fetches them.
   */
  headers: async () => [
    {
      source: "/:path*.webp",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/:path*.png",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/:path*.svg",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],

  /**
   * Experimental: Optimize package imports to tree-shake large icon
   * libraries. lucide-react ships 1500+ icon components — without this,
   * the entire library gets bundled even if we only use 30 icons.
   */
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-leaflet",
      "leaflet",
    ],
  },
};

export default nextConfig;
