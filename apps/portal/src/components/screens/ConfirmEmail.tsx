"use client";

import Link from "next/link";
import { useState } from "react";
import { CHECK_D, PublicHeading, PublicSplit, StatusIcon } from "@/components/partners/public-frame";
import { ROUTES } from "@/lib/routes";
import type { EmailChangePreview } from "@/server/repo/member-edit";
import { confirmEmailChangeAction } from "@/server/actions/member-edit";

const NARROW_COLUMN: React.CSSProperties = {
  width: "100%",
  maxWidth: 360,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const DEAD_COPY: Record<"expired" | "used" | "unknown", { title: string; body: string }> = {
  expired: { title: "This link has expired", body: "Links work for 24 hours. Ask your partner admin to send a new one." },
  used: { title: "This link was already used", body: "Your email is already changed. Sign in with the new address." },
  unknown: { title: "This link is not valid", body: "Check that you opened the whole link from the email, or ask your partner admin to send a new one." },
};

export function ConfirmEmail({ token, preview }: { token: string; preview: EmailChangePreview }): React.JSX.Element {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const confirm = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    const result = await confirmEmailChangeAction({ token });
    setBusy(false);
    if (!result.ok) setError(result.error.message);
    else setDone(result.data.newEmail);
  };

  return (
    <PublicSplit
      label="Confirm your email"
      tag="Partner Portal"
      footerLeft="CleanStart Partner Portal"
      asideLabel="About this change"
      aside={
        <div style={{ maxWidth: 420, alignSelf: "center", display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            Only you can finish this
          </h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, opacity: 0.8 }}>
            Your partner admin asked to move your sign-in to this address. Nothing changes until you confirm here.
          </p>
        </div>
      }
    >
      {done ? (
        <div role="status" style={NARROW_COLUMN}>
          <StatusIcon d={CHECK_D} tone="green" />
          <PublicHeading title="Your email is changed">
            Sign in with {done} from now on. You were signed out everywhere, so sign in again.
          </PublicHeading>
          <Link href={ROUTES.signIn} className="btn btn-p" style={{ alignSelf: "flex-start" }}>
            Go to sign in
          </Link>
        </div>
      ) : preview.state === "ok" ? (
        <div style={NARROW_COLUMN}>
          <PublicHeading title="Confirm your new email">
            Hello {preview.name}. Use {preview.newEmail} to sign in to the Partner Portal from now on. You will be signed out everywhere and
            your old address gets a notice.
          </PublicHeading>
          {error ? (
            <span className="err" role="alert">
              {error}
            </span>
          ) : null}
          <button type="button" className="btn btn-p" style={{ height: 38, fontSize: 13.5, alignSelf: "flex-start" }} disabled={busy} onClick={() => void confirm()}>
            Confirm this address
          </button>
        </div>
      ) : (
        <div style={NARROW_COLUMN}>
          <PublicHeading title={DEAD_COPY[preview.state].title}>{DEAD_COPY[preview.state].body}</PublicHeading>
          <Link href={ROUTES.signIn} className="btn btn-s" style={{ alignSelf: "flex-start" }}>
            Back to sign in
          </Link>
        </div>
      )}
    </PublicSplit>
  );
}
