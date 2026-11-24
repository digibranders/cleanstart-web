import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";

import { SITE_NAME, SITE_URL, isIndexingAllowed } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: "Events hosted by CleanStart and its partners.",
  robots: isIndexingAllowed() ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en" className={`${manrope.variable} ${sora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
