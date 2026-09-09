import type { AttributionSubmission } from "@/lib/attribution/types";
const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

export interface DealRegistrationPerson {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface DealRegistrationConsent {
  snapshot: string;
  givenAt: string;
  categories?: string[];
}

export interface SubmitDealRegistrationInput {
  /** Spread from `useAttribution().getAttribution()`. */
  attribution?: AttributionSubmission;
  partnerName: string;
  partnerRep: DealRegistrationPerson;
  prospect: DealRegistrationPerson;
  dealDetails?: string;
  source?: string;
  consent?: DealRegistrationConsent;
  turnstileToken?: string;
  hp?: string;
}

export interface SubmitDealRegistrationResult {
  ok: boolean;
  error?: string;
}

export async function submitDealRegistration(
  input: SubmitDealRegistrationInput,
): Promise<SubmitDealRegistrationResult> {
  try {
    const res = await fetch(`${CMS_URL}/api/deal-registrations/apply`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...input,
        hp: input.hp ?? "",
        ...(input.attribution?.utm ? { utm: input.attribution.utm } : {}),
        ...(input.attribution?.attribution ? { attribution: input.attribution.attribution } : {}),
      }),
    });
    const json = (await res.json().catch(() => null)) as SubmitDealRegistrationResult | null;
    if (!res.ok || !json?.ok) {
      return { ok: false, error: json?.error ?? "submit_failed" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "network_error" };
  }
}
