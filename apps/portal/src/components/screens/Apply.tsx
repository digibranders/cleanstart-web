"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NumberedSteps, PublicHeading, PublicSplit } from "@/components/partners/public-frame";
import { Seg } from "@/components/partners/seg";
import { TurnstileWidget } from "@/components/partners/turnstile-widget";
import { useToast } from "@/components/ui/toast";
import { PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL, PARTNER_REGIONS } from "@/lib/domain";
import { codeFromLabel, emailDomain, isFreeEmail, isValidEmail, normaliseDomain } from "@/lib/people";
import { ROUTES } from "@/lib/routes";
import { submitApplicationAction } from "@/server/actions/apply";
import { issuesToErrors } from "@/server/actions/result";

const CATEGORY_OPTIONS: readonly string[] = PARTNER_CATEGORIES.map((code) => PARTNER_CATEGORY_LABEL[code]);
const REGIONS: readonly string[] = PARTNER_REGIONS.map((code) => PARTNER_REGION_LABEL[code]);

const STEPS = [
  { title: "Apply", text: "Tell us about your company. It takes about 3 minutes." },
  { title: "Review", text: "A partner manager reviews it and may call you." },
  { title: "Set up", text: "Accept the partner agreement and invite your team." },
  { title: "Register deals", text: "Accepted deals are protected for 90 days." },
] as const;

interface Fields {
  company: string;
  site: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  /** Display label of the selected option; converted to a code when the form is sent. */
  category: string;
  region: string;
  how: string;
}

const EMPTY: Fields = {
  company: "",
  site: "",
  name: "",
  title: "",
  email: "",
  phone: "",
  category: PARTNER_CATEGORY_LABEL.channel,
  region: PARTNER_REGION_LABEL.india,
  how: "",
};

function ErrorText({ id, children }: { id: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <span className="err" id={id}>
      {children}
    </span>
  );
}

