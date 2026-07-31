/**
 * Copy for the Docker Hardened Images ↔ CleanStart comparison page.
 *
 * Every string here is taken verbatim from the source copy document
 * ("Docker Hardened Images vs CleanStart"). Sentence case is normalised on
 * list items and nothing is paraphrased, re-headlined, or invented — including
 * the capability rows, which carry the document's own qualifier wording.
 *
 * The only additions are UI chrome that a copy document cannot supply: button
 * labels, the table's accessible caption, and the legend. They are grouped at
 * the bottom under UI_CHROME so the boundary stays obvious.
 */

/**
 * `state: "text"` is a cell the document answers with a phrase and no mark —
 * rendering those as a ✓ or a — would be us scoring a row the document
 * deliberately left unscored. `divergent` marks the rows where the document
 * itself qualifies or splits the answer.
 */
export interface MatrixRow {
  id: string;
  capability: string;
  docker: { state: "yes" | "no" | "text"; note?: string };
  cleanstart: { state: "yes" | "no" | "text"; note?: string };
  divergent?: boolean;
}

const yes = { state: "yes" } as const;

export const MATRIX_ROWS: readonly MatrixRow[] = [
  { id: "attack-surface", capability: "Reduced attack surface", docker: yes, cleanstart: yes },
  { id: "minimal", capability: "Minimal image variants", docker: yes, cleanstart: yes },
  { id: "distroless", capability: "Distroless images", docker: yes, cleanstart: yes },
  { id: "cves", capability: "Near-zero known CVEs", docker: yes, cleanstart: yes },
  {
    id: "sbom",
    capability: "Software Bill of Materials (SBOM)",
    docker: yes,
    cleanstart: yes,
  },
  { id: "signed", capability: "Signed software artifacts", docker: yes, cleanstart: yes },
  {
    id: "provenance",
    capability: "Software provenance",
    docker: { state: "yes", note: "SLSA Build Level 3" },
    cleanstart: { state: "yes", note: "SLSA Level 4 aligned" },
    divergent: true,
  },
  { id: "source-built", capability: "Source-built software", docker: yes, cleanstart: yes },
  { id: "crypto", capability: "Cryptographic verification", docker: yes, cleanstart: yes },
  { id: "rebuilds", capability: "Automatic rebuilds", docker: yes, cleanstart: yes },
  { id: "fips", capability: "FIPS-ready variants", docker: yes, cleanstart: yes },
  { id: "stig", capability: "STIG-aligned variants", docker: yes, cleanstart: yes },
  {
    id: "ai-bom",
    capability: "AI Bill of Materials (AI BOM)",
    docker: { state: "no" },
    cleanstart: yes,
    divergent: true,
  },
  {
    id: "hermetic",
    capability: "Deterministic, hermetic build philosophy",
    docker: { state: "text", note: "Limited public emphasis" },
    cleanstart: { state: "text", note: "Core design principle" },
    divergent: true,
  },
  {
    id: "posture",
    capability: "Software Supply Chain Posture capabilities",
    docker: { state: "text", note: "Image-focused" },
    cleanstart: { state: "text", note: "Broader software supply chain focus" },
    divergent: true,
  },
];

export const VENDOR_DHI = "Docker Hardened Images";
export const VENDOR_CLEANSTART = "CleanStart Verified Images";

/** Document title, split at the colon for the H1 / standfirst pair. */
export const TITLE_MAIN = "Docker Hardened Images vs CleanStart";
export const TITLE_SUB =
  "A Technical Comparison of Two Approaches to Trusted Container Images";

export const INTRO_LEAD =
  "Modern container security is no longer just about reducing vulnerabilities. Engineering teams are increasingly expected to answer broader questions:";

/** The four questions the document opens with. */
export const OPENING_QUESTIONS: readonly string[] = [
  "Where did this software originate?",
  "How was it built?",
  "Can it be independently verified?",
  "Does it meet regulatory and organizational security requirements?",
];

export const INTRO_BODY: readonly string[] = [
  "These questions have become central to software supply chain security.",
  "Docker Hardened Images (DHI) and CleanStart Verified Images both aim to provide secure container images for production workloads, but they approach the problem from different perspectives. Docker Hardened Images focus on delivering hardened, enterprise-ready container images with a minimal attack surface. CleanStart extends that foundation by emphasizing deterministic builds, software provenance, verification, and Software Supply Chain Posture.",
  "This guide compares both approaches from a technical perspective, explaining not only what each platform provides, but why those capabilities matter to modern engineering organizations.",
];

export const MATRIX_HEADING = "At a Glance: Hardened Container Images Comparison";

export const KEY_TAKEAWAY =
  "Both solutions significantly improve upon traditional public container images. The primary differences lie less in image hardening and more in the level of build assurance, software verification, and software supply chain governance they provide.";

