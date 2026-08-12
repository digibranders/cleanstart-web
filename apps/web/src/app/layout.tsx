import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";
import "./globals.css";
import "./scrollbar.css";
import { cn } from "@/lib/utils";
import { PreviewBanner } from "@/components/PreviewBanner";
import { ClickSpark } from "@/components/ui/ClickSpark";
import { SearchProvider } from "@/components/search/SearchProvider";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
import { AttributionProvider } from "@/components/attribution/AttributionProvider";
import { Ga4HeadScript } from "@/components/analytics/Ga4HeadScript";
import {
  ConsentProvider,
  ConsentModeScript,
  GatedAnalytics,
  CookieBanner,
} from "@/components/consent";
import { composeGraph, type GraphNode } from "@cleanstart/schema";
import { SITE_NAME, SITE_URL } from "@/lib/seo/canonical";
import { isIndexingAllowed } from "@/lib/seo/indexing";
import { ogImageUrl } from "@/lib/seo/og";
import { organizationSchema, webSiteSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import {
  getSeoDefaults,
  orgConfigFromDefaults,
  verificationFromDefaults,
  webSiteConfigFromDefaults,
} from "@/lib/seo/seo-defaults";

// Display family — headings, section titles, card titles. Preloaded for LCP.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

// Body family — paragraphs, nav, buttons, UI. Preloaded; default font-sans.
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

// Mono family — code blocks, inline code. Not preloaded (below the fold on most pages).
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
  preload: false,
});

// Statically prerendered, so this metadata is baked at BUILD time — to open a
// non-prod deploy (e.g. staging) for an SEO audit, ALLOW_INDEXING=1 must be set
// during the build (redeploy). robots.txt + the X-Robots-Tag header read it
// per-request. See lib/seo/indexing.ts.
const allowIndexing = isIndexingAllowed();

const TITLE = "Verified & Secure Container Images | CleanStart";
const DESCRIPTION =
  "Build on verified, near-zero-vulnerability container images with cryptographic provenance and compliance alignment.";

const HOME_OG = ogImageUrl({
  variant: "hero",
  title: "Verified & Secure Container Images",
  titleAccent: "Secure Container Images",
  sub: DESCRIPTION,
});

// Build-time only: pulls the editor-managed SEO defaults global (title
// template, default description/OG, twitter handle, verification tokens) and
// bakes them into the site-wide metadata. Falls back to the hardcoded values
// when the CMS is unreachable (INV-1). The template + verification are
// inherited by every route; description/OG apply to the home (default) doc.
export async function generateMetadata(): Promise<Metadata> {
  const d = await getSeoDefaults();
  const description = d?.defaultDescription?.trim() || DESCRIPTION;
  const ogUrl = d?.defaultOgImage?.url?.trim() || HOME_OG;
  // Titles use a pipe separator; normalize any em/en dash the stored CMS
  // template may still carry so no page <title> renders with a dash.
  const template = (d?.defaultTitleTemplate?.trim() || "%s | CleanStart").replace(
    /\s*[—–]\s*/g,
    " | ",
  );
  const twitterHandle = d?.twitterHandle?.trim();

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: TITLE, template },
    description,
    // Verification tokens from the CMS (env google as fallback), emitted only
    // on the indexable production host so staging/preview stay unverified.
    verification: verificationFromDefaults(d, allowIndexing),
    // Absolute + trailing slash so the canonical exactly matches both the
    // served URL and the sitemap <loc>. A bare "/" is joined against
    // metadataBase and loses the slash, making the homepage the only page
    // where canonical, sitemap, and served URL disagree.
    alternates: { canonical: `${SITE_URL}/` },
    robots: allowIndexing
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : { index: false, follow: false, googleBot: { index: false, follow: false } },
    openGraph: {
      title: TITLE,
      description,
      url: SITE_URL,
      type: "website",
      siteName: SITE_NAME,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: TITLE }],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      ...(twitterHandle ? { site: twitterHandle } : {}),
      title: TITLE,
      description,
      images: [{ url: ogUrl, alt: TITLE }],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#151021",
  // Required for env(safe-area-inset-*) to resolve to non-zero on notched devices.
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Compose the site-wide @graph once, at build time: Organization + WebSite
  // (driven by the SEO defaults global, falling back to brand defaults) plus
  // any editor-added global override blocks, merged per-@type.
  const seoDefaults = await getSeoDefaults();
  const siteGraph = composeGraph({
    auto: [
      organizationSchema(orgConfigFromDefaults(seoDefaults)),
      webSiteSchema(webSiteConfigFromDefaults(seoDefaults)),
    ] as GraphNode[],
    override: seoDefaults?.additionalSchema ?? undefined,
  });
  return (
    <html
      lang="en"
      className={cn("font-sans", manrope.variable, sora.variable, jetbrainsMono.variable)}
      style={{
        ["--font-sans" as string]: "var(--font-sora)",
        ["--font-display" as string]: "var(--font-manrope)",
      }}
    >
      <head>
        {/* Warm the GA4 collect origin. gtag.js is injected during head parse,
            so googletagmanager.com connects on its own; google-analytics.com is
            only reached once the library runs and would otherwise pay full
            DNS+TCP+TLS on the first beacon (~RTT 131ms p75 on mobile). */}
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="" />
        {/* Order is load-bearing: the Consent Mode default must be queued
            before the GA4 config call that follows it. */}
        <ConsentModeScript />
        <Ga4HeadScript />
      </head>
      <body suppressHydrationWarning>
        {/* Skip-to-content link (WCAG 2.1 A): first focusable element; hidden
            until focused, then jumps keyboard users past the nav to <main>. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#471EC0] focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#471EC0]"
        >
          Skip to main content
        </a>
        <ConsentProvider>
          <AttributionProvider>
            <JsonLdGraph id="site-jsonld" graph={siteGraph} />
            <PreviewBanner />
            <SearchProvider>
              <SmoothScrollProvider>{children}</SmoothScrollProvider>
            </SearchProvider>
            <GatedAnalytics />
            <CookieBanner />
            <ClickSpark />
          </AttributionProvider>
        </ConsentProvider>
      </body>
    </html>
  );
}
