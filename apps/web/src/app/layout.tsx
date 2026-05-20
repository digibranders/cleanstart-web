import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { PreviewBanner } from "@/components/PreviewBanner";
import { WebVitals } from "@/components/observability/WebVitals";
import { SITE_NAME, SITE_URL } from "@/lib/seo/canonical";
import { JsonLd, organizationSchema } from "@/lib/seo/jsonld";

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
    images: [
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: "CleanStart — verified container images",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/og/default.png",
        alt: "CleanStart — verified container images",
      },
    ],
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
      <body>
        <JsonLd id="org-jsonld" data={organizationSchema()} />
        <WebVitals />
        <PreviewBanner />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
