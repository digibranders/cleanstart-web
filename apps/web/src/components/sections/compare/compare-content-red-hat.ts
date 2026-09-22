/**
 * Every string on `/compare/red-hat-vs-cleanstart`.
 *
 * The page is held to the SEO source document ("RedHat.docx", received
 * 2026-09-21). Copy here is the document's, verbatim. Nothing is added, cut or
 * re-worded, which is why several bands carry a heading and no standfirst: the
 * document writes none, and `BandHeader` sets the heading on its own rather
 * than inventing one. For the same reason the build-process band is the two
 * lanes and nothing else — the document draws the flow and writes no prose
 * under it.
 *
 * Heading levels follow the document's outline, shifted one level because the
 * page title takes H1: the document's section headings are the page's H2s, the
 * three differentiator headings and the FAQ questions are its H3s. Anything
 * the document does not set as a heading (the two vendor labels, the matrix
 * group names, the "Focus:" lead-ins) stays a `<p>` or a table header cell so
 * the outline stays the one SEO wrote.
 *
 * The meta title and meta description come from the SEO team's comparison-page
 * metadata table (2026-09-21), not from the .docx.
 *
 * The slug is a split decision. The table writes `/red-hat-vs-cleanstart/`,
 * dropping the `/compare/` segment; the user kept the segment (2026-09-21), so
 * the page is `/compare/red-hat-vs-cleanstart` — the table's rival-first slug
 * under the segment every comparison shares. That leaves the word order
 * different from the live Docker page's `cleanstart-vs-docker-hardened-images`,
 * which is indexed and cannot be renamed. See the C2 row in
 * docs/web/WEB-PAGES.md.
 *
 * Two things here are NOT the document's and want its review:
 *
 * 1. The four "✓*" cells (VEX, STIG / CIS, Custom hardened images). The
 *    asterisk is the document's; its footnote text was not supplied. The
 *    asterisks are kept rather than flattened to a plain tick, which would
 *    overstate Red Hat's column, and `qualifiedNote` carries the same
 *    "varies by image or variant" caveat the sibling page's footnote already
 *    makes.
 * 2. `matrix.caption`, `matrix.footnote` and `faqHeading` are page chrome the
 *    document does not write, matched to the sibling comparison.
 *
 * The page is `noindex, nofollow` and absent from the sitemap until the copy
 * is signed off. See the route file.
 */

import {
  both,
  no,
  qualified,
  text,
  yes,
  type CompareContent,
} from "./compare-types";

