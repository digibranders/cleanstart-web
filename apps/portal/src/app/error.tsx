"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ROUTES } from "@/lib/routes";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="public state-page">
      <title>Something went wrong | CleanStart Partner Portal</title>
      <div className="state-card">
        <span className="state-code">Something went wrong</span>
        <h1 className="state-h">This screen could not load</h1>
        <p className="state-p">
          Try again. If it keeps happening, sign in again or contact your partner manager.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-p" onClick={reset}>
            Try again
          </button>
          <Link href={ROUTES.signIn} className="btn btn-s">
            Sign in
          </Link>
        </div>
        {error.digest ? (
          <span className="hint" style={{ userSelect: "all" }}>
            Reference: {error.digest}
          </span>
        ) : null}
      </div>
    </main>
  );
}
