import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { ErrorHero } from "@/components/sections/error/ErrorHero";

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
        <ErrorHero title="Page Not Found" />
      </main>
      <Footer />
    </>
  );
}
