export type CspMode = "report-only" | "enforce";

export interface BuildCspOptions {
  nonce: string;
  isProduction: boolean;
  isDraftMode: boolean;
  /**
   * True when the request path is part of the preview surface
   * (`/preview/*` or `/api/preview/*`). These routes need to be
   * embeddable in the admin's Live Preview iframe.
   */
  isPreviewPath?: boolean;
}

const SENTRY_INGEST = "https://*.ingest.sentry.io";
const VERCEL_INSIGHTS = "https://vitals.vercel-insights.com";
const VERCEL_SCRIPTS = "https://va.vercel-scripts.com";
const GA4_COLLECT = "https://www.google-analytics.com";
const GA4_REGION = "https://*.analytics.google.com";

// Frame-ancestors override applied to preview surfaces (cookie-based
// draft mode AND the new token-based `/preview/*` route). In every
// other case, embedding is denied.
const PREVIEW_FRAME_ANCESTORS = [
  "'self'",
  "http://localhost:3000",
  "https://cms.cleanstart.com",
];

export function buildCsp({
  nonce,
  isProduction,
  isDraftMode,
  isPreviewPath = false,
}: BuildCspOptions): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "https:",
    "'unsafe-inline'",
  ];

  const styleSrc = ["'self'", `'nonce-${nonce}'`];

  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https://cdn.cleanstart.com",
    "https://cms.cleanstart.com",
    // Public CleanStart community-images logos served by GCS
    "https://storage.googleapis.com",
    // Brand-colored stack logos (devicons) served via jsDelivr CDN
    "https://cdn.jsdelivr.net",
  ];

  const fontSrc = ["'self'", "https://fonts.gstatic.com", "data:"];

  const connectSrc = [
    "'self'",
    "https://cms.cleanstart.com",
    SENTRY_INGEST,
    VERCEL_INSIGHTS,
    VERCEL_SCRIPTS,
    GA4_COLLECT,
    GA4_REGION,
  ];
  if (!isProduction) {
    // Local dev: web (3010/3001) calls the CMS at localhost:3000 for
    // /api/leads/submit and /api/resources/:slug/{token,download}.
    connectSrc.push("http://localhost:3000");
  }

  const frameAncestors =
    isDraftMode || isPreviewPath ? PREVIEW_FRAME_ANCESTORS : ["'none'"];

  const directives: Array<[string, string]> = [
    ["default-src", "'self'"],
    ["script-src", scriptSrc.join(" ")],
    ["style-src", styleSrc.join(" ")],
    ["img-src", imgSrc.join(" ")],
    ["font-src", fontSrc.join(" ")],
    ["connect-src", connectSrc.join(" ")],
    ["frame-ancestors", frameAncestors.join(" ")],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["object-src", "'none'"],
    ["upgrade-insecure-requests", ""],
    ["report-uri", "/api/csp-report"],
    ["report-to", "csp-endpoint"],
  ];

  if (isProduction) {
    directives.push(["require-trusted-types-for", "'script'"]);
    directives.push(["trusted-types", "nextjs default"]);
  }

  return directives
    .map(([name, value]) => (value ? `${name} ${value}` : name))
    .join("; ");
}

export const PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "magnetometer=()",
  "accelerometer=()",
  "gyroscope=()",
  "interest-cohort=()",
  "browsing-topics=()",
  "attribution-reporting=()",
  "shared-storage=()",
  "join-ad-interest-group=()",
  "run-ad-auction=()",
  "private-state-token-issuance=()",
  "private-state-token-redemption=()",
].join(", ");

export const REPORTING_ENDPOINTS = 'csp-endpoint="/api/csp-report"';

export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
