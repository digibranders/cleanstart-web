/**
 * Copy for the State of Software Dependency Trust 2026 landing page, as
 * supplied in "Report LP Copy.docx". The sources and methodology panel is
 * taken from the report's own "Methodology and Research Notes" page.
 */

const ICONS = "/images/resources/dependency-trust";

export const HERO = {
  title: "State of Software Dependency Trust 2026",
  subtitle: "From Dependency Management to Verified Software Foundations",
  cta: "Download the Full Report",
} as const;

export const EXECUTIVE_SUMMARY = {
  heading: "Executive Summary",
  paragraphs: [
    "Software development increasingly depends on open-source components. These dependencies accelerate development, but they also introduce risks that are difficult to manage through conventional vulnerability scanning alone.",
    "The challenge is growing. Applications contain more components, outdated dependencies remain in circulation even when fixes are available, and malicious packages and compromised upstream releases can introduce risk without triggering a conventional vulnerability alert.",
    "AI-assisted development adds another dimension. Developers and coding assistants can now recommend and introduce dependencies at unprecedented speed, but those recommendations are not always valid or secure.",
    "The findings point to a broader challenge for software security: organizations need more than visibility into the components they use. They need evidence about what those components are, where they come from, how they were built and whether their integrity can be verified.",
  ],
  statement:
    "Dependency security must move beyond managing known vulnerabilities to establishing confidence in software before it is adopted.",
} as const;

export interface GlanceStat {
  value: number;
  suffix: string;
  caption: string;
}

export const GLANCE = {
  heading: "The findings at a glance",
  stats: {
    vulnerabilities: {
      value: 107,
      suffix: "%",
      caption:
        "Increase in average vulnerabilities per audited codebase, rising from 280 to 581.",
    },
    components: {
      value: 1180,
      suffix: "",
      caption:
        "Average number of open-source components in an application, with 64% being indirect dependencies.",
    },
    age: {
      value: 68,
      suffix: "%",
      caption: "Of observed components were more than two years old.",
    },
    malicious: {
      value: 454648,
      suffix: "",
      caption: "Newly published malicious packages recorded by Sonatype in 2025.",
    },
    ai: {
      value: 20,
      suffix: "%",
      caption:
        "Of tested AI-recommended dependency versions were both valid and free of known vulnerabilities.",
    },
  } satisfies Record<string, GlanceStat>,
} as const;

/** A stretch of a paragraph: plain text, or text to emphasize. */
export type Run = string | { strong: string };
export type Paragraph = readonly Run[];

export interface Finding {
  id: string;
  number: string;
  title: string;
  icon: string;
  paragraphs: readonly Paragraph[];
}

export const FINDINGS = {
  heading: "What the research reveals",
  items: [
    {
      id: "dependency-growth",
      number: "01",
      title: "Software dependency growth is increasing the security burden",
      icon: `${ICONS}/icon-dependency-estate.webp`,
      paragraphs: [
        [
          "Open-source components are present in ",
          { strong: "98%" },
          " of audited commercial codebases. With an average of ",
          { strong: "1,180 components" },
          " per application, organizations are managing increasingly complex dependency networks.",
        ],
        [
          "A significant portion of this exposure is indirect. Transitive dependencies can enter applications through other packages, often without developers actively selecting or reviewing them.",
        ],
      ],
    },
    {
      id: "fixes-exist",
      number: "02",
      title: "Vulnerable dependencies remain in use even when fixes exist",
      icon: `${ICONS}/icon-aging-fix.webp`,
      paragraphs: [
        [
          "The continued use of outdated components remains a persistent challenge. The research found that ",
          { strong: "68%" },
          " of observed components were more than two years old.",
        ],
        [
          { strong: "Nearly 95%" },
          " of vulnerable component downloads had an available fix. The gap is not simply about identifying vulnerabilities. It is also about upgrade friction, ownership and the difficulty of keeping dependency inventories current.",
        ],
      ],
    },
    {
      id: "supply-chain",
      number: "03",
      title: "Supply-chain attacks go beyond known vulnerabilities",
      icon: `${ICONS}/icon-supply-chain-attack.webp`,
      paragraphs: [
        [
          "Malicious packages, compromised maintainer accounts and manipulated releases demonstrate how attackers can exploit the software ecosystem itself.",
        ],
        [
          "These threats do not always come with a CVE. A component may appear legitimate while its package, source or release process has been compromised.",
        ],
        [
          "Traditional vulnerability management alone cannot establish whether software has been tampered with before it enters an environment.",
        ],
      ],
    },
    {
      id: "ai-assisted",
      number: "04",
      title: "AI-assisted development introduces new dependency risks",
      icon: `${ICONS}/icon-ai-selection.webp`,
      paragraphs: [
        [
          "AI coding assistants are changing how developers discover and adopt software components. But recommendations can include vulnerable packages, invalid versions or dependencies that do not exist.",
        ],
        [
          "The research found that only ",
          { strong: "20%" },
          " of tested AI-recommended dependency versions were both valid and free of known vulnerabilities. Grounding recommendations in live registry data and adding security tooling can materially improve their safety.",
        ],
      ],
    },
    {
      id: "verify-earlier",
      number: "05",
      title: "Software verification needs to happen earlier",
      icon: `${ICONS}/icon-verify-earlier.webp`,
      paragraphs: [
        [
          "Visibility, vulnerability scanning and compliance reporting remain important. But they address only part of the problem.",
        ],
        [
          "Organizations need evidence of component identity, origin, provenance, integrity and security posture before software is introduced into development and production environments.",
        ],
        [{ strong: "This is the foundation of Dependency Trust." }],
      ],
    },
  ] satisfies Finding[],
} as const;

