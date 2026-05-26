"use client";

import { useEffect } from "react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { ErrorHero } from "@/components/sections/error/ErrorHero";

export default function ErrorBoundary({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sentry = (window as { Sentry?: { captureException: (e: unknown) => void } })
        .Sentry;
      sentry?.captureException(error);
    }
  }, [error]);

  return (
    <>
      <Header />
      <main>
        <ErrorHero title="Server Error" referenceId={error.digest} />
      </main>
      <Footer />
    </>
  );
}
