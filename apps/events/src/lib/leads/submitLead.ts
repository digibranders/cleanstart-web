/**
 * Relays a registration to the CMS `/api/leads/submit` endpoint. The CMS Zod
 * schema in `lead-handlers/payload-schema.ts` is the contract; the endpoint
 * resolves `formSlug` to the live form, re-validates every field and answers
 * `{ ok: true }` (also for a tripped honeypot).
 */

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

export interface LeadConsent {
  snapshot: string;
  givenAt: string;
  categories?: string[];
}

export interface SubmitLeadInput {
  formSlug: string;
  fields: Record<string, string | boolean>;
  source?: string;
  consent?: LeadConsent;
  turnstileToken?: string;
  /** Honeypot value. The hidden input stays empty for humans. */
  website?: string;
}

export interface LeadFieldIssue {
  fieldName: string;
  message: string;
}

export interface SubmitLeadResult {
  ok: boolean;
  error?: string;
  duplicate?: boolean;
  issues?: LeadFieldIssue[];
}

export async function submitLead(input: SubmitLeadInput): Promise<SubmitLeadResult> {
  try {
    const res = await fetch(`${CMS_URL}/api/leads/submit`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        formSlug: input.formSlug,
        fields: input.fields,
        source: input.source,
        consent: input.consent,
        turnstileToken: input.turnstileToken,
        website: input.website ?? "",
      }),
    });
    const json = (await res.json().catch(() => null)) as SubmitLeadResult | null;
    if (!res.ok || !json?.ok) {
      return {
        ok: false,
        error: json?.error ?? "submit_failed",
        ...(json?.issues ? { issues: json.issues } : {}),
      };
    }
    return { ok: true, ...(json.duplicate != null ? { duplicate: json.duplicate } : {}) };
  } catch {
    return { ok: false, error: "network_error" };
  }
}
