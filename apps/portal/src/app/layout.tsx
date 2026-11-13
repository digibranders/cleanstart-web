import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "@/styles/portal.css";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: { default: "CleanStart Partner Portal", template: "%s | CleanStart Partner Portal" },
  description: "CleanStart partner portal: deal registration, documents and your team.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
