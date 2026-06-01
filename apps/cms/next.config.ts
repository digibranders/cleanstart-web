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

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin Turbopack's workspace root to the monorepo root. Without this, Next
  // infers the root from the nearest lockfile and can mis-resolve in the pnpm
  // workspace; Turbopack also requires an absolute path here.
  turbopack: {
    root: path.resolve(import.meta.dirname, '../..'),
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
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

// Sentry's build-time instrumentation (withSentryConfig) injects wrappers
// into the RSC/Turbopack graph. On the amd64 production build this surfaced
// as "Functions cannot be passed directly to Client Components" on every
// /admin render (digest varies per build) — while arm64 builds render fine.
// Gating the wrapper behind SENTRY_BUILD=1 keeps it available for local /
// arm64 use while keeping the amd64 prod build clean. Re-enable once the
// upstream Turbopack/Sentry interaction is fixed.
const sentryOptions = {
  silent: !process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
};

export default process.env.SENTRY_BUILD === '1'
  ? withSentryConfig(withCleanstart, sentryOptions)
  : withCleanstart;
