import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lets a production build run beside a live dev server without sharing .next
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  turbopack: { root: path.resolve(process.cwd(), "..", "..") },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
