"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { NumberedSteps, PublicHeading, PublicSplit } from "@/components/partners/public-frame";
import { Dialog } from "@/components/ui/overlay";
import { PasswordField, PasswordRules, passwordRules } from "@/components/ui/password-field";
import { useToast } from "@/components/ui/toast";
import { PARTNER_ROLE_LABEL, STAFF_ROLE_LABEL } from "@/lib/domain";
import type { InvitePreviewDto, InviteState } from "@/lib/dto";
import { nameFromEmail } from "@/lib/people";
import { ROUTES } from "@/lib/routes";
import { acceptInviteAction } from "@/server/actions/invites";
import { issuesToErrors } from "@/server/actions/result";

const AGREEMENT_TEXT =
  "The agreement text from CleanStart legal goes here. The portal stores the version you accept and when you accepted it.";

const ADMIN_STEPS = [
  { title: "Set your password and accept the agreement", text: "You are doing this now." },
  { title: "Add your company details", text: "Address, website and what you sell." },
  { title: "Invite your colleagues", text: "Sales and technical people get their own login." },
  { title: "Kickoff call with your partner manager", text: "Your CleanStart partner manager will be in touch." },
] as const;

const OTHER_STEPS = [
  { title: "Set your password", text: "You are doing this now." },
  { title: "Sign in", text: "You are signed in as soon as you finish here." },
] as const;

const PROBLEMS: Record<Exclude<InviteState, "ok">, { title: string; text: string }> = {
  expired: {
    title: "This invite has expired",
    text: "Invites are valid for 7 days. Ask your partner admin or CleanStart partner manager to send a new one.",
  },
  used: {
    title: "This invite was already used",
    text: "The account is set up. Sign in with the password you chose, or use Forgot password on the sign-in page.",
  },
  revoked: {
    title: "This invite was withdrawn",
    text: "The person who invited you cancelled it. Ask them to send a new one.",
  },
  unknown: {
    title: "This invite link is not valid",
    text: "Check that you copied the whole link from the email. If it still fails, ask for a new invite.",
  },
};

const FILE_D =
  "M212.24,83.76l-56-56A6,6,0,0,0,152,26H56A14,14,0,0,0,42,40V216a14,14,0,0,0,14,14H200a14,14,0,0,0,14-14V88A6,6,0,0,0,212.24,83.76ZM158,46.48,193.52,82H158ZM200,218H56a2,2,0,0,1-2-2V40a2,2,0,0,1,2-2h90V88a6,6,0,0,0,6,6h50V216A2,2,0,0,1,200,218Zm-34-82a6,6,0,0,1-6,6H96a6,6,0,0,1,0-12h64A6,6,0,0,1,166,136Zm0,32a6,6,0,0,1-6,6H96a6,6,0,0,1,0-12h64A6,6,0,0,1,166,168Z";

