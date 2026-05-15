"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1.5rem",
          textAlign: "center",
          fontFamily: "var(--font-sora), ui-sans-serif, system-ui, sans-serif",
          background: "#fafafa",
          color: "#111",
        }}
      >
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "#666",
          }}
        >
          Application error
        </p>
        <h1
          style={{
            marginTop: "1rem",
            fontFamily: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif",
            fontSize: "2.25rem",
            lineHeight: 1.15,
            fontWeight: 700,
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            marginTop: "1rem",
            maxWidth: "28rem",
            color: "#555",
          }}
        >
          A critical error stopped the page from loading. Our team has been notified.
        </p>
        {error.digest ? (
          <p
            style={{
              marginTop: "1.5rem",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "0.75rem",
              color: "#777",
            }}
          >
            Reference: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "2.5rem",
            height: "2.75rem",
            padding: "0 1.5rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#111",
            color: "#fff",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
