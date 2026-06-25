"use client";

import { useMemo, useState } from "react";
import type {
  Form,
  FormField,
  FormFieldConditionRule,
} from "@/lib/forms";
import { StatusBanner, useFormStatus } from "@/components/forms/StatusBanner";
import { TurnstileWidget } from "@/components/TurnstileWidget";

export interface FormRendererSubmitResult {
  duplicate?: boolean;
  download?: { url: string; expiresAt: number };
}

export interface FormRendererContext {
  sourceUrl?: string;
  resourceId?: string | number;
}

interface FormRendererProps {
  form: Form;
  context?: FormRendererContext;
  onSuccess?: (result: FormRendererSubmitResult) => void;
  className?: string;
}

type FieldValue = string | boolean | undefined;

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

const evaluateConditions = (
  field: FormField,
  values: Record<string, FieldValue>,
): boolean => {
  const rules = field.conditions?.rules ?? [];
  if (rules.length === 0) return true;
  const mode = field.conditions?.mode ?? "all";
  const check = (rule: FormFieldConditionRule): boolean => {
    const actual = values[rule.fieldName];
    const actualStr = actual == null ? "" : String(actual);
    switch (rule.operator) {
      case "equals":
        return actualStr === rule.value;
      case "notEquals":
        return actualStr !== rule.value;
      case "contains":
        return actualStr.includes(rule.value);
      default:
        return true;
    }
  };
  return mode === "any" ? rules.some(check) : rules.every(check);
};

const validateField = (
  field: FormField,
  value: FieldValue,
): string | null => {
  const isConsentOrCheckbox = field.type === "consent" || field.type === "checkbox";
  if (field.required) {
    if (isConsentOrCheckbox) {
      if (value !== true) {
        return field.errorMessage ?? "This must be checked to continue.";
      }
    } else {
      if (typeof value !== "string" || value.trim().length === 0) {
        return field.errorMessage ?? `${field.label ?? field.name} is required.`;
      }
    }
  }
  if (typeof value === "string" && value.length > 0) {
    if (field.type === "email") {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
      if (!emailRe.test(value)) return field.errorMessage ?? "Enter a valid email address.";
    }
    const v = field.validation;
    if (v?.minLength != null && value.length < v.minLength) {
      return field.errorMessage ?? `Minimum ${v.minLength} characters.`;
    }
    if (v?.maxLength != null && value.length > v.maxLength) {
      return field.errorMessage ?? `Maximum ${v.maxLength} characters.`;
    }
    if (v?.pattern) {
      try {
        const re = new RegExp(v.pattern, "u");
        if (!re.test(value)) return field.errorMessage ?? "Doesn't match the expected format.";
      } catch {
        // Bad pattern shape — server will catch it. Skip client-side.
      }
    }
  }
  return null;
};

const fieldInputStyle: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid rgba(17, 17, 17, 0.2)",
  paddingLeft: "16px",
  paddingRight: "16px",
  color: "#111",
  outline: "none",
  background: "white",
  height: "44px",
  width: "100%",
  // 1rem (16px) — iOS Safari zooms in on focus for inputs sized below
  // 16px. Stay at ≥ 16px to avoid the zoom shift.
  fontSize: "var(--fs-input)",
};

