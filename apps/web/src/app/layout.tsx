import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { PreviewBanner } from "@/components/PreviewBanner";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
import { AgentationDev } from "@/components/dev/AgentationDev";
import { WebVitals } from "@/components/observability/WebVitals";
import { SITE_NAME, SITE_URL } from "@/lib/seo/canonical";
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

const isProduction = process.env.VERCEL_ENV === "production";

const TITLE = "CleanStart — Secure by Design. Built from Source.";
const DESCRIPTION =
  "Verified container images. Built from source, hardened, signed, and continuously verified.";

const HOME_OG = ogImageUrl({
  variant: "hero",
  title: "Secure by Design. Built from Source.",
  titleAccent: "Built from Source.",
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
  robots: isProduction
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
      <body suppressHydrationWarning>
        {children}
        <Script
          src="https://cdn.oyechats.com/oyechats-widget.js"
          data-bot-key="bot-d255b910fa83"
          strategy="lazyOnload"
        />
        <JsonLd id="org-jsonld" data={organizationSchema()} />
        <WebVitals />
        <PreviewBanner />
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
        <Analytics />
        <SpeedInsights />
        <AgentationDev />
      </body>
    </html>
  );
}
