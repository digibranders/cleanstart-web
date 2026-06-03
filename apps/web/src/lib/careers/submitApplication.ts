/**
 * Client helper for relaying a job application to the CMS
 * `/api/career-applications/apply` endpoint. Unlike `submitLead`, applications
 * carry a resume file, so the payload is sent as `multipart/form-data`: the
 * resume is a real file part and every other field is a string part (consent
 * is JSON-encoded).
 *
 * No PII is ever sent to a third party from the browser — only to the CMS,
 * which owns the downstream relay and storage.
 */
const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

export interface ApplicationConsent {
  snapshot: string;
  givenAt: string;
  /** Granular consent categories ticked, e.g. ["recruitment"]. */
  categories?: string[];
}

export interface SubmitApplicationInput {
  jobSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  coverLetter?: string;
  linkedinUrl?: string;
  resume: File;
  source?: string;
  consent?: ApplicationConsent;
  /** Cloudflare Turnstile token from the widget, when the form renders one. */
  turnstileToken?: string;
  /** Honeypot value — pass the hidden input's value, normally "". */
  website?: string;
}

export type SubmitApplicationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitApplication(
  input: SubmitApplicationInput,
): Promise<SubmitApplicationResult> {
  const fd = new FormData();
  fd.set("jobSlug", input.jobSlug);
  fd.set("firstName", input.firstName);
  fd.set("lastName", input.lastName);
  fd.set("email", input.email);
  if (input.phone) fd.set("phone", input.phone);
  if (input.coverLetter) fd.set("coverLetter", input.coverLetter);
  if (input.linkedinUrl) fd.set("linkedinUrl", input.linkedinUrl);
  if (input.source) fd.set("source", input.source);
  if (input.turnstileToken) fd.set("turnstileToken", input.turnstileToken);
  if (input.website) fd.set("website", input.website);
  if (input.consent) fd.set("consent", JSON.stringify(input.consent));
  fd.set("resume", input.resume);

  let res: Response;
  try {
    res = await fetch(`${CMS_URL}/api/career-applications/apply`, {
      method: "POST",
      body: fd,
    });
  } catch {
    return { ok: false, error: "network_error" };
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    return { ok: false, error: body?.error ?? `http_${res.status}` };
  }
  return { ok: true };
}
