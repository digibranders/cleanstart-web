/**
 * Every string on `/compare/chainguard-vs-cleanstart`.
 *
 * The page is held to the SEO source document ("Chainguard vs CleanStart").
 * Copy here is the document's, verbatim. Nothing is added, cut or re-worded,
 * and no capability claim appears that the document's table does not make.
 *
 * Heading levels follow the document's outline, shifted one level because the
 * page title takes H1: the document's H1s are the page's H2s, and the H2s and
 * H3s nested under them are the page's H3s. The document sets the two vendor
 * names in "Two Approaches" as H2s, which is why the foundation columns are
 * headings here and are paragraphs on the Docker page: that document did not
 * set them as headings.
 *
 * Four things on this page are chrome the document does not write, and they
 * are marked at their definitions below: the matrix `caption` (read instead of
 * the table by screen readers), the matrix `footnote`, the `qualifiedNote`
 * that explains the table's "✓*", and the `href` on each call to action. The
 * document gives the asterisk no footnote text, so `qualifiedNote` says only
 * that the source marks the capability as qualified and does not say what the
 * condition is. It wants SEO's own wording before the page is indexed.
 *
 * Unlike the Docker comparison, this document gives the build-process section
 * no standfirst, no per-vendor sentence and no "Key characteristics" list, and
 * gives the matrix and the differentiators no standfirst either. Those fields
 * are left unset rather than filled with copy written here.
 */

import {
  both,
  no,
  qualified,
  text,
  yes,
  type CompareContent,
} from "./compare-types";

