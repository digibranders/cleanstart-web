"use client";

import { useState } from "react";
import { CHECK_D, PublicHeading, PublicSplit, StatusIcon } from "@/components/partners/public-frame";
import { replyToApplicationAction } from "@/server/actions/apply";

const ASIDE = (
  <div style={{ maxWidth: 420, alignSelf: "center" }}>
    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
      A quick question from the partner team
    </h2>
  </div>
);

/** The page the "we need more information" email links to. A link that cannot be used gets one message, whatever the reason. */
export function ApplyReply({ token, preview }: { token: string; preview: { company: string; question: string } | null }): React.JSX.Element {
  const [message, setMessage] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!preview) {
    return (
      <PublicSplit label="Reply to the partner team" tag="Partner program" footerLeft="CleanStart Partner Program" asideLabel="About this page" aside={ASIDE}>
        <div role="status" style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
          <PublicHeading title="This link is no longer valid">
            It may already have been used, or the question was answered another way. Reply to the email from the partner team and they will pick it up.
          </PublicHeading>
        </div>
      </PublicSplit>
    );
  }

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setTried(true);
    setError(null);
    if (!message.trim()) return;
    setBusy(true);
    const result = await replyToApplicationAction({ token, message });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setSent(true);
  };

  return (
    <PublicSplit label="Reply to the partner team" tag="Partner program" footerLeft="CleanStart Partner Program" asideLabel="About this page" aside={ASIDE}>
      {sent ? (
        <div role="status" style={{ width: "100%", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <StatusIcon d={CHECK_D} tone="green" />
          <PublicHeading title="Thanks, we have your answer">
            The partner team will pick up {preview.company}'s application again and email you the decision.
          </PublicHeading>
        </div>
      ) : (
        <form onSubmit={submit} noValidate style={{ width: "100%", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <PublicHeading title={`More information for ${preview.company}`}>The partner team asked:</PublicHeading>
          <blockquote style={{ margin: 0, padding: "10px 12px", borderRadius: 8, background: "#FAFAFB", border: "1px solid #ECEBF1", fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
            {preview.question}
          </blockquote>
          <div className="fg">
            <label htmlFor="rp-message" className="lbl">
              Your answer
            </label>
            <textarea
              id="rp-message"
              className={`field${tried && !message.trim() ? " field-err" : ""}`}
              rows={6}
              maxLength={4000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-invalid={tried && !message.trim() ? true : undefined}
              aria-describedby="rp-message-err"
            />
            {tried && !message.trim() ? (
              <span className="err" id="rp-message-err">
                Write your answer first.
              </span>
            ) : null}
          </div>
          {error ? (
            <span className="err" role="alert">
              {error}
            </span>
          ) : null}
          <button type="submit" className="btn btn-p" style={{ alignSelf: "flex-start", height: 38, padding: "0 16px" }} disabled={busy}>
            Send answer
          </button>
        </form>
      )}
    </PublicSplit>
  );
}