export const LEADERSHIP = {
  heading: "A shift in how we approach software security",
  quote: [
    "Software security cannot begin and end with finding vulnerabilities. Organizations need to know what they are bringing into their environments, where it comes from and whether its integrity can be verified.",
    "As software development accelerates, particularly with AI, the volume and speed of dependency adoption will only increase. The industry needs to move from managing known risks after adoption to establishing confidence in software before it is used.",
  ],
  name: "Nilesh Jain",
  role: "CEO and Co-founder, CleanStart",
  photo: "/images/teams/nilesh-jain.webp",
} as const;

export const ABOUT_RESEARCH = {
  heading: "About this research",
  paragraphs: [
    "State of Software Dependency Trust 2026 examines the changing software dependency landscape, drawing on industry research and published evidence across open-source security, vulnerability management, software supply-chain attacks and AI-assisted development.",
    "The report brings together findings from multiple industry sources to explore the risks organizations face and the need for stronger verification practices across the software lifecycle.",
  ],
  sourcesButton: "View Research Sources and Methodology",
  methodologyHeading: "Methodology and Research Notes",
  methodology: [
    "This report is a secondary-research synthesis drawing on published industry studies, ecosystem telemetry, maintainer and governance surveys, documented software supply-chain incidents, AI dependency-selection research and official policy sources. Key inputs include Black Duck OSSRA 2026, Sonatype’s 2026 ecosystem telemetry, Linux Foundation research and Perforce OpenLogic’s 2026 State of Open Source Report, alongside the additional sources cited throughout the report. The purpose is to identify structural patterns, not to create a composite industry score or make a population estimate for all organizations.",
    "Key limitations are intentionally retained. No 2026 industry-segmented SBOM adoption dataset was identified. There is no comprehensive regional mean-time-to-remediate dataset, and maintainer geography cannot currently be modeled reliably. Sector coverage varies by source and metric, and some findings are available only for a limited set of industries. Older sector comparisons use changed definitions and should be read as directional rather than like-for-like trend lines. The report does not invent values to complete these gaps.",
  ],
  referencesHeading: "References and Sources",
  references: [
    { publisher: "Black Duck", title: "2026 Open Source Security and Risk Analysis (OSSRA)" },
    { publisher: "Endor Labs", title: "State of Dependency Management 2025" },
    { publisher: "ENISA", title: "SBOM Adoption State of Play 2026" },
    { publisher: "GitHub", title: "Octoverse 2025" },
    { publisher: "Linux Foundation", title: "State of Global Open Source 2025" },
    { publisher: "Perforce OpenLogic", title: "2026 State of Open Source Report" },
    { publisher: "Sonatype", title: "State of the Software Supply Chain 2026" },
    { publisher: "Sonatype", title: "State of the Software Supply Chain Report 2024" },
    { publisher: "Veracode", title: "2026 State of Software Security" },
  ],
} as const;

export const DOWNLOAD = {
  heading: "Download the Full Report",
  body: "Explore the findings, evidence and recommendations in the complete State of Software Dependency Trust 2026 report.",
  cta: "Download the PDF",
} as const;

export const ABOUT_CLEANSTART = {
  heading: "About CleanStart",
  body: "CleanStart is a provider of verified software artifacts for modern software supply chains. Through Clean Images, Clean Libraries and CleanSight, CleanStart helps organizations discover software assets, adopt hardened software foundations and establish verifiable evidence across the software they build, acquire and deploy.",
  products: [
    { label: "Clean Images", href: "/cleanstart-images", emblem: "/images/cleanstart-factory/emblem-images.webp" },
    { label: "Clean Libraries", href: "/clean-libraries", emblem: "/images/cleanstart-factory/emblem-libraries.webp" },
    { label: "CleanSight", href: "/cleansight", emblem: "/images/cleanstart-factory/emblem-cleansight.webp" },
  ],
  linkLabel: "images.cleanstart.com",
  linkHref: "https://images.cleanstart.com",
} as const;