export const KEY_TAKEAWAY_LABEL = "Key takeaway";

export interface DocSection {
  id: string;
  heading: string;
  /** Paragraphs before any list. */
  body: readonly string[];
  /** Optional lead-in sentence that introduces `items`. */
  listLead?: string;
  items?: readonly string[];
  /** Paragraphs after the list. */
  after?: readonly string[];
}

export const PHILOSOPHIES_SECTION: DocSection = {
  id: "philosophies",
  heading: "Two Different Security Philosophies",
  body: [
    "Although Docker Hardened Images and CleanStart solve similar problems, they begin from different architectural assumptions.",
  ],
};

export const PHILOSOPHY_DHI = {
  name: "Docker Hardened Images",
  lead: "Docker Hardened Images are designed to reduce operational risk by delivering production-ready images with:",
  items: [
    "Minimal software packages",
    "Reduced attack surface",
    "Enterprise support",
    "Signed artifacts",
    "Software provenance",
    "Continuous updates",
  ],
  close:
    "The emphasis is on delivering secure runtime images that organizations can confidently deploy.",
} as const;

export const PHILOSOPHY_CLEANSTART = {
  name: "CleanStart",
  body: [
    "CleanStart begins earlier in the software lifecycle.",
    "Instead of focusing solely on the final container image, it focuses on producing verified software artifacts through deterministic build pipelines.",
    "The objective is not only to reduce vulnerabilities, but also to establish confidence in how every software artifact was produced.",
    "This distinction becomes increasingly important for organizations implementing software supply chain frameworks such as SLSA, NIST SSDF, Executive Order 14028 requirements, or internal secure software development programs.",
  ],
} as const;

export const BEYOND_CVES = {
  heading: "Security: More Than Reducing CVEs",
  body: [
    "Reducing vulnerabilities remains one of the most effective ways to improve container security.",
    "Both Docker Hardened Images and CleanStart significantly reduce unnecessary packages, remove common attack vectors, and deliver production-ready container images with substantially fewer known vulnerabilities than typical public container images.",
  ],
  benefitsLead: "Benefits include:",
  benefits: [
    "Smaller images",
    "Fewer packages to maintain",
    "Reduced remediation effort",
    "Lower operational overhead",
    "Smaller runtime attack surface",
  ],
  pivot: "However, vulnerability reduction answers only one question:",
  answered: "Does this image contain known vulnerabilities today?",
  unansweredLead: "It does not answer:",
  unanswered: [
    "Who built it?",
    "Which source code produced it?",
    "Was the build reproducible?",
    "Has the artifact been modified?",
    "Can another organization independently verify it?",
  ],
  close:
    "Those questions belong to software integrity rather than vulnerability management.",
} as const;

export const SOURCE_BUILT: DocSection = {
  id: "building-from-source",
  heading: "Building from Source",
  body: [
    "One of the largest changes in software supply chain security over the past few years has been renewed interest in source-built software.",
    "Historically, many container images incorporated binaries produced elsewhere.",
  ],
  listLead:
    "Modern secure build systems increasingly rebuild packages directly from source, allowing organizations to:",
  items: [
    "Verify software origin",
    "Apply consistent compiler settings",
    "Generate provenance",
    "Reduce reliance on opaque upstream binaries",
  ],
  after: [
    "Both Docker Hardened Images and CleanStart embrace source-built software, helping establish stronger trust in the software delivered to production.",
  ],
};

export const HERMETIC: DocSection = {
  id: "hermetic-builds",
  heading: "Understanding Hermetic and Deterministic Builds",
  body: [
    "Hermetic builds are frequently mentioned in software supply chain discussions but are often misunderstood.",
    "A hermetic build executes inside an isolated environment where every dependency is explicitly declared before compilation begins.",
  ],
  listLead: "The build environment cannot:",
  items: [
    "Download undeclared packages",
    "Depend on developer workstations",
    "Rely on environment-specific configuration",
    "Produce different artifacts because of transient infrastructure changes",
  ],
  after: [
    "Deterministic builds extend this concept by ensuring identical inputs consistently produce identical outputs.",
    "This enables reproducible builds, improves build integrity, and reduces opportunities for supply chain attacks involving compromised package repositories or unexpected build dependencies.",
    "CleanStart places particular emphasis on hermetic, deterministic build pipelines as a core architectural principle.",
  ],
};

export const REPRODUCIBLE = {
  heading: "Reproducible Builds",
  lead: "A reproducible build answers one simple but powerful question:",
  question:
    "If another engineer rebuilds this software using the same source code, will they obtain the same artifact?",
  body: [
    "If the answer is yes, consumers gain significantly greater confidence that the published software corresponds exactly to the documented source code.",
  ],
  pull: "Reproducibility transforms software verification from trust into evidence.",
  close:
    "For organizations operating in highly regulated environments, reproducible builds are increasingly becoming an important indicator of software integrity.",
} as const;

