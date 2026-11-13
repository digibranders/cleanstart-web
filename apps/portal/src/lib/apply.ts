import type { PartnerCategory, PartnerRegion } from '@/lib/domain';

/** What the apply action tells the form. 'existing_partner' means nothing was created. */
export type ApplyOutcome =
  | { outcome: 'submitted'; reference: string }
  | { outcome: 'existing_partner'; partnerName: string };

export interface ApplyFormValues {
  company: string;
  website: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  category: PartnerCategory;
  region: PartnerRegion;
  reason: string;
  /** Cloudflare Turnstile response token, null until the widget has produced one. */
  turnstileToken: string | null;
}

/** 5 applications per IP and 3 per email address in 10 minutes. */
export const APPLY_IP_RULE = { limit: 5, windowSeconds: 600 } as const;
export const APPLY_EMAIL_RULE = { limit: 3, windowSeconds: 600 } as const;
