import type { ThankYouType } from "./types";

export interface ThankYouCta {
  label: string;
  href: string;
}

export interface ThankYouContent {
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
    headline: "Your demo request is in",
    body: "One of our solutions specialists will reach out to arrange a time.",
    whatHappensNext:
      "Check your inbox for a confirmation. Reply to it with anything you want the demo to cover: your base images, the CVEs you are dealing with, or an audit you are preparing for.",
    primary: { label: "See how our images are built", href: "/cleanstart-images" },
    secondary: { label: "Browse the resource center", href: "/resource-center" },
    metaTitle: "Demo requested",
    metaDescription: "Your CleanStart demo request has been received.",
  },
  contact: {
    headline: "Thanks, we have your message",
    body: "It has gone to the team who can answer it.",
    whatHappensNext:
      "Check your inbox for a confirmation. If your message is urgent, reply to it and it reaches the team directly.",
    primary: { label: "Browse the resource center", href: "/resource-center" },
    secondary: { label: "Read the blog", href: "/blogs" },
    metaTitle: "Message sent",
    metaDescription: "Your message to CleanStart has been received.",
  },
  "deal-registration": {
    headline: "Your deal registration is logged",
    body: "The partnerships team has it, along with the prospect details you entered.",
    whatHappensNext:
      "Check your inbox for a confirmation. The partner team reviews the registration and confirms next steps with you.",
    primary: { label: "Partner resources", href: "/partners" },
    secondary: { label: "Browse the resource center", href: "/resource-center" },
    metaTitle: "Deal registered",
    metaDescription: "Your CleanStart deal registration has been received.",
  },
  "job-application": {
    headline: "Thanks for applying",
    body: "Your application and CV are with the hiring team.",
    whatHappensNext:
      "Every application is reviewed. If your experience lines up with what the role needs, we will be in touch to arrange a first conversation.",
    primary: { label: "See all open roles", href: "/careers" },
    secondary: { label: "How we work", href: "/teams" },
    metaTitle: "Application received",
    metaDescription: "Your application to CleanStart has been received.",
  },
} satisfies Record<ThankYouType, ThankYouContent>;
