"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import {
  BulletList,
  CHECK_D,
  PublicHeading,
  PublicSplit,
  StatusIcon,
} from "@/components/partners/public-frame";
import { PasswordField } from "@/components/ui/password-field";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/next-path";
import {
  emailDomain,
  findPartnerByDomain,
  isFreeEmail,
  isValidEmail,
  partnersSlice,
} from "@/data/partners";
import { ROUTES } from "@/lib/routes";

type View = "signin" | "code" | "request" | "requested" | "nopartner" | "forgot" | "sent";

const TOO_MANY = "Too many attempts. Try again in a moment.";

/** Which social buttons to show: only providers whose keys are configured on the server. */
interface SocialAvailability {
  google: boolean;
  microsoft: boolean;
}

const GOOGLE_D =
  "M222,128a94,94,0,1,1-21.49-59.82,6,6,0,1,1-9.25,7.64A82,82,0,1,0,209.78,134H128a6,6,0,0,1,0-12h88A6,6,0,0,1,222,128Z";
const MICROSOFT_D =
  "M208,138H128a6,6,0,0,0-6,6v57.45a6,6,0,0,0,4.93,5.91l80,14.54a5.46,5.46,0,0,0,1.07.1,6,6,0,0,0,6-6V144A6,6,0,0,0,208,138Zm-6,70.81-68-12.36V150h68ZM96,138H32a6,6,0,0,0-6,6v40a6,6,0,0,0,4.93,5.9l64,11.64a6.36,6.36,0,0,0,1.07.1,6,6,0,0,0,6-6V144A6,6,0,0,0,96,138Zm-6,50.45L38,179V150H90ZM211.84,35.39a6,6,0,0,0-4.91-1.29l-80,14.54A6,6,0,0,0,122,54.55V112a6,6,0,0,0,6,6h80a6,6,0,0,0,6-6V40A6,6,0,0,0,211.84,35.39ZM202,106H134V59.55l68-12.36Z";
const PHONE_D =
  "M176,18H80A22,22,0,0,0,58,40V216a22,22,0,0,0,22,22h96a22,22,0,0,0,22-22V40A22,22,0,0,0,176,18ZM70,62H186V194H70ZM80,30h96a10,10,0,0,1,10,10V50H70V40A10,10,0,0,1,80,30Zm96,196H80a10,10,0,0,1-10-10V206H186v10A10,10,0,0,1,176,226Z";
const HELP_D =
  "M138,180a10,10,0,1,1-10-10A10,10,0,0,1,138,180ZM128,74c-21,0-38,15.25-38,34v4a6,6,0,0,0,12,0v-4c0-12.13,11.66-22,26-22s26,9.87,26,22-11.66,22-26,22a6,6,0,0,0-6,6v8a6,6,0,0,0,12,0v-2.42c18.11-2.58,32-16.66,32-33.58C166,89.25,149,74,128,74Zm102,54A102,102,0,1,1,128,26,102.12,102.12,0,0,1,230,128Zm-12,0a90,90,0,1,0-90,90A90.1,90.1,0,0,0,218,128Z";

