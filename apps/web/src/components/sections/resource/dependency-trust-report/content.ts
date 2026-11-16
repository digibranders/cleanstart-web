/**
 * Copy for the State of Software Dependency Trust 2026 landing page, verbatim
 * from "Report LP Copy (1).docx". The figures that the page draws as pictures
 * (field of components, grid of tested versions, pair of bars) are read from
 * here, so a changed number moves the picture with it.
 */

export const HERO = {
  eyebrow: "2026 Research Report",
  title: "State of Software Dependency Trust 2026",
  subtitle: "From Dependency Management to Verified Software Foundations",
  cta: "Download the Full Report",
} as const;

export const SUMMARY = {
  heading: "Executive Summary",
  accent: "Summary",
  paragraphs: [
    "Software development increasingly depends on open-source components, third-party packages and AI-assisted dependency recommendations. But knowing what goes into an application is not the same as knowing whether it is safe to use.",
    "As software supply chains grow more complex, organizations need to move beyond vulnerability scanning towards establishing verifiable evidence of software identity, origin, provenance and integrity.",
  ],
  statement: {
    lead: "Dependency security must move beyond managing known vulnerabilities to ",
    accent: "establishing confidence in software before it is adopted.",
  },
  pillars: [
    {
      title: "Growing complexity",
      body: "Indirect dependencies and aging components make software harder to understand and maintain.",
      icon: "complexity",
    },
    {
      title: "New attack surfaces",
      body: "Compromised packages, publishing credentials and AI recommendations introduce new risks.",
      icon: "attack",
    },
    {
      title: "A need for verification",
      body: "Software identity, provenance and integrity need to be established before adoption.",
      icon: "verification",
    },
  ],
} as const;

export const GLANCE = {
  heading: "The findings at a glance",
  accent: "at a glance",
  ai: {
    value: 20,
    suffix: "%",
    label: "AI-generated dependency recommendations",
    caption: "Of tested AI-recommended dependency versions were both valid and free of known vulnerabilities.",
    legend: "Valid and free of known vulnerabilities",
  },
  components: {
    value: 1180,
    caption: "Average open-source components per application.",
    legend: "Open-source component",
  },
  age: {
    value: 68,
    suffix: "%",
    caption: "Of observed components were more than two years old.",
    legend: "More than two years old",
  },
  vulnerabilities: {
    value: 107,
    suffix: "%",
    from: 280,
    to: 581,
    caption: "Increase in the average number of vulnerabilities per audited codebase, from 280 to 581.",
  },
  more: {
    heading: "There's more to uncover.",
    body: "Explore the full report and discover what the research reveals.",
    cta: "Explore the report",
  },
} as const;

export const VOICE = {
  heading: "A shift in how we approach software security",
  accent: "software security",
  quote:
    "The challenge is no longer just identifying vulnerabilities in software. It is knowing what we are bringing into our environments, where it comes from and whether its integrity can be verified.",
  name: "Nilesh Jain",
  role: "CEO and Co-founder, CleanStart",
  photo: "/images/teams/nilesh-jain.webp",
} as const;

/** How the research was put together: a note about the whole report, not part of the quote. */
export const NOTE = {
  text: "The report synthesizes published audits, surveys, ecosystem telemetry, incident reporting and policy sources. Full references and methodological limitations are included in the report.",
  /** The source types named in the first sentence, set in heavier type. */
  sources: ["audits", "surveys", "ecosystem telemetry", "incident reporting", "policy sources"],
} as const;

export const ABOUT = {
  heading: "About CleanStart",
  body: "CleanStart is a provider of verified software artifacts for modern software supply chains. Through Clean Images, Clean Libraries and CleanSight, CleanStart helps organizations discover software assets, adopt hardened software foundations and establish verifiable evidence across the software they build, acquire and deploy.",
  products: [
    { label: "Clean Images", href: "/cleanstart-images", emblem: "/images/cleanstart-factory/emblem-images.webp" },
    { label: "Clean Libraries", href: "/clean-libraries", emblem: "/images/cleanstart-factory/emblem-libraries.webp" },
    { label: "CleanSight", href: "/cleansight", emblem: "/images/cleanstart-factory/emblem-cleansight.webp" },
  ],
} as const;
