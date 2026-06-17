import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";
import "./globals.css";
import "./scrollbar.css";
import { cn } from "@/lib/utils";
import { PreviewBanner } from "@/components/PreviewBanner";
import { SearchProvider } from "@/components/search/SearchProvider";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
import {
  ConsentProvider,
  ConsentModeScript,
  GatedAnalytics,
  CookieBanner,
} from "@/components/consent";
import { SITE_NAME, SITE_URL } from "@/lib/seo/canonical";
import { isIndexingAllowed } from "@/lib/seo/indexing";
import { ogImageUrl } from "@/lib/seo/og";
import { JsonLd, organizationSchema } from "@/lib/seo/jsonld";
import Script from 'next/script';

// Display family — headings, section titles, card titles. Preloaded for LCP.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | CleanStart",
  },
  description: DESCRIPTION,
  alternates: {
    canonical: "/",
  },
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
    description: DESCRIPTION,
    url: SITE_URL,
    type: "website",
    siteName: SITE_NAME,
    images: [{ url: HOME_OG, width: 1200, height: 630, alt: TITLE }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: HOME_OG, alt: TITLE }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#151021",
  // Required for env(safe-area-inset-*) to resolve to non-zero on notched devices.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <ConsentModeScript />
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
          <JsonLd id="org-jsonld" data={organizationSchema()} />
          <PreviewBanner />
          <SearchProvider>
            <SmoothScrollProvider>{children}</SmoothScrollProvider>
          </SearchProvider>
          <GatedAnalytics />
          <CookieBanner />
        </ConsentProvider>
        <Script
          src="https://cdn.oyechats.com/oyechats-widget.js"
          data-bot-key="bot-1a48d5dc6d4f"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
