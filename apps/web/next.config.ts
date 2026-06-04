import path from "node:path";
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "1",
});

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd(), "..", ".."),
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Force polling on OneDrive/network drives where native fs events don't fire.
      config.watchOptions = {
        ...config.watchOptions,
        poll: 800,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  async redirects() {
    return [
      {
        source: "/blog",
        destination: "/blogs",
        permanent: true,
      },
      // Guides use a singular hub (`/guide`) matching the indexed detail path
      // `/guide/[slug]`. Courtesy 301s catch the plural variant a user or bot
      // might guess, including any pluralized sub-path.
      {
        source: "/guides",
        destination: "/guide",
        permanent: true,
      },
      {
        source: "/guides/:slug*",
        destination: "/guide/:slug*",
        permanent: true,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
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
      {
        // Public CleanStart community-images logos served from GCS
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/cdpimages/**",
      },
      {
        // Brand-colored stack logos (devicons) served via jsDelivr CDN
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        pathname: "/gh/devicons/devicon/**",
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