/** The page shown when the link cannot be used: one message per reason, so nobody has to guess. */
function InviteProblem({ state }: { state: Exclude<InviteState, "ok"> }): React.JSX.Element {
  const problem = PROBLEMS[state];
  return (
    <PublicSplit
      label="Accept invite"
      tag="Partner Portal"
      footerLeft="CleanStart Partner Portal"
      asideLabel="About the portal"
      aside={
        <div style={{ maxWidth: 420, alignSelf: "center", display: "flex", flexDirection: "column", gap: 18 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            The CleanStart Partner Portal
          </h2>
          <NumberedSteps items={ADMIN_STEPS} />
        </div>
      }
    >
      <div role="status" style={{ width: "100%", maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <PublicHeading title={problem.title}>{problem.text}</PublicHeading>
        <a href={ROUTES.signIn} className="btn btn-s" style={{ alignSelf: "flex-start" }}>
          Go to sign in
        </a>
      </div>
    </PublicSplit>
  );
}

export function AcceptInvite({ token, preview }: { token: string; preview: InvitePreviewDto }): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(preview.name ?? nameFromEmail(preview.email ?? ""));
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [tried, setTried] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (preview.state !== "ok") return <InviteProblem state={preview.state} />;

  const needsAgreement = preview.needsAgreement === true;
  const email = preview.email ?? "";
  const partnerName = preview.partnerName ?? "CleanStart";
  const version = preview.agreementVersion ?? "";
  const roleLabel =
    preview.kind === "staff"
      ? STAFF_ROLE_LABEL[preview.role as keyof typeof STAFF_ROLE_LABEL]
      : PARTNER_ROLE_LABEL[preview.role as keyof typeof PARTNER_ROLE_LABEL];

  const weak = passwordRules(pw).some((rule) => !rule.met);
  const mismatch = !weak && pw !== pw2;
  const nameBad = !name.trim();
  const pwErr = tried && weak;
  const pw2Err = tried && mismatch;
  const agreeErr = tried && needsAgreement && !agreed;

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    if (weak || mismatch || (needsAgreement && !agreed) || nameBad) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await acceptInviteAction({ token, name, password: pw, confirmPassword: pw2, acceptAgreement: agreed });
    setBusy(false);
    if (!result.ok) {
      const inline = issuesToErrors(result.error);
      setFormError(inline.password ?? inline.name ?? inline.acceptAgreement ?? result.error.message);
      return;
    }
    const first = name.trim().split(" ")[0] ?? name.trim();
    toast(
      result.data.signedIn
        ? `You are set up, ${first}.${needsAgreement ? ` Agreement version ${version} accepted.` : ""}`
        : `You are set up, ${first}. Sign in with your new password.`,
    );
    router.push(result.data.redirectTo);
  };

  return (
    <PublicSplit
      label="Accept invite"
      tag="Partner Portal"
      footerLeft="CleanStart Partner Portal"
      asideLabel="What happens next"
      aside={
        <div style={{ maxWidth: 420, alignSelf: "center", display: "flex", flexDirection: "column", gap: 18 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            {needsAgreement ? "Your first week as a CleanStart partner" : "You are almost in"}
          </h2>
          <NumberedSteps items={needsAgreement ? ADMIN_STEPS : OTHER_STEPS} current={0} />
        </div>
      }
    >
      <form
        onSubmit={submit}
        noValidate
        data-tour="invite-form"
        style={{ width: "100%", maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}
      >
        <PublicHeading title="Set up your account">
          {needsAgreement
            ? `${partnerName} is now a CleanStart partner. You will be its partner admin.`
            : preview.kind === "staff"
              ? `You have been invited to the CleanStart partner admin as ${roleLabel.toLowerCase()}.`
              : `You have been invited to join ${partnerName} as ${roleLabel.toLowerCase()}.`}
        </PublicHeading>
        <div className="fg">
          <label htmlFor="name" className="lbl">
            Full name
          </label>
          <input
            id="name"
            className={`field${tried && nameBad ? " field-err" : ""}`}
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={tried && nameBad ? true : undefined}
            aria-describedby={tried && nameBad ? "name-err" : undefined}
          />
          {tried && nameBad ? (
            <span className="err" id="name-err">
              Enter your name.
            </span>
          ) : null}
        </div>
        <div className="fg">
          <label htmlFor="email" className="lbl">
            Work email
          </label>
          <input
            id="email"
            className="field"
            type="email"
            value={email}
            readOnly
            aria-describedby="email-hint"
            style={{ background: "#FAFAFB", color: "#4A4858" }}
          />
          <span id="email-hint" className="hint">
            You sign in with this address.
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <PasswordField
            label="Password"
            value={pw}
            onChange={setPw}
            {...(pwErr ? { error: "Choose a password that meets every rule below." } : {})}
          />
          <div data-tour="invite-rules" role="group" aria-label="Password rules">
            <PasswordRules value={pw} />
          </div>
        </div>
        <PasswordField
          label="Confirm password"
          value={pw2}
          onChange={setPw2}
          {...(pw2Err ? { error: "The passwords do not match." } : {})}
        />
        {needsAgreement ? (
        <div className="fg">
          <span className="lbl">Partner agreement</span>
          <div style={{ border: "1px solid #E2E0E8", borderRadius: 8, overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                background: "#FCFCFD",
                borderBottom: "1px solid #F0EFF4",
              }}
            >
              <span className="li-ic tone-violet">
                <Icon d={FILE_D} />
              </span>
              <span className="li-t">
                <span className="li-n">CleanStart partner agreement</span>
                <span className="li-s">Version {version}</span>
              </span>
              <button
                type="button"
                className="linkbtn link-sm"
                onClick={() => setAgreementOpen(true)}
                style={{ marginLeft: "auto", fontSize: 12.5, color: "#4B23C8" }}
              >
                Read agreement
              </button>
            </div>
            <p style={{ margin: 0, padding: 10, fontSize: 12.5, lineHeight: 1.55, color: "#6B687D" }}>
              {AGREEMENT_TEXT}
            </p>
          </div>
          <label
            style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#2A2838", marginTop: 4 }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              aria-invalid={agreeErr ? true : undefined}
              aria-describedby={agreeErr ? "agree-err" : undefined}
              style={{ width: 14, height: 14, margin: "2px 0 0", accentColor: "#4B23C8" }}
            />
            I accept the partner agreement on behalf of {partnerName}.
          </label>
          {agreeErr ? (
            <span className="err" id="agree-err">
              Accept the agreement to continue.
            </span>
          ) : null}
        </div>
        ) : null}
        {formError ? (
          <span className="err" role="alert">
            {formError}
          </span>
        ) : null}
        <button type="submit" className="btn btn-p" style={{ height: 38, fontSize: 13.5 }} disabled={busy}>
          Accept and continue
        </button>
      </form>
      {needsAgreement ? (
      <Dialog
        open={agreementOpen}
        onClose={() => setAgreementOpen(false)}
        title="CleanStart partner agreement"
        subtitle={`Version ${version}`}
        footer={
          <>
            <button type="button" className="btn btn-s" onClick={() => setAgreementOpen(false)}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-p"
              onClick={() => {
                setAgreementOpen(false);
                setAgreed(true);
              }}
            >
              I accept
            </button>
          </>
        }
      >
        <div
          style={{
            minHeight: 220,
            padding: 16,
            border: "1px dashed #D9D5E6",
            borderRadius: 8,
            background: "#FCFCFD",
            fontSize: 13,
            lineHeight: 1.6,
            color: "#6B687D",
          }}
        >
          The agreement text from CleanStart legal goes here. Partners read it in full before they accept, and the
          portal stores the version and the time of acceptance.
        </div>
      </Dialog>
      ) : null}
    </PublicSplit>
  );
}
