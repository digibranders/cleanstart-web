"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
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
          background:
            "linear-gradient(180deg, #151021 0%, #10123E 50%, #471FC3 100%)",
          color: "#ffffff",
        }}
      >
        <p
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "0.75rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.28em",
            color: "rgba(255, 255, 255, 0.55)",
          }}
        >
          Fatal · Application Error
        </p>
        <h1
          style={{
            marginTop: "1.25rem",
            fontFamily: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            lineHeight: 1.15,
            fontWeight: 700,
            maxWidth: "640px",
          }}
        >
          The whole scan crashed.
        </h1>
        <p
          style={{
            marginTop: "1rem",
            maxWidth: "32rem",
            color: "rgba(255, 255, 255, 0.7)",
            lineHeight: 1.6,
          }}
        >
          A critical error stopped the page from loading. Our team has been notified.
          Reloading usually clears it.
        </p>
        {error.digest ? (
          <p
            style={{
              marginTop: "1.5rem",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "0.75rem",
              color: "rgba(255, 255, 255, 0.45)",
            }}
          >
            trace ·{" "}
            <span style={{ color: "rgba(255, 255, 255, 0.75)" }}>{error.digest}</span>
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
            background: "#3960F9",
            color: "#fff",
            fontSize: "0.9375rem",
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
