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
              className="inline-flex h-12 items-center rounded-full border border-white/30 bg-white/10 px-7 font-medium text-white backdrop-blur-md transition-all hover:border-white/50 hover:bg-white/20"
              style={{ fontSize: "var(--fs-button)" }}
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