const FORM_STYLE: React.CSSProperties = {
  width: "100%",
  maxWidth: 360,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const BTN_BIG: React.CSSProperties = { height: 38, fontSize: 13.5 };

export function SignIn({ providers }: { providers: SocialAvailability }): React.JSX.Element {
  const { partners } = partnersSlice.use();
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [signinError, setSigninError] = useState("");
  const [socialError, setSocialError] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [resetError, setResetError] = useState("");
  const [signinTried, setSigninTried] = useState(false);
  const [code, setCode] = useState("");
  const [backup, setBackup] = useState(false);
  const [codeTried, setCodeTried] = useState(false);
  const [rq, setRq] = useState({ name: "", email: "", note: "" });
  const [rqTried, setRqTried] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetTried, setResetTried] = useState(false);

  // The Apply page links here with ?request=1 when an applicant's company is already a partner.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("request") === "1") setView("request");
    if (params.get("error")) setSocialError(true);
  }, []);

  // A full navigation: the session cookie was just set, and "/" sends each role to its own home.
  const enter = (): void => {
    window.location.assign(safeNext(new URLSearchParams(window.location.search).get("next")) ?? "/");
  };

  const signInWith = async (provider: "google" | "microsoft"): Promise<void> => {
    setSocialError(false);
    await authClient.signIn.social({
      provider,
      callbackURL: safeNext(new URLSearchParams(window.location.search).get("next")) ?? "/",
      errorCallbackURL: ROUTES.signIn,
    });
  };

  const emailBad = !isValidEmail(email);
  const passwordBad = !password;
  const submitSignin = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (emailBad || passwordBad) {
      setSigninTried(true);
      return;
    }
    setBusy(true);
    setSigninError("");
    const { data, error } = await authClient.signIn.email({
      email: email.trim().toLowerCase(),
      password,
      rememberMe: keepSignedIn,
    });
    setBusy(false);
    if (error) {
      setSigninError(error.status === 429 ? TOO_MANY : "That email and password do not match.");
      return;
    }
    if ((data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) {
      setCode("");
      setCodeTried(false);
      setCodeError("");
      setBackup(false);
      setView("code");
      return;
    }
    enter();
  };

  // Backup codes are shown as "XXXXX XXXXX" and stored as "XXXXX-XXXXX"; accept either, with or without the gap.
  const codeRaw = code.replace(/[\s-]/g, "");
  const codeReady = backup ? /^[A-Za-z0-9]{10}$/.test(codeRaw) : /^\d{6}$/.test(codeRaw);
  const verify = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!codeReady) {
      setCodeTried(true);
      return;
    }
    setBusy(true);
    setCodeError("");
    const { error } = backup
      ? await authClient.twoFactor.verifyBackupCode({ code: `${codeRaw.slice(0, 5)}-${codeRaw.slice(5)}` })
      : await authClient.twoFactor.verifyTotp({ code: codeRaw });
    setBusy(false);
    if (error) {
      setCodeError(
        error.status === 429
          ? TOO_MANY
          : backup
            ? "That backup code did not work. Check it and try again."
            : "That code did not work. Check it and try again.",
      );
      return;
    }
    enter();
  };

  const rqEmailFree = isFreeEmail(rq.email);
  const rqEmailBad = !isValidEmail(rq.email) || rqEmailFree;
  const rqNameBad = !rq.name.trim();
  const rqPartner = findPartnerByDomain(partners, emailDomain(rq.email));
  const sendRequest = (event: React.FormEvent): void => {
    event.preventDefault();
    if (rqNameBad || rqEmailBad) {
      setRqTried(true);
      return;
    }
    setView(rqPartner ? "requested" : "nopartner");
  };

  const resetBad = !isValidEmail(resetEmail);
  const sendReset = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (resetBad) {
      setResetTried(true);
      return;
    }
    setBusy(true);
    setResetError("");
    const { error } = await authClient.requestPasswordReset({
      email: resetEmail.trim().toLowerCase(),
      redirectTo: ROUTES.resetPassword,
    });
    setBusy(false);
    if (error) {
      setResetError(error.status === 429 ? TOO_MANY : "We could not send the link. Try again in a moment.");
      return;
    }
    setView("sent");
  };

  const showRequest = (): void => {
    setRqTried(false);
    setView("request");
  };
  const backToSignin = (): void => setView("signin");

  return (
    <PublicSplit
      label="Sign in"
      tag="Partner Portal"
      footerLeft="CleanStart Partner Portal"
      asideLabel="About the portal"
      aside={
        <div style={{ maxWidth: 440, alignSelf: "center", display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            Register deals, track approval and get the material to sell CleanStart.
          </h2>
          <BulletList
            items={[
              "90 days of protection once CleanStart accepts a deal",
              "Deal stages update from CleanStart's CRM",
              "Private datasheets, videos and playbooks",
            ]}
          />
        </div>
      }
    >
        {view === "signin" ? (
          <form onSubmit={submitSignin} noValidate style={FORM_STYLE} data-tour="signin-form">
            <PublicHeading title="Sign in">Use the work email your partner admin invited.</PublicHeading>
            {socialError ? (
              <span className="err" role="alert">
                That sign-in did not work. Use the email your partner admin invited, or sign in with your password.
              </span>
            ) : null}
            {providers.google || providers.microsoft ? (
              <>
                <div style={{ display: "grid", gap: 8 }} data-tour="signin-sso">
                  {providers.google ? (
                    <button type="button" className="btn btn-s" style={BTN_BIG} onClick={() => void signInWith("google")}>
                      <Icon d={GOOGLE_D} />
                      Continue with Google
                    </button>
                  ) : null}
                  {providers.microsoft ? (
                    <button type="button" className="btn btn-s" style={BTN_BIG} onClick={() => void signInWith("microsoft")}>
                      <Icon d={MICROSOFT_D} />
                      Continue with Microsoft
                    </button>
                  ) : null}
                </div>
                <div
                  role="separator"
                  style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#6B687D" }}
                >
                  <span style={{ flex: 1, height: 1, background: "#ECEBF1" }} />
                  or with your work email
                  <span style={{ flex: 1, height: 1, background: "#ECEBF1" }} />
                </div>
              </>
            ) : null}
            <div className="fg">
              <label htmlFor="email" className="lbl">
                Work email
              </label>
              <input
                id="email"
                className={`field${signinTried && emailBad ? " field-err" : ""}`}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={signinTried && emailBad ? true : undefined}
                aria-describedby={signinTried && emailBad ? "email-err" : undefined}
              />
              {signinTried && emailBad ? (
                <span className="err" id="email-err">
                  Enter a valid work email.
                </span>
              ) : null}
            </div>
            <div style={{ position: "relative" }}>
              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                {...(signinTried && passwordBad ? { error: "Enter your password." } : {})}
              />
              <button
                type="button"
                className="linkbtn"
                onClick={() => {
                  setResetTried(false);
                  setView("forgot");
                }}
                style={{ position: "absolute", top: 0, right: 0, fontSize: 12.5, color: "#4B23C8" }}
              >
                Forgot password?
              </button>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4A4858" }}>
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                style={{ width: 14, height: 14, margin: 0, accentColor: "#4B23C8" }}
              />
              Keep me signed in
            </label>
            {signinError ? (
              <span className="err" role="alert">
                {signinError}
              </span>
            ) : null}
            <button type="submit" className="btn btn-p" style={BTN_BIG} disabled={busy}>
              Sign in
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6, fontSize: 12.5, color: "#5E5B6E" }}>
              <span>
                No login yet?{" "}
                <button type="button" className="linkbtn" onClick={showRequest} style={{ color: "#4B23C8" }}>
                  Request access
                </button>{" "}
                from your partner admin.
              </span>
              <span>
                Not a partner yet?{" "}
                <Link href={ROUTES.apply} style={{ fontWeight: 600 }}>
                  Apply to become a partner
                </Link>
              </span>
            </div>
          </form>
        ) : null}

        {view === "code" ? (
          <form onSubmit={verify} noValidate style={FORM_STYLE}>
            <StatusIcon d={PHONE_D} tone="violet" />
            <PublicHeading title="Two-step sign-in">
              {backup
                ? "Enter one of the backup codes you saved when you turned on two-step sign-in."
                : "Open your authenticator app and enter the code for CleanStart Partner Portal."}
            </PublicHeading>
            <div className="fg">
              <label htmlFor="code" className="lbl">
                {backup ? "Backup code" : "6-digit code"}
              </label>
              <input
                id="code"
                className={`field${codeTried && !codeReady ? " field-err" : ""}`}
                type="text"
                inputMode={backup ? "text" : "numeric"}
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                aria-invalid={codeTried && !codeReady ? true : undefined}
                aria-describedby="code-err"
                // biome-ignore lint/a11y/noAutofocus: the code step has one field and the user just asked for it
                autoFocus
                style={{ height: 42, fontSize: 18, letterSpacing: "0.3em", fontVariantNumeric: "tabular-nums" }}
              />
              {codeTried && !codeReady ? (
                <span className="err" id="code-err">
                  {backup ? "Backup codes are 10 letters and numbers." : "Enter the 6 digits from your app."}
                </span>
              ) : null}
            </div>
            {codeError ? (
              <span className="err" role="alert">
                {codeError}
              </span>
            ) : null}
            <button type="submit" className="btn btn-p" style={BTN_BIG} disabled={busy}>
              Verify and sign in
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <button type="button" className="btn btn-g" onClick={backToSignin}>
                Back
              </button>
              <button
                type="button"
                className="linkbtn"
                onClick={() => {
                  setBackup(!backup);
                  setCode("");
                  setCodeTried(false);
                }}
                style={{ fontSize: 12.5, color: "#4B23C8" }}
              >
                {backup ? "Use the authenticator app" : "Lost your phone? Use a backup code"}
              </button>
            </div>
          </form>
        ) : null}

        {view === "request" ? (
          <form onSubmit={sendRequest} noValidate style={FORM_STYLE}>
            <PublicHeading title="Request access">
              For people at a company that is already a CleanStart partner. Your partner admin approves the request.
            </PublicHeading>
            <div className="fg">
              <label htmlFor="rq-name" className="lbl">
                Full name
              </label>
              <input
                id="rq-name"
                className={`field${rqTried && rqNameBad ? " field-err" : ""}`}
                type="text"
                autoComplete="name"
                value={rq.name}
                onChange={(e) => setRq({ ...rq, name: e.target.value })}
                aria-invalid={rqTried && rqNameBad ? true : undefined}
                aria-describedby="rq-name-err"
              />
              {rqTried && rqNameBad ? (
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
                className={`field${rqTried && rqEmailBad ? " field-err" : ""}`}
                type="email"
                autoComplete="email"
                value={rq.email}
                onChange={(e) => setRq({ ...rq, email: e.target.value })}
                aria-invalid={rqTried && rqEmailBad ? true : undefined}
                aria-describedby="rq-email-err"
              />
              {rqTried && rqEmailBad ? (
                <span className="err" id="rq-email-err">
                  {rqEmailFree ? "Use your company email, not a personal address." : "Enter a valid work email."}
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
            <button type="submit" className="btn btn-p" style={BTN_BIG}>
              Send request
            </button>
            <button type="button" className="btn btn-g" onClick={backToSignin} style={{ alignSelf: "flex-start" }}>
              Back to sign in
            </button>
          </form>
        ) : null}

        {view === "requested" ? (
          <div role="status" style={FORM_STYLE}>
            <StatusIcon
              d={CHECK_D}
              tone="green"
            />
            <PublicHeading title="Request sent">
              {rqPartner?.admin}, the partner admin at {rqPartner?.name}, will review it. You get an email with a
              link to set your password once they approve.
            </PublicHeading>
            <button type="button" className="btn btn-s" onClick={backToSignin} style={{ alignSelf: "flex-start" }}>
              Back to sign in
            </button>
          </div>
        ) : null}

        {view === "nopartner" ? (
          <div role="status" style={FORM_STYLE}>
            <StatusIcon d={HELP_D} />
            <PublicHeading title="Your company is not a partner yet">
              No CleanStart partner uses {emailDomain(rq.email)}. If your company wants to sell CleanStart, apply to
              the partner program first.
            </PublicHeading>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href={ROUTES.apply} className="btn btn-p">
                Apply to become a partner
              </Link>
              <button type="button" className="btn btn-s" onClick={showRequest}>
                Use another email
              </button>
            </div>
          </div>
        ) : null}

        {view === "forgot" ? (
          <form onSubmit={sendReset} noValidate style={FORM_STYLE}>
            <PublicHeading title="Reset your password">We will email you a link to set a new password.</PublicHeading>
            <div className="fg">
              <label htmlFor="reset-email" className="lbl">
                Work email
              </label>
              <input
                id="reset-email"
                className={`field${resetTried && resetBad ? " field-err" : ""}`}
                type="email"
                autoComplete="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                aria-invalid={resetTried && resetBad ? true : undefined}
                aria-describedby="reset-err"
                // biome-ignore lint/a11y/noAutofocus: the reset step has one field and the user just asked for it
                autoFocus
              />
              {resetTried && resetBad ? (
                <span className="err" id="reset-err">
                  Enter a valid work email.
                </span>
              ) : null}
            </div>
            {resetError ? (
              <span className="err" role="alert">
                {resetError}
              </span>
            ) : null}
            <button type="submit" className="btn btn-p" style={BTN_BIG} disabled={busy}>
              Send reset link
            </button>
            <button type="button" className="btn btn-g" onClick={backToSignin} style={{ alignSelf: "flex-start" }}>
              Back to sign in
            </button>
          </form>
        ) : null}

        {view === "sent" ? (
          <div role="status" style={FORM_STYLE}>
            <StatusIcon
              d={CHECK_D}
              tone="green"
            />
            <PublicHeading title="Check your email">
              If {resetEmail} has a portal login, a reset link is on its way.
            </PublicHeading>
            <button type="button" className="btn btn-s" onClick={backToSignin} style={{ alignSelf: "flex-start" }}>
              Back to sign in
            </button>
          </div>
        ) : null}

    </PublicSplit>
  );
}
