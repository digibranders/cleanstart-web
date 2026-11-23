import type { PartnerCategory, PartnerRegion, Product } from '@/lib/domain';
import type { ApplicationDto, PartnerListRow } from '@/lib/dto';

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
  /** "Why do you want to partner with CleanStart?" */
  reason: string;
  vendors: string[];
  /** Free text for the "Other" vendor; empty when not used. */
  vendorsOther: string;
  products: Product[];
  companySize: string;
  yearsInBusiness: string;
  verticals: string[];
  /** ISO 3166-1 alpha-2 code. */
  country: string;
  referralSource: string;
  /** The privacy policy checkbox. The server refuses anything but true. */
  consent: boolean;
  /** Cloudflare Turnstile response token, null until the widget has produced one. */
  turnstileToken: string | null;
}

/** 5 applications per IP and 3 per email address in 10 minutes. */
export const APPLY_IP_RULE = { limit: 5, windowSeconds: 600 } as const;
export const APPLY_EMAIL_RULE = { limit: 3, windowSeconds: 600 } as const;

/** What approve returns to the client. The invite token never leaves the server. */
export interface ApplicationApprovalDto {
  application: ApplicationDto;
  partner: PartnerListRow;
}

/** 20 status page lookups per IP in 10 minutes. */
export const APPLY_STATUS_IP_RULE = { limit: 20, windowSeconds: 600 } as const;
/** 5 replies per IP and 3 per link in 10 minutes. */
export const APPLY_REPLY_IP_RULE = { limit: 5, windowSeconds: 600 } as const;
export const APPLY_REPLY_TOKEN_RULE = { limit: 3, windowSeconds: 600 } as const;
/** Days after approval before the "invite not used" reminder. */
export const INVITE_REMINDER_AFTER_DAYS = 5;
/** Days an applicant's private status or reply link works. */
export const APPLICATION_LINK_TTL_DAYS = 30;
