import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';
import { withSentryConfig } from '@sentry/nextjs';

const r2PublicHost = (() => {
  const raw = process.env.R2_PUBLIC_BASE;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
