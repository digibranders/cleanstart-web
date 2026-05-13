import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Payload CMS media — local dev
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/media/**",
      },
      {
        // Payload CMS media — production (admin.cleanstart.com)
        protocol: "https",
        hostname: "admin.cleanstart.com",
        pathname: "/api/media/**",
      },
    ],
  },
};

export default nextConfig;
