"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BulletList, CHECK_D, PublicHeading, PublicSplit, StatusIcon } from "@/components/partners/public-frame";
import { PasswordField, PasswordRules, passwordRules } from "@/components/ui/password-field";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { NETWORK_FAILURE_STATUS, settleAuth } from "@/lib/auth-call";
import { isValidEmail } from "@/lib/people";
import { ROUTES } from "@/lib/routes";

const RESEND_SECONDS = 60;
const RULES = passwordRules("").map((rule) => rule.label);

const NARROW_COLUMN: React.CSSProperties = {
  width: "100%",
  maxWidth: 360,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

/** Shown when the page is opened without a token: the same request the sign-in page makes, with the same answer for every address. */
function RequestResetLink({ dead = false }: { dead?: boolean }): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [wait, setWait] = useState(0);
  const bad = !isValidEmail(email);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((left) => left - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const send = async (event?: React.FormEvent): Promise<void> => {
    event?.preventDefault();
    if (bad) {
      setTried(true);
      return;
    }
    setBusy(true);
    setError("");
    const { error: failure } = await settleAuth(() =>
      authClient.requestPasswordReset({ email: email.trim().toLowerCase(), redirectTo: ROUTES.resetPassword }),
    );
    setBusy(false);
    if (failure) {
      setError(
        failure.status === 429
          ? "Too many attempts. Wait a minute and try again."
          : failure.status === NETWORK_FAILURE_STATUS
            ? "We could not reach the server. Check your connection and try again."
            : "We could not send the link. Try again in a moment.",
      );
      return;
    }
    setSent(true);
    setWait(RESEND_SECONDS);
  };

  if (sent) {
    return (
      <div role="status" style={NARROW_COLUMN}>
        <StatusIcon d={CHECK_D} tone="green" />
        <PublicHeading title="Check your email">
          If {email} has a portal login, a reset link is on its way. The link works for 60 minutes.
        </PublicHeading>
        {error ? (
          <span className="err" role="alert">
            {error}
          </span>
        ) : null}
        <button
          type="button"
          className="btn btn-s"
          style={{ alignSelf: "flex-start" }}
          disabled={busy || wait > 0}
          onClick={() => void send()}
        >
          {wait > 0 ? `Send again in ${wait}s` : "Send the link again"}
        </button>
        <Link href={ROUTES.signIn} className="btn btn-s" style={{ alignSelf: "flex-start" }}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={send} noValidate style={NARROW_COLUMN}>
      <PublicHeading title={dead ? "This reset link no longer works" : "Reset your password"}>
        {dead
          ? "Reset links last 60 minutes and work once. Enter your email and we will send a new one."
          : "We will email you a link to set a new password."}
      </PublicHeading>
      <div className="fg">
        <label htmlFor="reset-email" className="lbl">
          Work email
        </label>
        <input
          id="reset-email"
          className={`field${tried && bad ? " field-err" : ""}`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={tried && bad ? true : undefined}
          aria-describedby="reset-err"
        />
        {tried && bad ? (
          <span className="err" id="reset-err">
            Enter a valid work email.
          </span>
        ) : null}
      </div>
      {error ? (
        <span className="err" role="alert">
          {error}
        </span>
      ) : null}
      <button type="submit" className="btn btn-p" style={{ height: 38, fontSize: 13.5 }} disabled={busy}>
        Send reset link
      </button>
      <Link href={ROUTES.signIn} className="btn btn-g" style={{ alignSelf: "flex-start" }}>
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetPassword({ token, linkDead = false }: { token: string; linkDead?: boolean }): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  const weak = passwordRules(pw).some((rule) => !rule.met);
  const mismatch = !weak && pw !== pw2;

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    if (weak || mismatch) {
      setTried(true);
      return;
    }
    setBusy(true);
    const { error: failure } = await authClient.resetPassword({ newPassword: pw, token });
    setBusy(false);
    if (failure) {
      if (failure.code === "PASSWORD_RULES_NOT_MET") setError("Meet all four password rules.");
      else if (failure.code === "INVALID_TOKEN") setExpired(true);
      else setError("We could not update your password. Try again in a moment.");
      return;
    }
    toast("Password updated and every other session signed out. Sign in with your new password.");
    router.push(ROUTES.signIn);
  };

  return (
    <PublicSplit
      label="Reset password"
      tag="Partner Portal"
      footerLeft="CleanStart Partner Portal"
      asideLabel="Password rules"
      aside={
        <div style={{ maxWidth: 420, alignSelf: "center", display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            Choose a strong password
          </h2>
          <BulletList items={RULES} />
        </div>
      }
    >
      {token && !linkDead && !expired ? (
        <form
          onSubmit={submit}
          noValidate
          style={NARROW_COLUMN}
        >
          <PublicHeading title="Set a new password">
            You will be signed out everywhere else and can sign in with the new password.
          </PublicHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PasswordField
              label="New password"
              value={pw}
              onChange={setPw}
              {...(tried && weak ? { error: "Choose a password that meets every rule below." } : {})}
            />
            <div role="group" aria-label="Password rules">
              <PasswordRules value={pw} />
            </div>
          </div>
          <PasswordField
            label="Confirm new password"
            value={pw2}
            onChange={setPw2}
            {...(tried && mismatch ? { error: "The passwords do not match." } : {})}
          />
          {error ? (
            <span className="err" role="alert">
              {error}
            </span>
          ) : null}
          <button type="submit" className="btn btn-p" style={{ height: 38, fontSize: 13.5 }} disabled={busy}>
            Update password
          </button>
        </form>
      ) : (
        <RequestResetLink dead={linkDead || expired} />
      )}
    </PublicSplit>
  );
}