export const PROVENANCE = {
  heading: "Software Provenance",
  body: ["Software provenance describes how an artifact was produced."],
  listLead: "Typical provenance records include:",
  items: [
    "Source repository",
    "Commit identifier",
    "Builder identity",
    "Build workflow",
    "Dependency information",
    "Artifact digest",
    "Timestamps",
    "Cryptographic attestations",
  ],
  after: [
    "Docker Hardened Images provide SLSA Build Level 3 provenance together with signed software artifacts.",
    "CleanStart extends this approach by emphasizing SLSA Level 4 aligned provenance, deterministic builds, and comprehensive verification throughout the build pipeline.",
    "Rather than replacing vulnerability management, provenance complements it by documenting the origin and production history of software artifacts.",
  ],
} as const;

export const BOMS: DocSection = {
  id: "sboms-ai-boms",
  heading: "SBOMs and AI BOMs",
  body: [
    "A Software Bill of Materials (SBOM) provides an inventory of every software component included within a container image.",
  ],
  listLead: "SBOMs enable engineering teams to:",
  items: [
    "Identify vulnerable dependencies",
    "Understand licensing obligations",
    "Perform impact analysis",
    "Accelerate incident response",
  ],
  after: [
    "As organizations increasingly adopt AI-assisted software development, visibility into AI-generated artifacts becomes equally important.",
    "CleanStart extends traditional SBOM capabilities with AI Bills of Materials (AI BOMs), helping organizations document AI-generated software components and strengthen governance across modern development workflows.",
  ],
};

export const COMPLIANCE: DocSection = {
  id: "compliance",
  heading: "Compliance and Regulatory Readiness",
  body: [
    "Modern compliance requirements increasingly focus on software integrity rather than vulnerability counts alone.",
    "Organizations in financial services, healthcare, government, and critical infrastructure frequently require evidence describing how software was produced.",
  ],
  listLead: "Capabilities such as:",
  items: [
    "Software provenance",
    "Signed artifacts",
    "SBOMs",
    "Deterministic builds",
    "FIPS-ready images",
    "STIG-aligned images",
  ],
  after: [
    "help simplify compliance activities while providing stronger assurance during audits.",
  ],
};

// `as const` rather than `: DocSection` — these two are consumed field-by-field
// rather than through DocBlock, so their list fields must be non-optional.
export const DEV_EXPERIENCE = {
  id: "developer-experience",
  heading: "Developer Experience",
  body: [
    "Security improvements should integrate naturally into existing development workflows.",
  ],
  listLead:
    "Both Docker Hardened Images and CleanStart support standard OCI container ecosystems and integrate with common tooling including:",
  items: [
    "Docker",
    "Kubernetes",
    "Helm",
    "GitHub Actions",
    "GitLab CI",
    "Jenkins",
    "Argo CD",
  ],
  after: [
    "From a developer perspective, adoption typically involves replacing a base image with secure Docker base images while continuing to use existing container workflows.",
    "Where the approaches differ is the amount of verification metadata available to downstream security and compliance teams.",
  ],
} as const;

export const VERIFYING = {
  id: "verifying-images",
  heading: "Verifying Container Images",
  body: [
    "Regardless of which platform you choose, engineers should verify the software they deploy.",
  ],
  listLead:
    "A secure container image should allow you to answer questions such as:",
  items: [
    "Is an SBOM available?",
    "Is the image digitally signed?",
    "Can software provenance be verified?",
    "Is the image digest immutable?",
    "Is the build process documented?",
    "Was the software rebuilt from source?",
    "Are updates published consistently?",
  ],
  after: [
    "These verification steps help establish confidence in both the software itself and the processes used to produce it.",
  ],
} as const;

export const CHOOSING = {
  heading: "CleanStart vs Docker Hardened Images: Choosing the Right Approach",
  body: [
    "Docker Hardened Images and CleanStart are not mutually exclusive philosophies. Both recognize that public container images require stronger security, better maintenance, and improved transparency.",
  ],
  dhi: {
    name: "Docker Hardened Images",
    text: "Docker Hardened Images are well suited for organizations looking for hardened, enterprise-supported images that integrate seamlessly into Docker's ecosystem while providing signed artifacts, provenance, and reduced vulnerabilities.",
  },
  cleanstart: {
    name: "CleanStart",
    text: "CleanStart is designed for organizations that require additional assurance through deterministic build pipelines, SLSA Level 4 aligned provenance, AI BOMs, and a broader approach to Software Supply Chain Posture that extends beyond the container image itself.",
  },
  close:
    "The right choice ultimately depends on your security objectives, compliance requirements, and the level of verification your organization expects from its software supply chain.",
} as const;

