/**
 * Client helper for relaying a lead-capture form submission to the CMS
 * `/api/leads/submit` endpoint. Mirrors the request shape that
 * `components/forms/FormRenderer.tsx` already sends (the CMS Zod schema in
 * `lead-handlers/payload-schema.ts` is the boundary contract): `formId`,
 * `formSchemaVersion`, a flat `fields` map (HubSpot internal names), optional
 * `source`, `consent`, Turnstile `turnstileToken`, and the `website` honeypot.
 *
 * The endpoint always responds 200 for a tripped honeypot, so callers should
 * treat `{ ok: true }` as success and surface `error` only when `ok` is false.
 */
const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

export interface LeadConsent {
  snapshot: string;
  givenAt: string;
}

export interface SubmitLeadInput {
  formId: number;
  formSchemaVersion: number;
  fields: Record<string, string>;
  source?: string;
  consent?: LeadConsent;
  /** Cloudflare Turnstile token from the widget, when the form renders one. */
  turnstileToken?: string;
  /** Honeypot value — pass the hidden input's value, normally "". */
  website?: string;
}

export interface SubmitLeadResult {
  ok: boolean;
  error?: string;
  duplicate?: boolean;
}

export async function submitLead(input: SubmitLeadInput): Promise<SubmitLeadResult> {
  try {
    const res = await fetch(`${CMS_URL}/api/leads/submit`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        formId: input.formId,
        formSchemaVersion: input.formSchemaVersion,
        fields: input.fields,
        source: input.source,
        consent: input.consent,
        turnstileToken: input.turnstileToken,
        website: input.website ?? "",
      }),
    });
    const json = (await res.json().catch(() => null)) as SubmitLeadResult | null;
    if (!res.ok || !json?.ok) {
      return { ok: false, error: json?.error ?? "submit_failed" };
    }
    return json.duplicate != null ? { ok: true, duplicate: json.duplicate } : { ok: true };
  } catch {
    return { ok: false, error: "network_error" };
  }
}
