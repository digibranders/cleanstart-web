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
  async headers() {
    return [
      {
        // RFC 9727 §3 API catalog — extension-less static file in
        // `public/.well-known/`. Override the default static Content-Type with
        // the RFC 9264 link-set media type so agents parse it correctly.
        source: "/.well-known/api-catalog",
        headers: [
          { key: "Content-Type", value: "application/linkset+json" },
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
    ];
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
      // Canonical detail routes are singular `/event/[slug]` and `/job/[slug]`
      // (matching the indexed Webflow URLs). The redesign also shipped plural
      // aliases that rendered the same content and self-canonicalled to
      // themselves — duplicate content. 308 them to the primary so there is one
      // indexable URL per event/job. Listing pages (`/events`, `/careers`)
      // use a single segment match and are untouched.
      {
        source: "/events/:slug",
        destination: "/event/:slug",
        permanent: true,
      },
      {
        source: "/careers/:slug",
        destination: "/job/:slug",
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
        // Payload CMS media — cms.cleanstart.com (the CMS droplet)
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
