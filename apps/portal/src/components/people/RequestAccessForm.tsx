"use client";

import Link from "next/link";
import { useState } from "react";
import { CHECK_D, PublicHeading, StatusIcon } from "@/components/partners/public-frame";
import { isFreeEmail, isValidEmail } from "@/lib/people";
import { ROUTES } from "@/lib/routes";
import { requestAccessAction } from "@/server/actions/invites";
import { issuesToErrors } from "@/server/actions/result";

const FORM_STYLE: React.CSSProperties = {
  width: "100%",
  maxWidth: 360,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};
const BTN_BIG: React.CSSProperties = { height: 38, fontSize: 13.5 };

export function RequestAccessForm({ onBack }: { onBack: () => void }): React.JSX.Element {
  const [rq, setRq] = useState({ name: "", email: "", note: "" });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const emailFree = isFreeEmail(rq.email);
  const emailBad = !isValidEmail(rq.email) || emailFree;
  const nameBad = !rq.name.trim();

  const send = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    if (nameBad || emailBad) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await requestAccessAction({ name: rq.name, email: rq.email, note: rq.note });
    setBusy(false);
    if (!result.ok) {
      setServerErrors(issuesToErrors(result.error));
      setFormError(result.error.issues?.length ? null : result.error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div role="status" style={FORM_STYLE}>
        <StatusIcon d={CHECK_D} tone="green" />
        <PublicHeading title="Request sent">
          If your company is a CleanStart partner, its partner admin has been notified and will review your request, and
          you get an invite by email once they approve. We also emailed {rq.email} a copy of this request.
        </PublicHeading>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#5E5B6E" }}>
          Not a partner company yet?{" "}
          <Link href={ROUTES.apply} style={{ fontWeight: 600 }}>
            Apply to become a partner
          </Link>
          .
        </p>
        <button type="button" className="btn btn-s" onClick={onBack} style={{ alignSelf: "flex-start" }}>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={send} noValidate style={FORM_STYLE}>
      <PublicHeading title="Request access">
        For people at a company that is already a CleanStart partner. Your partner admin approves the request.
      </PublicHeading>
      <div className="fg">
        <label htmlFor="rq-name" className="lbl">
          Full name
        </label>
        <input
          id="rq-name"
          className={`field${tried && nameBad ? " field-err" : ""}`}
          type="text"
          autoComplete="name"
          value={rq.name}
          onChange={(e) => setRq({ ...rq, name: e.target.value })}
          aria-invalid={tried && nameBad ? true : undefined}
          aria-describedby="rq-name-err"
        />
        {tried && nameBad ? (
          <span className="err" id="rq-name-err">
            Enter your name.
          </span>
        ) : null}
      </div>
      <div className="fg">
        <label htmlFor="rq-email" className="lbl">
          Work email
        </label>
        <input
          id="rq-email"
          className={`field${(tried && emailBad) || serverErrors.email ? " field-err" : ""}`}
          type="email"
          autoComplete="email"
          value={rq.email}
          onChange={(e) => setRq({ ...rq, email: e.target.value })}
          aria-invalid={(tried && emailBad) || serverErrors.email ? true : undefined}
          aria-describedby="rq-email-err"
        />
        {(tried && emailBad) || serverErrors.email ? (
          <span className="err" id="rq-email-err">
            {serverErrors.email ??
              (emailFree ? "Use your company email, not a personal address." : "Enter a valid work email.")}
          </span>
        ) : null}
      </div>
      <div className="fg">
        <label htmlFor="rq-note" className="lbl">
          Note to your partner admin <span className="hint">(optional)</span>
        </label>
        <textarea
          id="rq-note"
          className="field"
          rows={2}
          value={rq.note}
          onChange={(e) => setRq({ ...rq, note: e.target.value })}
        />
      </div>
      {formError ? (
        <span className="err" role="alert">
          {formError}
        </span>
      ) : null}
      <button type="submit" className="btn btn-p" style={BTN_BIG} disabled={busy}>
        Send request
      </button>
      <button type="button" className="btn btn-g" onClick={onBack} style={{ alignSelf: "flex-start" }}>
        Back to sign in
      </button>
    </form>
  );
}