export function FormRenderer({
  form,
  context,
  onSuccess,
  className,
}: FormRendererProps): React.ReactElement {
  const initialValues = useMemo<Record<string, FieldValue>>(() => {
    const out: Record<string, FieldValue> = {};
    for (const f of form.fields) {
      if (f.type === "checkbox" || f.type === "consent") out[f.name] = false;
      else out[f.name] = f.defaultValue ?? "";
    }
    return out;
  }, [form.fields]);

  const [values, setValues] = useState<Record<string, FieldValue>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { status, setStatus, statusRef } = useFormStatus();
  // Honeypot — never rendered visibly, but its existence is what bots fill.
  const [honeypot, setHoneypot] = useState("");
  // Cloudflare Turnstile token. Required server-side for every form except the
  // exempt low-friction slugs (newsletter, resource-capture); harmless to send
  // for those. The gate modal renders any gateForm through this component, so
  // the widget lives here rather than in each caller.
  const [turnstileToken, setTurnstileToken] = useState("");

  const visibleFields = useMemo(
    () => form.fields.filter((f) => evaluateConditions(f, values)),
    [form.fields, values],
  );

  const setValue = (name: string, v: FieldValue): void => {
    setValues((prev) => ({ ...prev, [name]: v }));
    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const buildConsentPayload = (): {
    snapshot: string;
    givenAt: string;
  } | undefined => {
    const consentField = form.fields.find((f) => f.type === "consent");
    if (!consentField) return undefined;
    if (values[consentField.name] !== true) return undefined;
    return {
      snapshot: consentField.consentText ?? consentField.label ?? "Consent given.",
      givenAt: new Date().toISOString(),
    };
  };

  const buildAnswers = (): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const f of visibleFields) {
      if (f.type === "consent") continue;
      out[f.name] = values[f.name] ?? "";
    }
    return out;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (submitting) return;
    setStatus(null);

    const nextErrors: Record<string, string> = {};
    for (const f of visibleFields) {
      const err = validateField(f, values[f.name]);
      if (err) nextErrors[f.name] = err;
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        formId: form.id,
        formSchemaVersion: form.schemaVersion,
        fields: buildAnswers(),
        source: context?.sourceUrl,
        consent: buildConsentPayload(),
        website: honeypot,
        ...(turnstileToken ? { turnstileToken } : {}),
        ...(context?.resourceId != null
          ? { context: { resourceId: context.resourceId } }
          : {}),
      };

      const res = await fetch(`${CMS_URL}/api/leads/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        duplicate?: boolean;
        download?: { url: string; expiresAt: number };
      } | null;

      if (!res.ok || !json?.ok) {
        setStatus({
          tone: "error",
          title: "Submission failed",
          message:
            json?.error === "rate_limited"
              ? "Too many submissions. Please wait a minute and try again."
              : "We couldn't submit the form. Please try again.",
        });
        return;
      }

      const successPayload: FormRendererSubmitResult = {};
      if (json.duplicate != null) successPayload.duplicate = json.duplicate;
      if (json.download) {
        successPayload.download = {
          url: json.download.url.startsWith("http")
            ? json.download.url
            : `${CMS_URL}${json.download.url}`,
          expiresAt: json.download.expiresAt,
        };
      }
      onSuccess?.(successPayload);
    } catch {
      setStatus({
        tone: "error",
        title: "Network error",
        message: "Network error. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className={className} noValidate>
      {/* Honeypot — kept off-screen, never tab-reachable */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "-10000px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label>
          Leave this empty
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      {status ? <StatusBanner ref={statusRef} {...status} /> : null}

      <div className="flex flex-col gap-4">
        {visibleFields.map((f) => {
          const id = `frm-${form.id}-${f.name}`;
          const err = errors[f.name];
          const labelEl =
            f.label && f.type !== "consent" ? (
              <label
                htmlFor={id}
                className="text-sm font-medium text-[#111]"
              >
                {f.label}
                {f.required ? <span className="text-red-600"> *</span> : null}
              </label>
            ) : null;

          const helpEl = f.helpText ? (
            <p className="text-xs text-[#555]">{f.helpText}</p>
          ) : null;

          const errorEl = err ? (
            <p className="text-xs text-red-600" role="alert">
              {err}
            </p>
          ) : null;

          if (f.type === "textarea") {
            return (
              <div key={f.name} className="flex flex-col gap-1">
                {labelEl}
                <textarea
                  id={id}
                  required={!!f.required}
                  placeholder={f.placeholder ?? undefined}
                  value={String(values[f.name] ?? "")}
                  onChange={(e) => setValue(f.name, e.target.value)}
                  style={{ ...fieldInputStyle, height: "96px", paddingTop: "10px" }}
                />
                {helpEl}
                {errorEl}
              </div>
            );
          }

          if (f.type === "select") {
            return (
              <div key={f.name} className="flex flex-col gap-1">
                {labelEl}
                <select
                  id={id}
                  required={!!f.required}
                  value={String(values[f.name] ?? "")}
                  onChange={(e) => setValue(f.name, e.target.value)}
                  style={fieldInputStyle}
                >
                  <option value="">Select…</option>
                  {(f.options ?? []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {helpEl}
                {errorEl}
              </div>
            );
          }

          if (f.type === "checkbox" || f.type === "consent") {
            const checked = values[f.name] === true;
            const labelText =
              f.type === "consent" ? f.consentText ?? f.label ?? "I agree." : f.label ?? f.name;
            return (
              <div key={f.name} className="flex items-start gap-2">
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setValue(f.name, e.target.checked)}
                  className="mt-1 shrink-0"
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "#3960f9",
                    cursor: "pointer",
                  }}
                />
                <label htmlFor={id} className="text-xs text-[#333] leading-snug">
                  {labelText}
                  {f.required ? <span className="text-red-600"> *</span> : null}
                </label>
                {errorEl}
              </div>
            );
          }

          return (
            <div key={f.name} className="flex flex-col gap-1">
              {labelEl}
              <input
                id={id}
                type={f.type === "email" ? "email" : "text"}
                required={!!f.required}
                placeholder={f.placeholder ?? undefined}
                value={String(values[f.name] ?? "")}
                onChange={(e) => setValue(f.name, e.target.value)}
                style={fieldInputStyle}
              />
              {helpEl}
              {errorEl}
            </div>
          );
        })}

        <TurnstileWidget
          onToken={setTurnstileToken}
          onExpired={() => setTurnstileToken("")}
          onError={() => setTurnstileToken("")}
        />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 font-semibold text-white"
          style={{
            background: "linear-gradient(180deg, #3960f9 0%, #1e3eb8 100%)",
            borderRadius: "8px",
            padding: "12px 24px",
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.7 : 1,
            marginTop: "4px",
            height: "48px",
          }}
        >
          {submitting ? "Submitting…" : form.submitLabel ?? "Submit"}
        </button>
      </div>
    </form>
  );
}
