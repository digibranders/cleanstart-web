import type { Metadata, Viewport } from "next";
import { Figtree, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://cleanstart.com"),
  title: {
    default: "CleanStart — Secure by Design. Built from Source.",
    template: "%s | CleanStart",
  },
  description:
    "Verified container images. Built from source, hardened, signed, and continuously verified.",
  openGraph: {
    title: "CleanStart — Secure by Design. Built from Source.",
    description:
      "Verified container images. Built from source, hardened, signed, and continuously verified.",
    type: "website",
    siteName: "CleanStart",
  },
  twitter: {
    card: "summary_large_image",
    title: "CleanStart — Secure by Design. Built from Source.",
    description:
      "Verified container images. Built from source, hardened, signed, and continuously verified.",
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
      <body>{children}</body>
    </html>
  );
}
