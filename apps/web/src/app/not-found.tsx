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
              className="inline-flex h-11 items-center rounded-xl bg-white px-6 font-medium text-[#2E1D8E] transition-colors hover:bg-white/90"
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