export const RED_HAT = {
  path: "/compare/red-hat-vs-cleanstart",

  /**
   * Title, description and slug are the SEO team's, from the comparison-page
   * metadata table supplied 2026-09-21. The description is NOT the document's
   * own second line; that line stays on the page as `standfirst` below.
   */
  meta: {
    title: "Red Hat Alternative: CleanStart Hardened Images",
    description:
      "Compare Red Hat and CleanStart on container image security, vulnerabilities, customization, support, and developer workflows to understand the key differences.",
  },

  title:
    "Red Hat Hardened Images vs CleanStart: Secure Container Images Compared",

  /**
   * Note for SEO review: the document reuses its own title, "Red Hat Hardened
   * Images vs CleanStart", as the capability matrix's heading, so the page
   * sets those words as both its H1 and an H2. That is the document's
   * structure and is left as written; giving the matrix its own heading (the
   * Docker document uses "…: Container Security Comparison") is a one-line
   * change to `matrix.heading` below.
   */
  titleParts: {
    lead: "Red Hat Hardened Images vs ",
    accent: "CleanStart",
  },

  /** The document's own second line. The meta description above is the SEO
   *  table's and deliberately differs. */
  standfirst:
    "Compare Red Hat Hardened Images and CleanStart across container security, software provenance, reproducible builds, vulnerability management, and software supply chain verification.",

  vendor: {
    rival: "Red Hat Hardened Images",
    cleanstart: "CleanStart",
  },

  rivalMark: "/images/compare/tools/redhat.svg",

  heroCta: {
    label: "Explore CleanStart Images",
    href: "/cleanstart-images",
  },

  /* ───────────────────── section 1: foundations ───────────────────── */

  foundations: {
    heading: "Two Approaches to Building Secure Container Images",
    columns: [
      {
        id: "rival",
        label: "Red Hat Hardened Images",
        body: "Red Hat Hardened Images provide minimal, production-oriented container images designed to reduce attack surface and vulnerability noise. Red Hat uses a hermetic build environment, distroless runtime images, security profiles, SBOMs, provenance, and signed artifacts.",
        focusLabel: "Focus:",
        focus: [
          "Red Hat's hardened image ecosystem",
          "Minimal and distroless runtime images",
          "Hermetic and reproducible builds",
          "SBOM and SLSA provenance",
          "Automated vulnerability remediation",
        ],
      },
      {
        id: "cleanstart",
        label: "CleanStart",
        body: "CleanStart provides verified container images built through controlled software supply chain processes designed to establish artifact trust. CleanStart combines hardened, near-zero-CVE foundations with provenance, reproducibility, cryptographic signing, and security analysis.",
        focusLabel: "Focus:",
        focus: [
          "CleanStart OS and minimal foundations",
          "Source-based builds",
          "Reproducible and controlled build processes",
          "SBOM, provenance and Sigstore signing",
          "Security analysis and verified remediation",
        ],
      },
    ],
  },

  /* ─────────────────────── section 2: matrix ─────────────────────── */

  matrix: {
    heading: "Red Hat Hardened Images vs CleanStart",
    caption:
      "Capability comparison between Red Hat Hardened Images and CleanStart, grouped by image and build, supply chain verification, security and compliance, and lifecycle and platform.",
    qualifiedNote: "Availability varies by image or variant.",
    footnote:
      "Comparison reflects each platform's published approach and CleanStart's documented capabilities as of September 2026. Specific behavior varies by image and variant.",
    groups: [
      {
        id: "image-build",
        label: "Image & Build",
        icon: "/images/compare/icon-origin.webp",
        rows: [
          {
            id: "base-foundation",
            capability: "Base foundation",
            rival: text("Red Hat / Fedora ecosystem"),
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
            rival: yes,
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
        id: "supply-chain",
        label: "Supply Chain Verification",
        icon: "/images/compare/icon-provenance.webp",
        rows: [
          { id: "sbom", capability: "SBOM", rival: yes, cleanstart: yes },
          { id: "spdx", capability: "SPDX", rival: yes, cleanstart: yes },
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
        icon: "/images/compare/icon-stig.webp",
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
            rival: no,
            cleanstart: text("Clean Libraries"),
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

  /* ────────────────────── section 3: build flow ────────────────────── */

  /**
   * Both flows run seven stages to the same destination, so neither lane has
   * a head start on the other and there is no inherited base to draw. The two
   * lanes run in parallel into one "Production" gate, which is the document's
   * own shape: same endpoint, different work along the way.
   */
  buildFlow: {
    heading: "Build Process",
    columns: [
      {
        id: "rival",
        label: "Red Hat Hardened Images",
        steps: [
          "Source / Software Inputs",
          "Hermetic Build Environment",
          "Hardening + Security Validation",
          "SBOM + SLSA Provenance",
          "Sigstore / Cosign Signing",
          "Verified Hardened Image",
          "Production",
        ],
      },
      {
        id: "cleanstart",
        label: "CleanStart",
        steps: [
          "Source + Verified Dependencies",
          "Controlled / Hermetic Build",
          "Reproducibility + Security Analysis",
          "SBOM + Provenance",
          "Sigstore Signing",
          "Verified CleanStart Image",
          "Production",
        ],
      },
    ],
  },

  /* ───────────────────── section 4: differentiators ───────────────────── */

  differentiators: {
    heading: "Where CleanStart Differentiates",
    items: [
      {
        id: "beyond-cves",
        heading: "Security Verification Beyond CVEs",
        body: "Go beyond vulnerability counts with provenance, reproducibility, exploitability context, and software integrity signals.",
        /** Sealed cube: the artifact carrying its own verification. */
        icon: "/images/compare/icon-signed-artifact.webp",
      },
      {
        id: "images-to-supply-chain",
        heading: "From Images to the Software Supply Chain",
        body: "Secure more than container images with Clean Images, Clean Libraries, and CleanSight, covering software foundations, dependencies, and deployed assets.",
        /** Bill of materials: the layer below the image. */
        icon: "/images/compare/icon-sbom.webp",
      },
      {
        id: "discover-remediate-verify",
        heading: "Discover. Remediate. Verify.",
        body: "Connect software discovery with verified remediation, so teams can identify vulnerable assets, replace unsafe components, and continuously verify the result.",
        /** Checked list under a shield: remediation, verified. */
        icon: "/images/compare/icon-stig.webp",
      },
    ],
  },

  /* ────────────────────────── section 5: FAQ ────────────────────────── */

  faqHeading: "Frequently Asked Questions",

  faqs: [
    {
      id: "both-distroless",
      question: "Are Red Hat Hardened Images and CleanStart both distroless?",
      answer:
        "Yes. Both provide minimal runtime images designed to reduce unnecessary software and attack surface. Red Hat explicitly describes its runtime images as distroless, with no package manager or shell.",
    },
    {
      id: "sbom-provenance",
      question: "Do both provide SBOMs and software provenance?",
      answer:
        "Yes. Red Hat Hardened Images provide SBOMs and SLSA provenance, while CleanStart provides SBOMs, provenance and cryptographic verification.",
    },
    {
      id: "sigstore",
      question: "Do Red Hat Hardened Images support Sigstore?",
      answer:
        "Yes. Red Hat signs its images at build time and documents Cosign-based verification using its Sigstore infrastructure.",
    },
    {
      id: "reproducible-builds",
      question: "Do both support reproducible builds?",
      answer:
        "Yes. Reproducibility is part of the build assurance model for both. Red Hat documents hermetic builds and reproducibility, while CleanStart positions reproducible builds as part of its software integrity model.",
    },
    {
      id: "main-difference",
      question:
        "What is the main difference between Red Hat Hardened Images and CleanStart?",
      answer:
        "Red Hat Hardened Images focus on providing minimal, hardened and verifiable container foundations. CleanStart combines verified container images with software dependency governance and continuous software visibility and remediation through Clean Libraries and CleanSight.",
    },
    {
      id: "replace",
      question: "Does CleanStart replace Red Hat Hardened Images?",
      answer:
        "CleanStart can provide an alternative hardened container foundation for organizations evaluating secure base images. The right choice depends on the organization's application requirements, compliance needs, software supply chain controls and operational model.",
    },
  ],

  /* ───────────────────────────── CTA ───────────────────────────── */

  cta: {
    heading: "Build on Software You Can Verify",
    body: "Start with hardened, near-zero-CVE container images backed by provenance, reproducible builds and cryptographic verification.",
    button: "Explore CleanStart Images",
    href: "/cleanstart-images",
  },
} as const satisfies CompareContent;
