"use client";

import { useRef, useState } from "react";

import { useAttribution } from "@/components/attribution/AttributionProvider";
import { LeadConsent } from "@/components/forms/LeadConsent";
import { StatusBanner, useFormStatus } from "@/components/forms/StatusBanner";
import { TextField } from "@/components/forms/TextField";
import { SubmitButton } from "@/components/sections/forms/FormCard";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { trackEvent } from "@/lib/analytics/track";
import { emailError, issuesToErrors, optionalText, requiredText } from "@/lib/forms/validate";
import { type LeadDownload, submitLead } from "@/lib/leads/submitLead";

/**
 * GA4 form name for every gated download, whichever CMS form the resource is
 * gated behind. Assets that need their own HubSpot form and campaign get their
 * own CMS form, so the id varies per resource; reporting stays on one name and
 * separates assets by `resource_title` on the download event.
 */
const GATE_FORM_EVENT_NAME = "content-gated";

/**
 * Keys are the field names on the gated-download CMS form, values the inputs
 * below. The API re-validates every submission against that stored definition,
 * so it is the contract: add or rename a field there and this form has to
 * change with it, or every gated download is rejected.
 */
const FIELD_BY_API_NAME = {
  firstname: "firstName",
  lastname: "lastName",
  email: "email",
  company: "company",
  consent: "consent",
} as const satisfies Record<string, string>;

type FieldKey = (typeof FIELD_BY_API_NAME)[keyof typeof FIELD_BY_API_NAME];
type Errors = Partial<Record<FieldKey, string>>;

const FIELD_ORDER: readonly FieldKey[] = ["firstName", "lastName", "email", "company", "consent"];

const STORAGE_CONSENT_TEXT =
  "I agree to allow CleanStart to store and process my personal data.";

const CONSENT_REQUIRED = "Please agree to the Privacy Policy to download.";

interface GatedDownloadFormProps {
  resourceId: string | number;
  /**
   * The resource's own gate form. Passed as an id because the forms
   * collection is admin-only to read, so the public API serialises the
   * relationship as a bare id and the slug never reaches the browser.
   */
  gateFormId: number;
  /** Called once the API has captured the lead and signed a download link. */
  onUnlocked: (download: LeadDownload) => void;
}

/**
 * The form behind a gated resource download.
 *
 * Built as a coded form, like Book a Demo and Contact, rather than rendered
 * from the CMS definition. That definition is readable only by admins and
 * editors, so the public page could never load it, and the gate silently fell
 * back to an open link.
 */
