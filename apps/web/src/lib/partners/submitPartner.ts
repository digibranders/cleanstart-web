/**
 * Client helper for relaying a "Become a Partner" inquiry to the dedicated CMS
 * `/api/partner-applications/apply` endpoint. The endpoint owns validation and
 * downstream relay — no PII is ever sent to a third party from the browser,
 * only to the CMS.
 *
 * The endpoint always responds 200 for a tripped honeypot, so callers should
 * treat `{ ok: true }` as success and surface `error` only when `ok` is false.
 */
const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

export interface PartnerConsent {
  snapshot: string;
  givenAt: string;
  /** Granular consent categories ticked, e.g. ["storage", "marketing"]. */
  categories?: string[];
}

export interface SubmitPartnerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  website?: string;
  partnerReason?: string;
  source?: string;
  consent?: PartnerConsent;
  /** Cloudflare Turnstile token from the widget, when the form renders one. */
  turnstileToken?: string;
  /** Honeypot value — pass the hidden input's value, normally "". */
  hp?: string;
}

export type SubmitPartnerResult = { ok: true } | { ok: false; error: string };

export async function submitPartner(input: SubmitPartnerInput): Promise<SubmitPartnerResult> {
  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/partner-applications/apply`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: "network_error" };
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: body?.error ?? `http_${res.status}` };
  }
  return { ok: true };
}
