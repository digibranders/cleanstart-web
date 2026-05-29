"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/icons/Logo";
import { StateView, type StateVariant } from "@/components/feedback";

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

/**
 * Picks the illustrated variant from the caught error. Offline takes priority
 * (the request never reached the server); otherwise map the carried HTTP
 * status. Falls back to a generic server error.
 */
function resolveVariant(error: Error & { status?: number }): StateVariant {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "offline";
  }
  switch (error.status) {
    case 503:
      return "maintenance";
    case 400:
      return "bad-request";
    case 403:
      return "forbidden";
    default:
      return "server-error";
  }
}

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string; status?: number };
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
        <StateView
          variant={resolveVariant(error)}
          referenceId={error.digest}
          actions={
            <>
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-12 items-center rounded-full border border-white/30 bg-white/10 px-7 font-medium text-white backdrop-blur-md transition-all hover:border-white/50 hover:bg-white/20"
                style={{ fontSize: "var(--fs-button)" }}
              >
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex h-12 items-center rounded-full border border-white/15 px-7 font-medium text-white/80 backdrop-blur-md transition-all hover:border-white/30 hover:text-white"
                style={{ fontSize: "var(--fs-button)" }}
              >
                Back to home
              </Link>
            </>
          }
        />
      </main>
    </>
  );
}