export const CHAINGUARD: CompareContent = {
  path: "/compare/chainguard-vs-cleanstart",

  /**
   * Title and description are SEO's metadata table, not the .docx header. The
   * two differ: the document opens on build reproducibility, provenance and
   * SBOMs, the table on vulnerability management, customization and developer
   * workflows. The document's own standfirst still runs on the page below.
   */
  meta: {
    title: "Chainguard Alternative: CleanStart Hardened Images",
    description:
      "Compare Chainguard and CleanStart on container image security, vulnerability management, customization, and developer workflows to find the right solution for your needs.",
  },

  title: "Chainguard vs CleanStart: Secure Container Images Compared",

  /**
   * The suffix stays in the H1 here. The document reuses "Chainguard vs
   * CleanStart" verbatim as the capability table's heading, so dropping the
   * suffix the way the Docker page does would set the same five words as both
   * the H1 and an H2.
   */
  titleParts: {
    lead: "Chainguard vs ",
    accent: "CleanStart",
    trail: ": Secure Container Images Compared",
  },

  standfirst:
    "Compare Chainguard and CleanStart across container security, software foundations, build reproducibility, provenance, vulnerability management, and software supply chain verification.",

  vendor: {
    rival: "Chainguard",
    cleanstart: "CleanStart",
  },

  /**
   * Chainguard's own logomark, lifted from chainguard.dev and set in the
   * page's neutral slate rather than its brand blurple (#6226FB). That blurple
   * is within a few degrees of CleanStart's violet, and this page spends
   * violet on one axis only: colouring the rival's mark in it would read as
   * two CleanStarts. Flip the fill in the SVG if marketing wants brand colour.
   */
  rivalMark: "/images/compare/tools/chainguard.svg",

  /** The document's own CTA, pointed at the Clean Images page. */
  heroCta: {
    label: "Explore CleanStart Images",
    href: "/cleanstart-images",
  },

  /* ─────────────────── section 1: two approaches ─────────────────── */

  foundations: {
    heading: "Two Approaches to Building Secure Container Images",
    /** The document sets both vendor names as H2s under this heading. */
    labelAsHeading: true,
    columns: [
      {
        id: "rival",
        label: "Chainguard",
        body: "Minimal, secure-by-default container images built from source with reproducible builds and verifiable metadata.",
        focusLabel: "Focus:",
        focus: [
          "Wolfi and Chainguard OS foundations",
          "Source-built software",
          "Minimal and distroless images",
          "Reproducible builds and provenance",
        ],
      },
      {
        id: "cleanstart",
        label: "CleanStart",
        body: "Verified container images built through controlled software supply chain processes designed to establish artifact trust.",
        focusLabel: "Focus:",
        focus: [
          "CleanStart OS and minimal foundations",
          "Source-based builds",
          "Hermetic and reproducible builds",
          "Provenance and cryptographic verification",
        ],
      },
    ],
  },

  /* ────────────────────── section 2: the matrix ────────────────────── */

  matrix: {
    heading: "Chainguard vs CleanStart",
    /** Chrome: the table's accessible summary, not document copy. */
    caption:
      "Capability comparison between Chainguard and CleanStart, grouped by image and build, supply chain verification, security and compliance, and lifecycle and platform.",
    /** Chrome: the dating and scope note every comparison table on the site carries. */
    footnote:
      "Comparison reflects each platform's published approach and CleanStart's documented capabilities as of September 2026. Specific behavior varies by image and variant.",
    /**
     * Chrome. The source table writes "✓*" on six Chainguard rows but supplies
     * no footnote text, so this says what the marker is and stops there rather
     * than inventing the condition.
     */
    qualifiedNote:
      "An asterisk marks a capability the source comparison records as qualified rather than unconditional. The source does not state the condition.",
    groups: [
      {
        id: "image-build",
        label: "Image & Build",
        icon: "/images/compare/icon-origin.webp",
        rows: [
          {
            id: "base-foundation",
            capability: "Base foundation",
            rival: text("Wolfi / Chainguard OS"),
            cleanstart: text("CleanStart OS"),
          },
          {
            id: "minimal-production-images",
            capability: "Minimal production images",
            rival: yes,
            cleanstart: yes,
          },
          {
            id: "distroless-images",
            capability: "Distroless images",
            rival: yes,
            cleanstart: yes,
          },
          {
            id: "non-root-runtime",
            capability: "Non-root runtime",
            rival: yes,
            cleanstart: yes,
          },
          {
            id: "shell-free-runtime",
            capability: "Shell / package-manager free runtime",
            rival: yes,
            cleanstart: yes,
          },
          {
            id: "multi-architecture",
            capability: "Multi-architecture",
            rival: yes,
            cleanstart: yes,
          },
          {
            id: "source-based-build",
            capability: "Source-based build",
            rival: yes,
            cleanstart: yes,
          },
          {
            id: "hermetic-build",
            capability: "Hermetic build",
            rival: qualified,
            cleanstart: yes,
          },
          {
            id: "reproducible-builds",
            capability: "Reproducible builds",
            rival: yes,
            cleanstart: yes,
          },
        ],
      },
      {
        id: "supply-chain-verification",
        label: "Supply Chain Verification",
        icon: "/images/compare/icon-provenance.webp",
        rows: [
          {
            id: "sbom",
            capability: "SBOM",
            rival: yes,
            cleanstart: yes,
          },
          {
            id: "spdx-cyclonedx",
            capability: "SPDX / CycloneDX",
            rival: qualified,
            cleanstart: yes,
          },
          {
            id: "slsa-provenance",
            capability: "SLSA provenance",
            rival: both("Build Level 3"),
            cleanstart: both("Build Level 3"),
          },
          {
            id: "build-provenance",
            capability: "Build provenance & verification",
            rival: yes,
            cleanstart: yes,
          },
          {
            id: "cryptographic-signing",
            capability: "Cryptographic signing",
            rival: yes,
            cleanstart: yes,
          },
          {
            id: "sigstore-cosign",
            capability: "Sigstore / Cosign",
            rival: yes,
            cleanstart: yes,
          },
          {
            id: "vex",
            capability: "VEX / exploitability context",
            rival: qualified,
            cleanstart: yes,
          },
          {
            id: "ai-bom",
            capability: "AI BOM",
            rival: no,
            cleanstart: yes,
          },
        ],
      },
      {
        id: "security-compliance",
        label: "Security & Compliance",
        icon: "/images/compare/icon-regulatory.webp",
        rows: [
          {
            id: "near-zero-cve",
            capability: "Near-zero CVE posture",
            rival: yes,
            cleanstart: yes,
          },
          {
            id: "continuous-updates",
            capability: "Continuous security updates",
            rival: yes,
            cleanstart: yes,
          },
          {
            id: "malware-testing",
            capability: "Malware / security testing",
            rival: yes,
            cleanstart: yes,
          },
          {
            id: "fips",
            capability: "FIPS",
            rival: yes,
            cleanstart: both("FIPS 140-3"),
          },
          {
            id: "stig-cis",
            capability: "STIG / CIS",
            rival: qualified,
            cleanstart: yes,
          },
        ],
      },
      {
        id: "lifecycle-platform",
        label: "Lifecycle & Platform",
        icon: "/images/compare/icon-signed-artifact.webp",
        rows: [
          {
            id: "custom-hardened-images",
            capability: "Custom hardened images",
            rival: qualified,
            cleanstart: yes,
          },
          {
            id: "dependency-governance",
            capability: "Software dependency governance",
            rival: both("Chainguard Libraries"),
            cleanstart: both("Clean Libraries"),
          },
          {
            id: "estate-discovery",
            capability: "Software estate discovery",
            rival: no,
            cleanstart: text("CleanSight"),
          },
          {
            id: "verified-remediation",
            capability: "Verified remediation workflows",
            rival: no,
            cleanstart: text("CleanSight"),
          },
        ],
      },
    ],
  },

  /* ─────────────────── section 3: the build process ─────────────────── */

  /**
   * Both lanes end at "Production", which the diagram draws as the one gate
   * they share. Chainguard's lane is the longer of the two here, so there is
   * no inherited base to ghost in ahead of it and `inheritedBase` is unset.
   */
  buildFlow: {
    heading: "Build Process",
    columns: [
      {
        id: "rival",
        label: "Chainguard",
        stepsLabel: "Build approach:",
        steps: [
          "Source",
          "melange: Build Packages",
          "apko: Compose Image",
          "Reproducible Build",
          "SBOM + Provenance",
          "Sigstore Signing",
          "Verified Chainguard Image",
          "Production",
        ],
      },
      {
        id: "cleanstart",
        label: "CleanStart",
        stepsLabel: "Build approach:",
        steps: [
          "Source + Verified Dependencies",
          "Hermetic Build",
          "Reproducibility + Security Analysis",
          "SBOM + Provenance",
          "Sigstore Signing",
          "Verified CleanStart Image",
          "Production",
        ],
      },
    ],
  },

  /* ─────────────────── section 4: differentiators ─────────────────── */

  differentiators: {
    heading: "Where CleanStart Differentiates",
    items: [
      {
        id: "security-decisions",
        heading: "Security Decisions, Not Just Metadata",
        body: "Go beyond security metadata to evaluate software integrity, vulnerabilities, provenance, and exploitability.",
        /** Shield with a seal: a judgement reached, not a document produced. */
        icon: "/images/compare/icon-fips.webp",
      },
      {
        id: "discover-remediate-verify",
        heading: "Discover. Remediate. Verify.",
        body: "Discover vulnerable software across your environment, identify verified remediation options, and verify the result.",
        /** Checked list under a shield: the three steps the heading names. */
        icon: "/images/compare/icon-stig.webp",
      },
      {
        id: "verified-supply-chain",
        heading: "Verified Software Across the Supply Chain",
        body: "Take verification across your Software Supply Chain with Clean Images and Clean Libraries.",
        /** Linked cubes: the chain the sentence runs verification along. */
        icon: "/images/compare/icon-provenance.webp",
      },
    ],
  },

  /* ────────────────────────── section 5: FAQ ────────────────────────── */

  faqHeading: "FAQ",

  faqs: [
    {
      id: "both-source-built",
      question: "Are Chainguard and CleanStart both source-built?",
      answer:
        "Yes. Both use source-based build processes designed to produce minimal, secure container artifacts.",
    },
    {
      id: "reproducible-builds",
      question: "Do both provide reproducible builds?",
      answer: "Yes. Reproducibility is a core part of both build models.",
    },
    {
      id: "sboms-provenance",
      question: "Do both provide SBOMs and provenance?",
      answer:
        "Yes. Both provide SBOMs and build provenance as part of their software supply chain evidence.",
    },
    {
      id: "chainguard-sigstore",
      question: "Does Chainguard use Sigstore?",
      answer:
        "Yes. Chainguard uses Sigstore-based signing and verification for its container artifacts.",
    },
    {
      id: "how-different",
      question: "How is CleanStart different from Chainguard?",
      answer:
        "Chainguard focuses heavily on providing secure, minimal and verifiable software artifacts. CleanStart combines verified container images with dependency governance through Clean Libraries and deployed-estate discovery and remediation through CleanSight.",
    },
    {
      id: "alternative",
      question: "Is CleanStart an alternative to Chainguard?",
      answer:
        "Yes. Both provide secure container foundations and supply chain verification capabilities. Organizations can evaluate them based on their required image ecosystem, verification requirements, compliance needs, and broader software supply chain strategy.",
    },
  ],

  /* ───────────────────────────── the CTA ───────────────────────────── */

  cta: {
    heading: "Build on Software You Can Verify",
    body: "Start with hardened, near-zero-CVE container images backed by provenance, reproducible builds and cryptographic verification.",
    button: "Explore CleanStart Images",
    /** Chrome: the document writes the label, not the destination. */
    href: "/cleanstart-images",
  },
};
