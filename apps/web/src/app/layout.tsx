import type { Metadata, Viewport } from "next";
import { Figtree, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { WebVitals } from "@/components/observability/WebVitals";
import { SITE_NAME, SITE_URL } from "@/lib/seo/canonical";
import { JsonLd, organizationSchema } from "@/lib/seo/jsonld";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-figtree",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
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
        <JsonLd id="org-jsonld" data={organizationSchema()} />
        <WebVitals />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
