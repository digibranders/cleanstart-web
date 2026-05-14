import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/blog",
        destination: "/blogs",
        permanent: true,
      },
    ];
  },
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
        // Payload CMS media — dev tunnel (cms-dev.cleanstart.com)
        protocol: "https",
        hostname: "cms-dev.cleanstart.com",
        pathname: "/api/media/**",
      },
      {
        // Payload CMS media — production (cms.cleanstart.com)
        protocol: "https",
        hostname: "cms.cleanstart.com",
        pathname: "/api/media/**",
      },
      {
        // Payload CMS media CDN — staging/production (cdn.cleanstart.com)
        protocol: "https",
        hostname: "cdn.cleanstart.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
