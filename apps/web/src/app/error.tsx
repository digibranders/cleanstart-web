"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
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
    <main className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Something went wrong
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
        We hit an error loading this page
      </h1>
      <p className="mt-4 max-w-md text-base text-muted-foreground">
        Our team has been notified. You can try again, or head back to the homepage.
      </p>
      {error.digest ? (
        <p className="mt-6 font-mono text-xs text-muted-foreground/70">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-lg border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Go to homepage
        </Link>
      </div>
    </main>
  );
}
