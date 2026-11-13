import path from "node:path";
import type { NextConfig } from "next";

const repoRoot = path.resolve(process.cwd(), "..", "..");

const nextConfig: NextConfig = {
  // lets a production build run beside a live dev server without sharing .next
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // The Docker image runs the standalone server (apps/portal/Dockerfile sets NEXT_OUTPUT=standalone).
  ...(process.env.NEXT_OUTPUT === "standalone" ? { output: "standalone" as const } : {}),
  // Standalone tracing must see the pnpm workspace, so the server lands at apps/portal/server.js in the output.
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