export function GatedDownloadForm({
  resourceId,
  gateFormId,
  onUnlocked,
}: GatedDownloadFormProps): React.ReactElement {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const { status, setStatus, statusRef } = useFormStatus();
  const inFlightRef = useRef(false);
  const { getAttribution } = useAttribution();

  const setError = (field: FieldKey, message: string | null): void =>
    setErrors((prev) => {
      if (message) return { ...prev, [field]: message };
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });

  const validateInputs = (): Errors => {
    const next: Errors = {};
    const first = requiredText(firstName, "First name", { min: 2, max: 50 });
    if (first) next.firstName = first;
    const last = optionalText(lastName, "Last name", { max: 50 });
    if (last) next.lastName = last;
    // A gated download is one of the places a personal address is legitimate.
    const mail = emailError(email, { requireBusiness: false });
    if (mail) next.email = mail;
    const org = requiredText(company, "Company", { max: 100 });
    if (org) next.company = org;
    return next;
  };

  const focusFirst = (found: Errors): void => {
    const first = FIELD_ORDER.find((key) => found[key]);
    if (!first) return;
    const id = first === "consent" ? "gate-consent-error" : `gate-${first}`;
    document.getElementById(id)?.focus();
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (inFlightRef.current) return;
    setStatus(null);

    const form = event.currentTarget;
    const fd = new FormData(form);
    const consented = fd.get("consent_storage") != null;

    const found = validateInputs();
    if (!consented) found.consent = CONSENT_REQUIRED;
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirst(found);
      return;
    }

    inFlightRef.current = true;
    setSubmitting(true);

    const turnstileToken = fd.get("cf-turnstile-response");
    const categories = ["storage", ...(fd.get("consent_marketing") != null ? ["marketing"] : [])];

    const result = await submitLead({
      formId: gateFormId,
      fields: {
        firstname: firstName.trim(),
        ...(lastName.trim() ? { lastname: lastName.trim() } : {}),
        email: email.trim().toLowerCase(),
        company: company.trim(),
        // The API checks a required consent field as `=== true`; the HubSpot
        // relay drops non-string fields, so this never reaches the CRM form.
        consent: true,
      },
      consent: {
        snapshot: STORAGE_CONSENT_TEXT,
        givenAt: new Date().toISOString(),
        categories,
      },
      context: { resourceId },
      ...(typeof turnstileToken === "string" ? { turnstileToken } : {}),
      ...(typeof window !== "undefined" ? { source: window.location.href } : {}),
      attribution: getAttribution(),
    });

    if (result.ok && result.download) {
      trackEvent("generate_lead", { form_name: GATE_FORM_EVENT_NAME, gated: true });
      // Left busy on purpose: the modal is about to close and start the
      // download, and re-enabling the button would allow a second submit.
      onUnlocked(result.download);
      return;
    }

    setSubmitting(false);
    inFlightRef.current = false;

    if (result.ok) {
      // The lead was stored but no link came back, which means the resource is
      // not gated behind this form. Say so rather than closing on nothing.
      setStatus({
        tone: "error",
        title: "Download unavailable",
        message: "We saved your details but couldn't prepare the download. Please try again.",
      });
      return;
    }

    const fieldErrors = issuesToErrors(result.issues, FIELD_BY_API_NAME) as Errors;
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      focusFirst(fieldErrors);
      return;
    }

    setStatus({
      tone: "error",
      title: "Couldn't unlock the download",
      message:
        result.error === "rate_limited"
          ? "Too many attempts. Please wait a minute and try again."
          : "Something went wrong. Please try again.",
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {status ? <StatusBanner ref={statusRef} {...status} /> : null}

      <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
        <TextField
          id="gate-firstName"
          label="First Name"
          required
          autoComplete="given-name"
          maxLength={50}
          value={firstName}
          onChange={setFirstName}
          onBlur={() =>
            setError("firstName", firstName.trim() ? requiredText(firstName, "First name", { min: 2, max: 50 }) : null)
          }
          error={errors.firstName}
        />
        <TextField
          id="gate-lastName"
          label="Last Name"
          autoComplete="family-name"
          maxLength={50}
          value={lastName}
          onChange={setLastName}
          onBlur={() => setError("lastName", optionalText(lastName, "Last name", { max: 50 }))}
          error={errors.lastName}
        />
      </div>

      <TextField
        id="gate-email"
        type="email"
        label="Email"
        required
        autoComplete="email"
        maxLength={254}
        value={email}
        onChange={setEmail}
        onBlur={() =>
          setError("email", email.trim() ? emailError(email, { requireBusiness: false }) : null)
        }
        error={errors.email}
      />

      <TextField
        id="gate-company"
        label="Company"
        required
        autoComplete="organization"
        maxLength={100}
        value={company}
        onChange={setCompany}
        onBlur={() =>
          setError("company", company.trim() ? requiredText(company, "Company", { max: 100 }) : null)
        }
        error={errors.company}
      />

      <div
        onChange={(e) => {
          const target = e.target as HTMLInputElement;
          if (target.name === "consent_storage" && target.checked) setError("consent", null);
        }}
      >
        <LeadConsent />
        {errors.consent ? (
          <p
            id="gate-consent-error"
            tabIndex={-1}
            role="alert"
            className="mt-1.5 outline-none"
            style={{ color: "#D14343", fontSize: "var(--fs-caption)", lineHeight: 1.4 }}
          >
            {errors.consent}
          </p>
        ) : null}
      </div>

      <TurnstileWidget />

      <SubmitButton busy={submitting} busyLabel="Unlocking…">
        Download
      </SubmitButton>
    </form>
  );
}