export function Apply({ turnstileSiteKey }: { turnstileSiteKey: string }): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState<Fields>(EMPTY);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const set = <K extends keyof Fields>(key: K, value: Fields[K]): void => setF((prev) => ({ ...prev, [key]: value }));

  const emailValid = isValidEmail(f.email);
  const domain = emailDomain(f.email);
  const free = isFreeEmail(f.email);
  const siteDomain = normaliseDomain(f.site);

  const companyErr = tried && !f.company.trim();
  const nameErr = tried && !f.name.trim();
  const emailErr = (tried && (!emailValid || free)) || (emailValid && free) || serverErrors.email !== undefined;
  const howErr = tried && !f.how.trim();
  const domainMismatch = emailValid && !free && siteDomain !== "" && siteDomain !== domain;

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setTried(true);
    setFormError(null);
    if (!f.company.trim() || !f.name.trim() || !emailValid || free || !f.how.trim()) return;
    const category = codeFromLabel(PARTNER_CATEGORY_LABEL, f.category);
    const region = codeFromLabel(PARTNER_REGION_LABEL, f.region);
    if (!category || !region) return;
    setBusy(true);
    const result = await submitApplicationAction({
      company: f.company,
      website: f.site,
      name: f.name,
      title: f.title,
      email: f.email,
      phone: f.phone,
      category,
      region,
      reason: f.how,
      turnstileToken: token,
    });
    setBusy(false);
    if (!result.ok) {
      setServerErrors(issuesToErrors(result.error));
      setFormError(result.error.issues?.length ? null : result.error.message);
      setToken(null);
      setResetKey((n) => n + 1);
      return;
    }
    setServerErrors({});
    if (result.data.outcome === "existing_partner") {
      toast(`${result.data.partnerName} is already a partner. Request access instead.`);
      router.push(`${ROUTES.signIn}?request=1`);
      return;
    }
    router.push(ROUTES.applyDone);
  };

  return (
    <PublicSplit
      label="Partner application"
      basis={620}
      tag="Partner program"
      brandExtra={
        <Link href={ROUTES.signIn} className="link-sm">
          Already a partner? Sign in
        </Link>
      }
      footerLeft="CleanStart Partner Program"
      asideLabel="How the program works"
      asideBasis={420}
      aside={
        <div style={{ maxWidth: 400, alignSelf: "center", display: "flex", flexDirection: "column", gap: 18 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            From application to first protected deal
          </h2>
          <NumberedSteps items={STEPS} />
        </div>
      }
    >
      <form
        onSubmit={submit}
        noValidate
        data-tour="apply-form"
        style={{ width: "100%", maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}
      >
        <PublicHeading title="Apply to become a partner">
          A CleanStart partner manager reviews every application. If approved, you get an invite to set up your portal
          login.
        </PublicHeading>
        <div className="grid2" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <div className="fg">
            <label htmlFor="ap-company" className="lbl">
              Company name
            </label>
            <input
              id="ap-company"
              className={`field${companyErr ? " field-err" : ""}`}
              type="text"
              autoComplete="organization"
              value={f.company}
              onChange={(e) => set("company", e.target.value)}
              aria-invalid={companyErr ? true : undefined}
              aria-describedby="ap-company-err"
            />
            {companyErr ? <ErrorText id="ap-company-err">Enter your company name.</ErrorText> : null}
          </div>
          <div className="fg">
            <label htmlFor="ap-site" className="lbl">
              Company website
            </label>
            <input
              id="ap-site"
              className="field"
              type="text"
              autoComplete="url"
              value={f.site}
              onChange={(e) => set("site", e.target.value)}
            />
          </div>
          <div className="fg">
            <label htmlFor="ap-name" className="lbl">
              Your name
            </label>
            <input
              id="ap-name"
              className={`field${nameErr ? " field-err" : ""}`}
              type="text"
              autoComplete="name"
              value={f.name}
              onChange={(e) => set("name", e.target.value)}
              aria-invalid={nameErr ? true : undefined}
              aria-describedby="ap-name-err"
            />
            {nameErr ? <ErrorText id="ap-name-err">Enter your name.</ErrorText> : null}
          </div>
          <div className="fg">
            <label htmlFor="ap-title" className="lbl">
              Job title
            </label>
            <input
              id="ap-title"
              className="field"
              type="text"
              autoComplete="organization-title"
              value={f.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div className="fg" data-tour="apply-email">
            <label htmlFor="ap-email" className="lbl">
              Work email
            </label>
            <input
              id="ap-email"
              className={`field${emailErr ? " field-err" : ""}`}
              type="email"
              autoComplete="email"
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
              aria-invalid={emailErr ? true : undefined}
              aria-describedby="ap-email-msg"
            />
            {emailErr ? (
              <ErrorText id="ap-email-msg">
                {serverErrors.email ??
                  (free ? "Use your company email, not a personal address." : "Enter a valid work email.")}
              </ErrorText>
            ) : (
              <span className="hint" id="ap-email-msg">
                Use your company address. It becomes your portal login.
              </span>
            )}
          </div>
          <div className="fg">
            <label htmlFor="ap-phone" className="lbl">
              Phone <span className="hint">(optional)</span>
            </label>
            <input
              id="ap-phone"
              className="field"
              type="tel"
              autoComplete="tel"
              value={f.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
        </div>
        {domainMismatch ? (
          <div className="note note-amber" role="status">
            <span>
              Your email domain does not match the website. That is fine for a parent company; the partner manager may
              ask about it.
            </span>
          </div>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 24px" }}>
          <div className="fg">
            <span id="ap-cat" className="lbl">
              Partner type
            </span>
            <Seg options={CATEGORY_OPTIONS} value={f.category} onChange={(v) => set("category", v)} labelledBy="ap-cat" />
          </div>
          <div className="fg">
            <span id="ap-reg" className="lbl">
              Where you sell
            </span>
            <Seg options={REGIONS} value={f.region} onChange={(v) => set("region", v)} labelledBy="ap-reg" />
          </div>
        </div>
        <div className="fg">
          <label htmlFor="ap-how" className="lbl">
            How do you sell security today?
          </label>
          <textarea
            id="ap-how"
            className={`field${howErr ? " field-err" : ""}`}
            rows={4}
            value={f.how}
            onChange={(e) => set("how", e.target.value)}
            aria-invalid={howErr ? true : undefined}
            aria-describedby="ap-how-msg"
          />
          {howErr ? (
            <ErrorText id="ap-how-msg">Tell us who you sell to and what you sell today.</ErrorText>
          ) : (
            <span className="hint" id="ap-how-msg">
              Your customers, the products you resell, and the size of your team.
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: "#6B687D" }}>
          We use these details only to review your application.{" "}
          <a href="https://www.cleanstart.com/privacy-policy" target="_blank" rel="noreferrer noopener">
            Privacy policy
          </a>
        </p>
        <TurnstileWidget siteKey={turnstileSiteKey} onToken={setToken} resetKey={resetKey} />
        {serverErrors.turnstile || formError ? (
          <span className="err" role="alert">
            {serverErrors.turnstile ?? formError}
          </span>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="submit"
            className="btn btn-p"
            style={{ height: 38, fontSize: 13.5, padding: "0 16px" }}
            disabled={busy}
          >
            Submit application
          </button>
          <span className="hint">Takes about 3 minutes.</span>
        </div>
      </form>
    </PublicSplit>
  );
}