export const WHICH_BETTER = {
  heading: "Which solution is better?",
  body: [
    "Both Docker Hardened Images and CleanStart significantly improve software security compared to traditional public container images.",
    "If your priority is hardened, enterprise-supported container images with strong security fundamentals, Docker Hardened Images provide an excellent foundation.",
    "If your organization also requires higher-assurance build verification, deterministic software production, AI BOMs, and a broader Software Supply Chain Posture strategy, CleanStart extends those capabilities beyond traditional image hardening.",
  ],
} as const;

export const FINAL_THOUGHTS = {
  heading: "Final Thoughts",
  pull: "Container security is evolving from secure images to verifiable software.",
  body: [
    "Reducing vulnerabilities remains essential, but modern software supply chain security also requires organizations to understand where software originated, how it was built, and whether its integrity can be independently verified.",
    "Whether you choose Docker Hardened Images, CleanStart, or another trusted image provider, the long-term objective remains the same: establish confidence in every software artifact before it reaches production.",
    "That confidence is built not only through hardening, but through verification.",
  ],
} as const;

export const CTA = {
  heading: "Build Trust Into Every Container Image",
  body: "Secure container images are only one part of software supply chain security. Discover how CleanStart helps engineering and security teams verify software integrity before deployment.",
  button: "Request a Demo",
} as const;

export const FAQ_HEADING = "Frequently Asked Questions";

export interface CompareFaq {
  id: string;
  question: string;
  answer: string;
}

export const COMPARE_FAQS: readonly CompareFaq[] = [
  {
    id: "hardened-vs-verified",
    question: "What is the difference between a hardened image and a verified image?",
    answer:
      "A hardened image reduces the attack surface by minimizing unnecessary software and lowering known vulnerabilities. A verified image builds on hardening by providing evidence describing how the software was produced, including provenance, reproducible builds, cryptographic signatures, and attestations.",
  },
  {
    id: "still-scan",
    question: "Do I still need vulnerability scanning?",
    answer:
      "Yes. Verification and vulnerability management solve different problems. Vulnerability scanning identifies known security issues, while verification establishes confidence in the integrity and origin of software artifacts.",
  },
  {
    id: "what-is-provenance",
    question: "What is software provenance?",
    answer:
      "Software provenance documents how software was produced, including its source repository, build workflow, builder identity, and cryptographic attestations. It enables consumers to verify the origin and integrity of software artifacts.",
  },
  {
    id: "why-reproducible",
    question: "Why are reproducible builds important?",
    answer:
      "Reproducible builds allow independent parties to verify that published artifacts correspond exactly to the documented source code, reducing reliance on trust alone.",
  },
  {
    id: "good-alternative",
    question: "Is CleanStart a good alternative to Docker Hardened Images?",
    answer:
      "Docker Hardened Images and CleanStart both provide secure container images with reduced attack surfaces, signed artifacts, SBOMs, and software provenance. CleanStart differentiates itself by emphasizing deterministic build pipelines, SLSA Level 4 aligned provenance, AI BOMs, and a broader software supply chain posture. The right choice depends on your organization's security, compliance, and verification requirements.",
  },
  {
    id: "compliance-support",
    question: "Which platform offers better compliance support?",
    answer:
      "Both platforms support compliance initiatives through capabilities such as signed artifacts, software provenance, SBOMs, and hardened container images. CleanStart further emphasizes deterministic builds and broader software supply chain verification, which may provide additional assurance for organizations operating under strict regulatory or internal security requirements.",
  },
  {
    id: "kubernetes",
    question: "Which platform works better with Kubernetes?",
    answer:
      "Both Docker Hardened Images and CleanStart support standard OCI container ecosystems and integrate with Kubernetes alongside common CI/CD and GitOps tools. For most engineering teams, adopting either solution typically involves replacing the base image while maintaining existing deployment workflows.",
  },
];

/** Plain-text Q&A pairs for `faqPageSchema`. */
export const COMPARE_FAQ_ITEMS: ReadonlyArray<{ question: string; answer: string }> =
  COMPARE_FAQS.map((faq) => ({ question: faq.question, answer: faq.answer }));

/**
 * Strings the copy document cannot supply: interface labels and accessible
 * text. Kept separate so the document-verbatim boundary above stays auditable.
 */
export const UI_CHROME = {
  matrixCaption:
    "Capability comparison between Docker Hardened Images and CleanStart Verified Images.",
  legendIncluded: "Included",
  legendAbsent: "Not offered",
  jumpToMatrix: "See the comparison",
  trademark:
    "Docker and Docker Hardened Images are trademarks of Docker, Inc. CleanStart is not affiliated with Docker, Inc. Capabilities reflect each vendor's public documentation.",
} as const;
