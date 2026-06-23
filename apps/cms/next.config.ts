import path from 'node:path';

import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';
import { withSentryConfig } from '@sentry/nextjs';

import { EMBED_FRAME_SRC_ORIGINS } from './src/payload/admin/components/Embed/embed-providers';

const r2PublicHost = (() => {
  const raw = process.env.R2_PUBLIC_BASE;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
})();

// Connect-src needs to include R2 for direct browser-to-R2 uploads in the
// media picker. When R2_PUBLIC_BASE is set we add its origin; otherwise
// 'self' covers localhost dev.
const r2ConnectSrc = r2PublicHost ? `https://${r2PublicHost}` : '';

// Web origin embedded by the Live Preview iframe. Falls back to localhost dev
// when WEB_BASE_URL is unset. Both production hosts are pre-listed so prod
// images don't depend on the env var being set at admin boot time.
const webBaseOrigin = (() => {
  try {
    return new URL(process.env.WEB_BASE_URL ?? 'http://localhost:3001').origin;
  } catch {
    return 'http://localhost:3001';
  }
})();
const PREVIEW_FRAME_SRC_ORIGINS = [
  webBaseOrigin,
  'https://www.cleanstart.com',
  'https://cleanstart.com',
];

// Content-Security-Policy for the Payload admin shell.
// 'unsafe-inline' and 'unsafe-eval' are required by the Next.js + React
// bundle that Payload ships. Tighten to script nonces in a future pass once
// we have a nonce-injection middleware and the bundle is audited.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' blob: data: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' ${r2ConnectSrc}`.trim(),
  `media-src 'self' blob:`,
  `worker-src 'none'`,
  `object-src 'none'`,
  // `frame-src` covers iframes the admin embeds *into* the page —
  // primarily the Lexical embed feature (YouTube, Vimeo, Loom, …) and
  // same-origin admin views used by the quick-create modal fallback.
  // Provider origins live in `embed-providers.ts` so the list stays in
  // sync with the supported providers; `embed-providers.test.ts`
  // enforces sync at CI time.
  `frame-src 'self' ${[...EMBED_FRAME_SRC_ORIGINS, ...PREVIEW_FRAME_SRC_ORIGINS].join(' ')}`,
  // `frame-ancestors` covers who can embed *us*. 'self' allows the
  // admin to frame its own pages (used by document-picker fallbacks)
  // while still blocking external clickjacking.
  `frame-ancestors 'self'`,
  `base-uri 'self'`,
  `form-action 'self'`,
]
  .filter(Boolean)
  .join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

// The admin UI should never be indexed by search engines — it is
// authentication-gated and has no public-facing content.
const adminNoindexHeader = { key: 'X-Robots-Tag', value: 'noindex, nofollow' };

// The public Payload REST API (cms.cleanstart.com/api/*) serves JSON that
// duplicates the canonical www.cleanstart.com pages. Without this, crawlers can
// index that JSON as cross-host duplicate content. The header only affects
// crawlers — it has no effect on the admin UI's own fetches.
const apiNoindexHeader = { key: 'X-Robots-Tag', value: 'noindex, nofollow' };

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep the Google API client libraries external (required from node_modules
  // at runtime) instead of letting Next bundle them into the server chunks.
  // `@google-analytics/data` (gRPC via google-gax) and `googleapis` rely on
  // dynamic requires + `.proto`/`.json` descriptor assets that don't survive
  // Next's server bundling — once bundled, the GA4 client throws an opaque
  // "undefined undefined: undefined" at call time, so the dashboardRefreshFrequent
  // cron never populated `analyticsCache`. The unbundled module works (verified
  // in prod: 4322 sessions). withPayload merges this with its own externals.
  serverExternalPackages: [
    '@google-analytics/data',
    'google-gax',
    'googleapis',
    'google-auth-library',
  ],
  // Pin Turbopack's workspace root to the monorepo root. Without this, Next
  // infers the root from the nearest lockfile and can mis-resolve in the pnpm
  // workspace; Turbopack also requires an absolute path here.
  turbopack: {
    root: path.resolve(import.meta.dirname, '../..'),
  },
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      // Explicit noindex on every admin route — belt-and-suspenders alongside
      // the metadata export in (payload)/layout.tsx.
      { source: '/admin(.*)', headers: [adminNoindexHeader] },
      // Keep the public REST API out of the search index (cross-host duplicate
      // content of the canonical www pages).
      { source: '/api/(.*)', headers: [apiNoindexHeader] },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.cleanstart.com',
      },
      ...(r2PublicHost
        ? [
            {
              protocol: 'https' as const,
              hostname: r2PublicHost,
            },
          ]
        : []),
    ],
  },
};

// `devBundleServerPackages: true` opts out of withPayload's default
// dev externalization of `payload` + `@payloadcms/*` server packages.
// Without bundling them, Turbopack's RSC chunker for `@payloadcms/ui`
// occasionally resolved `RenderDefaultCell` to `undefined` at SSR
// call time and surfaced "C is not a function" in the list view's
// `buildColumnState/renderCell.tsx`. Bundling forces a deterministic
// chunk graph at the cost of slightly slower cold-start in dev.
const withCleanstart = withPayload(nextConfig, { devBundleServerPackages: true });

// Sentry wrapper is a no-op when SENTRY_DSN is unset (the runtime
// configs early-return). Source-map upload is gated on the auth token
// — when SENTRY_AUTH_TOKEN is unset it skips the upload step too.
export default withSentryConfig(withCleanstart, {
  silent: !process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  disableLogger: true,
  automaticVercelMonitors: false,
});
