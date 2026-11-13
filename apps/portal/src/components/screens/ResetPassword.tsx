"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BulletList, PublicHeading, PublicSplit } from "@/components/partners/public-frame";
import { PasswordField, PasswordRules, passwordRules } from "@/components/ui/password-field";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

const RULES = passwordRules("").map((rule) => rule.label);

export function ResetPassword({ token }: { token: string }): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(
        failure.code === "PASSWORD_RULES_NOT_MET"
          ? "Meet all four password rules."
          : "This reset link is invalid or has expired. Request a new one on the sign-in page.",
      );
      return;
    }
    toast("Password updated. Sign in with your new password.");
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
      {token ? (
        <form
          onSubmit={submit}
          noValidate
          style={{ width: "100%", maxWidth: 360, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}
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
        <div role="status" style={{ width: "100%", maxWidth: 360, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <PublicHeading title="This reset link is not valid">
            Check that you copied the whole link from the email, or request a new one on the sign-in page.
          </PublicHeading>
          <Link href={ROUTES.signIn} className="btn btn-s" style={{ alignSelf: "flex-start" }}>
            Go to sign in
          </Link>
        </div>
      )}
    </PublicSplit>
  );
}
