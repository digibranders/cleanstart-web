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
    body: "A solutions engineer is reading what you sent and will come back to you directly.",
    whatHappensNext:
      "You will hear from a named person who has read your message, not a sequence. If your timeline is tight, say so in your reply and we will plan around it.",
    primary: { label: "See how our images are built", href: "/cleanstart-images" },
    secondary: { label: "Browse the resource center", href: "/resource-center" },
    metaTitle: "Demo requested",
    metaDescription: "Your CleanStart demo request has been received.",
  },
  contact: {
    eyebrow: "Message sent",
    headline: "Thanks, we have your message",
    body: "It has gone to the team who can answer it.",
    whatHappensNext:
      "Someone from that team will reply to you directly. If a colleague is better placed to help, we will introduce you.",
    primary: { label: "Browse the resource center", href: "/resource-center" },
    secondary: { label: "Read the blog", href: "/blogs" },
    metaTitle: "Message sent",
    metaDescription: "Your message to CleanStart has been received.",
  },
  "deal-registration": {
    eyebrow: "Deal registered",
    headline: "Your deal registration is logged",
    body: "The partnerships team has it, along with the prospect details you entered.",
    whatHappensNext:
      "We will confirm the registration and come back to you on deal protection. Your prospect is not contacted until you tell us to.",
    primary: { label: "Partner resources", href: "/partners" },
    secondary: { label: "Browse the resource center", href: "/resource-center" },
    metaTitle: "Deal registered",
    metaDescription: "Your CleanStart deal registration has been received.",
  },
  "job-application": {
    eyebrow: "Application received",
    headline: "Thanks for applying",
    body: "Your application and CV are with the hiring team, and every one is read by a person.",
    whatHappensNext:
      "You will hear back either way, whether or not there is a fit. If there is, the next step is a conversation with someone on the team you would join.",
    primary: { label: "See all open roles", href: "/careers" },
    secondary: { label: "How we work", href: "/teams" },
    metaTitle: "Application received",
    metaDescription: "Your application to CleanStart has been received.",
  },
} satisfies Record<ThankYouType, ThankYouContent>;
