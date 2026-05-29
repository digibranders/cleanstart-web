"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/icons/Logo";
import { ErrorHero } from "@/components/sections/error/ErrorHero";

// NOTE: Header and Footer are async Server Components that transitively
// import cms-fetch.ts → next/headers, which cannot be statically imported
// inside a "use client" boundary (Turbopack traces the import graph and
// rejects the build). The error boundary intentionally renders a minimal
// static header so it never depends on server-only APIs. The full Header/
// Footer are rendered by each page's own layout; the error boundary is a
// last-resort fallback where a simplified chrome is acceptable.

function MinimalHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#100d1e]/90 px-6 backdrop-blur-md">
      <Link
        href="/"
        aria-label="CleanStart home"
        className="flex shrink-0 items-center text-white outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#33BAEC]"
      >
        <Logo className="h-7 w-auto" />
      </Link>
      <Link
        href="/"
        className="text-sm font-medium text-white/70 transition-colors hover:text-white"
      >
        ← Back to home
      </Link>
    </header>
  );
}

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
      <MinimalHeader />
      <main>
        <ErrorHero title="Server Error" referenceId={error.digest} />
      </main>
    </>
  );
}
