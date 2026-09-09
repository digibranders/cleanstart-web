import type { ThankYouType } from "./types";

export interface ThankYouCta {
  label: string;
  href: string;
}

export interface ThankYouContent {
  eyebrow: string;
  headline: string;
  body: string;
  /** What we will do next, so the visitor knows whether to wait or act. */
  whatHappensNext: string;
  primary: ThankYouCta;
  secondary: ThankYouCta;
  metaTitle: string;
  metaDescription: string;
}

/**
 * Per-form copy, held in code rather than the CMS.
 *
 * The `forms` collection was the obvious home and is the wrong one: it backs
 * only two of these four forms (partner, deal registration and careers post to
 * their own endpoints), and its read access is admin-only, so a CMS-driven page
 * would put an authenticated fetch in front of the highest-value page on the
 * site and render empty if the CMS were slow or down. Five strings that change
 * roughly never do not justify that.
 *
 * The job-application entry is deliberately generic. The inline banner it
 * replaces named the role, and a static page cannot; carrying the title in a
 * query parameter would fragment the conversion URL that is the point of the
 * feature.
 */
export const THANK_YOU_CONTENT = {
  "book-a-demo": {
    eyebrow: "Demo requested",
    headline: "Your demo request is in",
    body: "A solutions engineer will read what you sent and come back to you directly, usually within one business day.",
    whatHappensNext:
      "You will get an email from a real person, not an autoresponder sequence. If your timeline is tight, say so in the reply and we will work to it.",
    primary: { label: "See how images are hardened", href: "/clean-images" },
    secondary: { label: "Read the SBOM guide", href: "/resource-center" },
    metaTitle: "Demo requested",
    metaDescription: "Your CleanStart demo request has been received.",
  },
  contact: {
    eyebrow: "Message sent",
    headline: "Thanks, we have your message",
    body: "It has gone to the team who can actually answer it, rather than a shared inbox nobody owns.",
    whatHappensNext:
      "Expect a reply from a named person. If it turns out someone else is better placed to help, we will introduce you rather than forward you.",
    primary: { label: "Browse the knowledge hub", href: "/knowledge-hub" },
    secondary: { label: "See open roles", href: "/careers" },
    metaTitle: "Message sent",
    metaDescription: "Your message to CleanStart has been received.",
  },
  "deal-registration": {
    eyebrow: "Deal registered",
    headline: "Your deal registration is logged",
    body: "The partnerships team has it, along with the prospect details you entered.",
    whatHappensNext:
      "We will confirm registration and come back on deal protection within one business day. Nothing is contacted on your prospect's side until you tell us to.",
    primary: { label: "Partner resources", href: "/partners" },
    secondary: { label: "Compare against alternatives", href: "/compare" },
    metaTitle: "Deal registered",
    metaDescription: "Your CleanStart deal registration has been received.",
  },
  "job-application": {
    eyebrow: "Application received",
    headline: "Thanks for applying",
    body: "Your application and CV are with the hiring team. Every one is read by a person.",
    whatHappensNext:
      "If there is a fit you will hear from us with next steps. If there is not, you will still hear back rather than being left wondering.",
    primary: { label: "See all open roles", href: "/careers" },
    secondary: { label: "How we work", href: "/teams" },
    metaTitle: "Application received",
    metaDescription: "Your application to CleanStart has been received.",
  },
} satisfies Record<ThankYouType, ThankYouContent>;
