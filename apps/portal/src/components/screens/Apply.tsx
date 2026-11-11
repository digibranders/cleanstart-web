"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NumberedSteps, PublicHeading, PublicSplit } from "@/components/partners/public-frame";
import { Seg } from "@/components/partners/seg";
import { useToast } from "@/components/ui/toast";
import {
  CATEGORIES,
  emailDomain,
  findPartnerByDomain,
  isFreeEmail,
  isValidEmail,
  normaliseDomain,
  type PartnerCategory,
  type PartnerRegion,
  partnersSlice,
  submitApplication,
} from "@/data/partners";
import { ROUTES } from "@/lib/routes";

const REGIONS: readonly PartnerRegion[] = ["India", "Middle East", "Elsewhere"];

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
  category: PartnerCategory;
  region: PartnerRegion;
  how: string;
}

// Sample applicant from the board, so a reviewer can submit without typing.
// Re-applying with this email refreshes the open Tidewater Infosec application instead of adding a second one.
const SAMPLE: Fields = {
  company: "Tidewater Infosec",
  site: "tidewaterinfosec.in",
  name: "Neha Joshi",
  title: "CTO",
  email: "neha.joshi@tidewaterinfosec.in",
  phone: "+91 98200 41377",
  category: "Channel partner",
  region: "India",
  how: "We resell security tooling to mid-size banks and NBFCs in Pune and Mumbai, and customers are asking for hardened base images. Team of 18, 6 in pre-sales.",
};

function ErrorText({ id, children }: { id: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <span className="err" id={id}>
      {children}
    </span>
  );
}

export function Apply(): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const { partners } = partnersSlice.use();
  const [f, setF] = useState<Fields>(SAMPLE);
  const [tried, setTried] = useState(false);
  const set = <K extends keyof Fields>(key: K, value: Fields[K]): void => setF((prev) => ({ ...prev, [key]: value }));

  const emailValid = isValidEmail(f.email);
  const domain = emailDomain(f.email);
  const free = isFreeEmail(f.email);
  const existing = findPartnerByDomain(partners, domain);
  const siteDomain = normaliseDomain(f.site);

  const companyErr = tried && !f.company.trim();
  const nameErr = tried && !f.name.trim();
  const emailErr = (tried && (!emailValid || free)) || (emailValid && free);
  const howErr = tried && !f.how.trim();
  const domainMismatch = emailValid && !free && !existing && siteDomain !== "" && siteDomain !== domain;

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    setTried(true);
    if (!f.company.trim() || !f.name.trim() || !emailValid || free || !f.how.trim()) return;
    if (existing) {
      toast(`${existing.name} is already a partner. Request access instead.`);
      router.push(`${ROUTES.signIn}?request=1`);
      return;
    }
    submitApplication({
      company: f.company,
      website: f.site,
      applicant: f.name,
      role: f.title,
      email: f.email,
      phone: f.phone,
      category: f.category,
      region: f.region,
      reason: f.how,
    });
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
                {free ? "Use your company email, not a personal address." : "Enter a valid work email."}
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
        {existing ? (
          <div className="note note-violet" role="status">
            <span>
              <b>{existing.name} is already a CleanStart partner.</b> You do not need to apply.{" "}
              <Link href={`${ROUTES.signIn}?request=1`} style={{ fontWeight: 600 }}>
                Request access
              </Link>{" "}
              and {existing.admin}, their partner admin, can let you in.
            </span>
          </div>
        ) : null}
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
            <Seg options={CATEGORIES} value={f.category} onChange={(v) => set("category", v)} labelledBy="ap-cat" />
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="submit" className="btn btn-p" style={{ height: 38, fontSize: 13.5, padding: "0 16px" }}>
            Submit application
          </button>
          <span className="hint">Takes about 3 minutes.</span>
        </div>
      </form>
    </PublicSplit>
  );
}
