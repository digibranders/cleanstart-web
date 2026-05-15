import type { Metadata, Viewport } from "next";
import { Figtree, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { WebVitals } from "@/components/observability/WebVitals";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-figtree",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

// Inter is the secondary font (used in a few sections). Skipping preload
// keeps the LCP request budget for Figtree, which is on every page.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

const isProduction = process.env.VERCEL_ENV === "production";

const SITE_URL = "https://www.cleanstart.com";
const SITE_NAME = "CleanStart";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("font-sans", figtree.variable, inter.variable)}
      style={{ ["--font-sans" as string]: "var(--font-figtree)" }}
    >
      <body>
        <WebVitals />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
