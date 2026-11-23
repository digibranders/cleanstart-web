import path from "node:path";
import type { NextConfig } from "next";

const repoRoot = path.resolve(process.cwd(), "..", "..");
const isProduction = process.env.NODE_ENV === "production";

/**
 * Static security headers, sent on every response. The Content-Security-Policy that carries a nonce is per request
 * and is set in src/proxy.ts; the API routes get a closed policy here because they never serve a document.
 */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  ...(isProduction ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  // lets a production build run beside a live dev server without sharing .next
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // The Docker image runs the standalone server (apps/portal/Dockerfile sets NEXT_OUTPUT=standalone).
  ...(process.env.NEXT_OUTPUT === "standalone" ? { output: "standalone" as const } : {}),
  // Standalone tracing must see the pnpm workspace, so the server lands at apps/portal/server.js in the output.
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
  poweredByHeader: false,
  // The dev-only "N" badge sits on the sidebar user name. It has no effect on a production build.
  devIndicators: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/api/:path*", headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; frame-ancestors 'none'" }] },
      // Demo mode only: the PDF preview frames this download route, which stands in for the document bucket.
      {
        source: "/api/demo-files/get",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
