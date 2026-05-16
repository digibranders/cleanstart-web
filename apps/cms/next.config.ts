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
  `frame-src 'self' ${EMBED_FRAME_SRC_ORIGINS.join(' ')}`,
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

// Sentry wrapper is a no-op when SENTRY_DSN is unset (the runtime
// configs early-return). Source-map upload is gated on the auth token
// — when SENTRY_AUTH_TOKEN is unset it skips the upload step too.
export default withSentryConfig(withCleanstart, {
  silent: !process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
