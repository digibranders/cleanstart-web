"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NumberedSteps, PublicHeading, PublicSplit, useNarrow } from "@/components/partners/public-frame";
import { Seg } from "@/components/partners/seg";
import { TurnstileWidget } from "@/components/partners/turnstile-widget";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { COUNTRIES, findCountry } from "@/lib/deal-form";
import {
  APPLICATION_COMPANY_SIZES,
  APPLICATION_REFERRALS,
  APPLICATION_VENDORS,
  APPLICATION_VERTICALS,
  APPLICATION_YEARS,
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABEL,
  PARTNER_REGION_LABEL,
  PARTNER_REGIONS,
  PRODUCT_LABEL,
  PRODUCTS,
  type Product,
} from "@/lib/domain";
import { codeFromLabel, emailDomain, isFreeEmail, isValidEmail, normaliseDomain } from "@/lib/people";
import { ROUTES } from "@/lib/routes";
import { submitApplicationAction } from "@/server/actions/apply";
import { issuesToErrors } from "@/server/actions/result";

const CATEGORY_OPTIONS: readonly string[] = PARTNER_CATEGORIES.map((code) => PARTNER_CATEGORY_LABEL[code]);
/** Shorter labels for the segmented control on a phone, where "Channel partner" does not fit on one line. */
const SHORT_CATEGORY: Record<string, string> = {
  [PARTNER_CATEGORY_LABEL.channel]: "Channel",
};
const FULL_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(SHORT_CATEGORY).map(([full, short]) => [short, full]),
);
const SEG_SHORT_MAX = 480;
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
  vendors: string[];
  vendorsOther: string;
  products: Product[];
  companySize: string;
  years: string;
  verticals: string[];
  /** The country as typed or picked; converted to a code when the form is sent. */
  country: string;
  referral: string;
  consent: boolean;
}

const CHOOSE = "Choose one";
const OTHER_VENDOR = "Other";
const SIZE_OPTIONS: readonly string[] = [CHOOSE, ...APPLICATION_COMPANY_SIZES];
const YEARS_OPTIONS: readonly string[] = [CHOOSE, ...APPLICATION_YEARS];
const REFERRAL_OPTIONS: readonly string[] = [CHOOSE, ...APPLICATION_REFERRALS];

const toggle = <T extends string>(list: readonly T[], value: T): T[] =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

