import path from "node:path";
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "1",
});

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd(), "..", ".."),
  },
  // Compile the shared @cleanstart/schema workspace package from TS source
  // (it ships no build step, like the other @cleanstart/* packages). Required
  // for the webpack production build to parse it; harmless under Turbopack.
  transpilePackages: ["@cleanstart/schema"],
  // ISR / static-generation resilience. Content detail routes pre-render every
  // published doc at build time (so a published page is cached from deploy and
  // survives a later CMS outage via stale-while-revalidate). That means the
  // build fires hundreds of CMS reads — uncapped, 13 workers overwhelm the
  // single CMS droplet and a transient 502 fails the whole build. Cap the
  // concurrency to a trickle the droplet can serve, and retry a page whose
  // data fetch blips. Pairs with the 5xx retry in `lib/cms-fetch.ts`.
  experimental: {
    staticGenerationRetryCount: 3,
    staticGenerationMaxConcurrency: 4,
  },
  // ISR pages may be served stale for up to a year while the CMS is
  // unreachable, instead of forcing a blocking (failing) regeneration. This is
  // the Next default; pinned here to make the "content survives CMS death"
  // guarantee explicit and immune to a default change.
  expireTime: 31_536_000,
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
      // Industry pages live under `/industries/`, but the slug already names
      // the industry, so the shorter path is the natural guess and returns a
      // hard 404. Same courtesy 301 as `/guides` above: it was never a live
      // URL, just one worth catching.
      {
        source: "/financial-services-container-security",
        destination: "/industries/financial-services",
        permanent: true,
      },
      // The operational-impact estimator launched at `/roi-calculator` and was
      // renamed while still noindex,nofollow, so nothing is indexed under the
      // old path. It is live in the client's review links, though, so 308 it.
      {
        source: "/roi-calculator",
        destination: "/impact-estimator",
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
      // Post-launch rename of the financial services page, requested
      // 2026-09-04. Unlike the earlier /financial-services move, this URL was
      // live: indexable, listed in the sitemap and linked from the nav, so the
      // 301 is load-bearing rather than courtesy. It ships in code so the
      // redirect lands in the same deploy as the route move.
      {
        source: "/industries/financial-services-container-security",
        destination: "/industries/financial-services",
        permanent: true,
      },
      // Post-launch rename of the SaaS / modern applications page, requested
      // 2026-09-04 alongside its H1 and nav label. Live URL: indexable,
      // sitemap-listed and nav-linked, so this 301 is load-bearing and ships
      // with the route move.
      {
        source: "/industries/modern-applications",
        destination: "/industries/software-applications",
        permanent: true,
      },
      // Residual Webflow migration redirects. These twelve URLs were indexed on
      // the old site and had been returning 404 in production since cutover —
      // confirmed by live capture 2026-07-29 (docs/seo/evidence/live-capture.json,
      // `control:legacy-redirect:*`). Google drops a persistently-404ing URL and
      // progressively throttles recrawls of it, so the loss compounds until the
      // redirect exists. Mapping is docs/web/SEO-IMPLEMENTATION-PLAN.md Task 0.1;
      // `/pricing` is omitted from that list because the page was since built and
      // now returns 200. See ARCH-01 and MIG-01 in docs/seo/.
      {
        source: "/acceptable-use-policy",
        destination: "/legal/acceptable-use-policy",
        permanent: true,
      },
      {
        source: "/leadership",
        destination: "/teams",
        permanent: true,
      },
      {
        source: "/search",
        destination: "/",
        permanent: true,
      },
      {
        source: "/survey",
        destination: "/",
        permanent: true,
      },
      // Both webinar detail URLs are retired; the listing is the nearest
      // equivalent surface for the same content type.
      {
        source:
          "/webinar/secure-containers-end-to-end-from-trusted-images-to-runtime-visibility-with-cleanstart-and-sysdig",
        destination: "/webinars",
        permanent: true,
      },
      {
        source:
          "/webinar/secure-containers-end-to-end-from-trusted-images-to-runtime-visibility-with-cleanstart-and-sysdig-2",
        destination: "/webinars",
        permanent: true,
      },
      // Retired event landing pages → the events listing.
      {
        source: "/new-year-event-sysdig",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/new-year-event-eventus",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/cleanstart-hitachi-chennai",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/cleanstart-hitachi-bengaluru",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/cleanstart-hitachi-hyderabad",
        destination: "/events",
        permanent: true,
      },
      {
        source: "/cleanstart-raksha-chennai",
        destination: "/events",
        permanent: true,
      },
      // Duplicate news article. The `-2` slug is a collision suffix: the two
      // documents are 96.5% identical by rendered body text and both returned
      // 200 with their own self-canonical, so Google saw two competing URLs for
      // one story. The unsuffixed slug is the original (published 2025-11-14 vs
      // 2025-12-26) and is the one kept. This 308 collapses them at the edge.
      // The CMS document still exists and is still in the sitemap; the owner
      // should set its `seo.indexable` to noindex or unpublish it, which is what
      // drops it from sitemap.ts.
      {
        source: "/news/why-containers-drive-supply-chain-breaches-2",
        destination: "/news/why-containers-drive-supply-chain-breaches",
        permanent: true,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Cache optimized image variants for 1 year at Vercel's edge. The default
    // is 60 seconds, which means every cold visitor re-triggers full
    // optimization (fetch source → resize → encode AVIF/WebP). Guide cover
    // images are 1200×630 OG-image-generator PNGs — expensive to re-optimize.
    // With a 1-year TTL, optimization runs once per source URL and the result
    // is served from the edge cache on every subsequent request.
    minimumCacheTTL: 31_536_000,
    // Add 384 px between the default 256 (imageSizes) and 640 (deviceSizes)
    // steps. Guide cards render at max 300 px wide; without this, the optimizer
    // serves the next-available 640 px variant — 2× the needed bytes.
    // 384 covers 300 px at 1.28× (fine for most screens) and 2× retina at 192
    // device-pixel-ratio, while 640 covers the 2× case for the next breakpoint.
    deviceSizes: [384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
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

// Sentry wrapper is a no-op when SENTRY_DSN is unset. The tunnelRoute proxies
// Sentry events through /monitoring so adblockers cannot intercept them.
// Source-map upload is gated on SENTRY_AUTH_TOKEN — skipped when unset.
export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  silent: !process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  tunnelRoute: "/monitoring",
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  disableLogger: true,
  automaticVercelMonitors: false,
});
