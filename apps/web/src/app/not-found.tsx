import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { StateView } from "@/components/feedback";

export const metadata: Metadata = {
  title: "Page Not Found · CleanStart",
  description: "The page you're looking for doesn't exist or has moved.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main>
        <StateView
          variant="not-found"
          actions={
            <Link
              href="/"
              className="cs-btn-glass"
              style={{
                ["--cs-btn-h" as string]: "52px",
                ["--cs-btn-px" as string]: "28px",
                ["--cs-btn-fs" as string]: "16px",
              }}
            >
              Back to home
            </Link>
          }
        />
      </main>
      <Footer />
    </>
  );
}