/** A row of checkbox chips. Each is a real checkbox, so the keyboard and screen readers work without extra roles. */
function CheckGroup<T extends string>({
  legend,
  hint,
  options,
  labelOf,
  value,
  onChange,
  error,
  id,
}: {
  legend: string;
  hint?: string;
  options: readonly T[];
  labelOf: (option: T) => string;
  value: readonly T[];
  onChange: (next: T[]) => void;
  error?: string | false;
  id: string;
}): React.JSX.Element {
  return (
    <fieldset className="fg" style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }} aria-describedby={`${id}-msg`}>
      <legend className="lbl" style={{ padding: 0 }}>
        {legend}
      </legend>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((option) => (
          <label
            key={option}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              minHeight: 32,
              padding: "0 10px",
              borderRadius: 7,
              border: `1px solid ${value.includes(option) ? "#4B23C8" : "#DCDAE4"}`,
              background: value.includes(option) ? "#F4F1FD" : "#FFFFFF",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={value.includes(option)}
              onChange={() => onChange(toggle(value, option))}
              style={{ width: 14, height: 14, margin: 0, accentColor: "#4B23C8" }}
            />
            {labelOf(option)}
          </label>
        ))}
      </div>
      {error ? (
        <span className="err" id={`${id}-msg`}>
          {error}
        </span>
      ) : hint ? (
        <span className="hint" id={`${id}-msg`}>
          {hint}
        </span>
      ) : (
        <span id={`${id}-msg`} />
      )}
    </fieldset>
  );
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
  vendors: [],
  vendorsOther: "",
  products: [],
  companySize: CHOOSE,
  years: CHOOSE,
  verticals: [],
  country: "",
  referral: CHOOSE,
  consent: false,
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
  const narrow = useNarrow(SEG_SHORT_MAX);
  const shown = (label: string): string => (narrow ? (SHORT_CATEGORY[label] ?? label) : label);
  const set = <K extends keyof Fields>(key: K, value: Fields[K]): void => setF((prev) => ({ ...prev, [key]: value }));

  const emailValid = isValidEmail(f.email);
  const domain = emailDomain(f.email);
  const free = isFreeEmail(f.email);
  const siteDomain = normaliseDomain(f.site);

  const companyErr = tried && !f.company.trim();
  const nameErr = tried && !f.name.trim();
  const emailErr = (tried && (!emailValid || free)) || (emailValid && free) || serverErrors.email !== undefined;
  const howErr = tried && !f.how.trim();
  const productsErr = tried && f.products.length === 0;
  const sizeErr = tried && f.companySize === CHOOSE;
  const yearsErr = tried && f.years === CHOOSE;
  const referralErr = tried && f.referral === CHOOSE;
  const country = findCountry(f.country);
  const countryErr = tried && !country;
  const consentErr = tried && !f.consent;
  const domainMismatch = emailValid && !free && siteDomain !== "" && siteDomain !== domain;

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setTried(true);
    setFormError(null);
    if (
      !f.company.trim() ||
      !f.name.trim() ||
      !emailValid ||
      free ||
      !f.how.trim() ||
      f.products.length === 0 ||
      f.companySize === CHOOSE ||
      f.years === CHOOSE ||
      f.referral === CHOOSE ||
      !country ||
      !f.consent
    )
      return;
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
      vendors: f.vendors.filter((v) => v !== OTHER_VENDOR),
      vendorsOther: f.vendors.includes(OTHER_VENDOR) ? f.vendorsOther.trim() : "",
      products: f.products,
      companySize: f.companySize,
      yearsInBusiness: f.years,
      verticals: f.verticals,
      country: country.code,
      referralSource: f.referral,
      consent: f.consent,
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
              Company website <span className="hint">(optional)</span>
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
              Job title <span className="hint">(optional)</span>
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
          <div className="fg">
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
            <Seg
              options={CATEGORY_OPTIONS.map(shown)}
              value={shown(f.category)}
              onChange={(v) => set("category", FULL_CATEGORY[v] ?? v)}
              labelledBy="ap-cat"
            />
          </div>
          <div className="fg">
            <span id="ap-reg" className="lbl">
              Where you sell
            </span>
            <Seg options={REGIONS} value={f.region} onChange={(v) => set("region", v)} labelledBy="ap-reg" />
          </div>
        </div>
        <div className="grid2" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <div className="fg">
            <label htmlFor="ap-country" className="lbl">
              Country
            </label>
            <input
              id="ap-country"
              className={`field${countryErr ? " field-err" : ""}`}
              type="text"
              list="ap-countries"
              autoComplete="off"
              placeholder="Start typing to search"
              value={f.country}
              onChange={(e) => set("country", e.target.value)}
              onBlur={() => {
                if (country && country.name !== f.country) set("country", country.name);
              }}
              aria-invalid={countryErr ? true : undefined}
              aria-describedby="ap-country-err"
            />
            <datalist id="ap-countries">
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name} />
              ))}
            </datalist>
            {countryErr ? <ErrorText id="ap-country-err">Pick a country from the list.</ErrorText> : null}
          </div>
          <div className="fg">
            <span id="ap-size" className="lbl">
              Company size
            </span>
            <Dropdown variant="field" ariaLabel="Company size" value={f.companySize} options={SIZE_OPTIONS} onChange={(v) => set("companySize", v)} invalid={sizeErr} />
            {sizeErr ? <ErrorText id="ap-size-err">Choose your company size.</ErrorText> : null}
          </div>
          <div className="fg">
            <span id="ap-years" className="lbl">
              Years in business
            </span>
            <Dropdown variant="field" ariaLabel="Years in business" value={f.years} options={YEARS_OPTIONS} onChange={(v) => set("years", v)} invalid={yearsErr} />
            {yearsErr ? <ErrorText id="ap-years-err">Choose how long you have been in business.</ErrorText> : null}
          </div>
          <div className="fg">
            <span id="ap-ref" className="lbl">
              How did you hear about us?
            </span>
            <Dropdown variant="field" ariaLabel="How did you hear about us" value={f.referral} options={REFERRAL_OPTIONS} onChange={(v) => set("referral", v)} invalid={referralErr} />
            {referralErr ? <ErrorText id="ap-ref-err">Tell us how you heard about us.</ErrorText> : null}
          </div>
        </div>
        <CheckGroup
          id="ap-products"
          legend="CleanStart products you are interested in"
          options={PRODUCTS}
          labelOf={(p) => PRODUCT_LABEL[p]}
          value={f.products}
          onChange={(next) => set("products", next)}
          error={productsErr && "Pick at least one product."}
        />
        <CheckGroup
          id="ap-vendors"
          legend="Security vendors you resell or support today"
          hint="Optional. Pick all that apply."
          options={[...APPLICATION_VENDORS, OTHER_VENDOR]}
          labelOf={(v) => v}
          value={f.vendors}
          onChange={(next) => set("vendors", next)}
        />
        {f.vendors.includes(OTHER_VENDOR) ? (
          <div className="fg">
            <label htmlFor="ap-vendors-other" className="lbl">
              Other vendors
            </label>
            <input
              id="ap-vendors-other"
              className="field"
              type="text"
              maxLength={100}
              value={f.vendorsOther}
              onChange={(e) => set("vendorsOther", e.target.value)}
            />
          </div>
        ) : null}
        <CheckGroup
          id="ap-verticals"
          legend="Industries you sell to"
          hint="Optional. Pick all that apply."
          options={APPLICATION_VERTICALS}
          labelOf={(v) => v}
          value={f.verticals}
          onChange={(next) => set("verticals", next)}
        />
        <div className="fg">
          <label htmlFor="ap-how" className="lbl">
            Why do you want to partner with CleanStart?
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
            <ErrorText id="ap-how-msg">Tell us why you want to partner with CleanStart.</ErrorText>
          ) : (
            <span className="hint" id="ap-how-msg">
              What you hope to sell, to whom, and what you need from us.
            </span>
          )}
        </div>
        <div className="fg">
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#2A2838" }}>
            <input
              type="checkbox"
              checked={f.consent}
              onChange={(e) => set("consent", e.target.checked)}
              aria-invalid={consentErr ? true : undefined}
              aria-describedby="ap-consent-err"
              style={{ width: 14, height: 14, margin: "2px 0 0", accentColor: "#4B23C8" }}
            />
            <span>
              I agree that CleanStart may use these details to review my application, as set out in the{" "}
              <a href="https://www.cleanstart.com/privacy-policy" target="_blank" rel="noreferrer noopener" style={{ textDecoration: "underline" }}>
                privacy policy
              </a>
              .
            </span>
          </label>
          {consentErr ? <ErrorText id="ap-consent-err">Agree to the privacy policy to apply.</ErrorText> : null}
        </div>
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
