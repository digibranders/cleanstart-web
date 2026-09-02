/**
 * Every string on `/compare/cleanstart-vs-docker-hardened-images`.
 *
 * The page is held to the SEO source document ("Docker Hardened Images vs
 * CleanStart - Final"). Copy here is the document's, verbatim, with one class
 * of edit: em-dashes are replaced with a colon or a semicolon per the house
 * writing rule. Nothing is added, cut or re-worded.
 *
 * Heading levels follow the document's outline, shifted one level because the
 * page title takes H1: the document's H1s are the page's H2s, its H2s are the
 * page's H3s. Anything the document does not set as a heading (the two vendor
 * labels, the matrix group names, the "focuses on" and "Build approach" lead-ins)
 * stays a `<p>` or a table header cell so the outline stays the one SEO wrote.
 *
 * The capability matrix and the FAQ are both consumed twice — once by the
 * rendered section and once by the FAQPage JSON-LD / matrix counts — so they
 * live here rather than inside a component.
 */

export const PATH = "/compare/cleanstart-vs-docker-hardened-images";

export const META = {
  title: "Docker Hardened Images vs CleanStart | Secure Container Images",
  description:
    "Compare Docker Hardened Images vs CleanStart. Explore differences in hardened container images, SBOMs, software provenance, SLSA builds, and secure software supply chain practices.",
} as const;

/** Full H1, also used as the BreadcrumbList leaf. */
export const TITLE =
  "Docker Hardened Images vs CleanStart: Secure Container Images Compared";

/**
 * The H1 split for display. The hero sets the first half plain and the second
 * half in the brand gradient, so the title reads as one line of type rather
 * than as a coloured product name dropped into a sentence.
 */
export const TITLE_PARTS = {
  lead: "Docker Hardened Images vs ",
  accent: "CleanStart",
  tail: ": Secure Container Images Compared",
} as const;

export const STANDFIRST =
  "Compare Docker Hardened Images and CleanStart across container security, software provenance, reproducible builds, and software supply chain verification.";

/** The two vendors, named once. Every section labels its columns from here. */
export const VENDOR = {
  docker: "Docker Hardened Images",
  cleanstart: "CleanStart",
} as const;

export const HERO_CTA = {
  label: "Explore CleanStart Images",
  href: "/cleanstart-images",
} as const;

/* ───────────────────────── hero diagram ───────────────────────── */

/**
 * The hero artwork states the page's argument in one picture: Docker's stack
 * stands on a base it inherits from an upstream distribution, CleanStart's
 * stands on nothing. Both label sets are drawn from the matrix rows below, so
 * the diagram never claims anything the table does not.
 */
export const HERO_DIAGRAM = {
  caption:
    "Where each stack starts: Docker Hardened Images harden an inherited Debian or Alpine base, CleanStart compiles every layer from verified source.",
  docker: {
    inherited: { label: "Upstream distro", detail: "Debian · Alpine" },
    link: "inherits",
    layers: ["Reduced packages", "Hardened configuration", "Attested image"],
  },
  cleanstart: {
    inherited: { label: "Nothing inherited", detail: "zero upstream base" },
    link: "builds from source",
    layers: ["Verified source", "Hermetic build", "Signed artifact"],
  },
} as const;

/* ─────────────────────── section 1: foundations ─────────────────────── */

export const FOUNDATIONS = {
  heading:
    "What Are Docker Hardened Images and How Do They Compare With CleanStart?",
  intro:
    "Docker Hardened Images and CleanStart take different approaches to container security. Both aim to reduce risk in the software supply chain, but they start from different foundations: one hardens an existing base, the other builds from verified source.",
  columns: [
    {
      id: "docker",
      label: "Docker Hardened Images",
      body: "Docker Hardened Images provide hardened container images designed to reduce attack surface and improve container security.",
      focusLabel: "Docker focuses on:",
      focus: [
        "Debian and Alpine-based foundations",
        "Minimal production images",
        "Reproducible builds",
        "Supply chain metadata and attestations",
      ],
    },
    {
      id: "cleanstart",
      label: "CleanStart Verified Images",
      body: "CleanStart provides verified container images built through controlled software supply chain processes designed to establish artifact trust.",
      focusLabel: "CleanStart focuses on:",
      focus: [
        "Distroless foundations",
        "Source-based builds",
        "Reproducible & hermetic build processes",
        "Provenance & cryptographic verification",
      ],
    },
  ],
} as const;

/* ───────────────────────── section 2: matrix ───────────────────────── */

/**
 * A matrix cell. `yes` / `no` render as markers with a screen-reader label;
 * `text` renders the document's phrase. The document's own "✓" and "—" glyphs
 * map to `yes` and `no` so the markers can carry an accessible name and a
 * colour rather than sitting in the page as bare punctuation.
 */
export type MatrixCell =
  | { readonly kind: "yes" }
  | { readonly kind: "no" }
  | { readonly kind: "text"; readonly value: string };

export interface MatrixRow {
  readonly id: string;
  readonly capability: string;
  readonly docker: MatrixCell;
  readonly cleanstart: MatrixCell;
}

export interface MatrixGroup {
  readonly id: string;
  readonly label: string;
  readonly rows: readonly MatrixRow[];
}

const yes: MatrixCell = { kind: "yes" };
const no: MatrixCell = { kind: "no" };
const text = (value: string): MatrixCell => ({ kind: "text", value });

export const MATRIX = {
  heading:
    "Docker Hardened Images vs CleanStart: Container Security Comparison",
  intro:
    "Both Docker Hardened Images and CleanStart provide hardened container images with security metadata, signatures, and provenance. The difference lies in their approach to building, verifying, and maintaining software artifacts across the supply chain.",
  caption:
    "Capability comparison between Docker Hardened Images and CleanStart, grouped by image foundation, build and supply chain security, software transparency, and security and compliance.",
  footnote:
    "Comparison reflects each platform's published approach and CleanStart's documented capabilities as of September 2026. Specific behavior varies by image and variant.",
  groups: [
    {
      id: "foundation",
      label: "Image Foundation",
      rows: [
        {
          id: "base-foundation",
          capability: "Base foundation",
          docker: text("Debian and Alpine-based images"),
          cleanstart: text(
            "CleanStart OS: source-built minimal image (no inherited base)",
          ),
        },
        {
          id: "image-hardening",
          capability: "Image hardening",
          docker: text(
            "Reduced packages, hardened configurations, secure defaults",
          ),
          cleanstart: text(
            "Compiled from source on a zero-inheritance foundation (custom glibc). Security flags set at build time; FIPS built in, not bolted on. Verified by a 78-test suite and 11 signed artifacts per variant.",
          ),
        },
        {
          id: "production-variants",
          capability: "Production variants",
          docker: text("Production, development, compatibility variants"),
          cleanstart: text("Production, development, debug variants"),
        },
      ],
    },
    {
      id: "build",
      label: "Build & Supply Chain Security",
      rows: [
        {
          id: "zero-inheritance",
          capability: "Zero-inheritance architecture",
          docker: text("Hardens existing Debian/Alpine base (inherits upstream)"),
          cleanstart: text(
            "Inherits nothing from upstream distros; every component compiled from verified source",
          ),
        },
        {
          id: "public-build-definitions",
          capability: "Public build definitions",
          docker: yes,
          cleanstart: text("Controlled build pipelines"),
        },
        {
          id: "source-based-builds",
          capability: "Source-based builds",
          docker: no,
          cleanstart: yes,
        },
        {
          id: "hermetic-build",
          capability: "Hermetic build process",
          docker: text("Not fully hermetic"),
          cleanstart: yes,
        },
        {
          id: "artifact-verification",
          capability: "Artifact verification",
          docker: text("Image attestations and signatures"),
          cleanstart: text(
            "Artifact verification through provenance and cryptographic signing",
          ),
        },
      ],
    },
    {
      id: "transparency",
      label: "Software Transparency",
      rows: [
        {
          id: "sboms",
          capability: "SBOMs",
          docker: text("SPDX and CycloneDX SBOMs"),
          cleanstart: text("SPDX and CycloneDX SBOMs"),
        },
        {
          id: "image-signing",
          capability: "Image signing",
          docker: text("Cosign signatures"),
          cleanstart: text("Cosign signatures"),
        },
        {
          id: "provenance",
          capability: "Software provenance",
          docker: text("SLSA Build Level 3 provenance"),
          cleanstart: text("SLSA Level 3 aligned provenance"),
        },
        {
          id: "vex",
          capability: "VEX / exploitability context",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "ai-bom",
          capability: "AI BOM",
          docker: no,
          cleanstart: yes,
        },
      ],
    },
    {
      id: "compliance",
      label: "Security & Compliance",
      rows: [
        {
          id: "fips",
          capability: "FIPS-ready images",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "stig",
          capability: "STIG-aligned images",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "compliance-artifacts",
          capability: "Compliance artifacts",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "vulnerability-intelligence",
          capability: "Vulnerability intelligence",
          docker: text("CVE metadata, VEX, security attestations"),
          cleanstart: text(
            "Vulnerability analysis, exploitability context, and verification workflows",
          ),
        },
        {
          id: "remediation-model",
          capability: "Vulnerability remediation model",
          docker: text("Patch-based, up to 7 days (paid-tier SLA)"),
          cleanstart: text(
            "Automatic rebuild from source via Continuous Trust Loop, ~24h",
          ),
        },
        {
          id: "vulnerability-data-accuracy",
          capability: "Vulnerability data accuracy",
          docker: no,
          cleanstart: yes,
        },
        {
          id: "shell-less",
          capability: "Shell-less and read-only",
          docker: no,
          cleanstart: yes,
        },
      ],
    },
  ] as const satisfies readonly MatrixGroup[],
} as const;

/** Row count, derived so the section summary can never drift from the table. */
export const MATRIX_ROW_COUNT = MATRIX.groups.reduce(
  (total, group) => total + group.rows.length,
  0,
);

/* ──────────────────────── section 3: build flow ──────────────────────── */

export interface BuildFlowColumn {
  readonly id: "docker" | "cleanstart";
  readonly label: string;
  readonly body: string;
  readonly stepsLabel: string;
  readonly steps: readonly string[];
  readonly traitsLabel: string;
  readonly traits: readonly string[];
}

export const BUILD_FLOW = {
  heading:
    "How Do Docker Hardened Images and CleanStart Build Secure Container Images?",
  intro:
    "The two platforms secure containers at different points in the lifecycle. Docker hardens a container foundation and validates the result; CleanStart verifies everything from source through to the final signed artifact.",
  columns: [
    {
      id: "docker",
      label: "Docker Hardened Images",
      body: "Docker Hardened Images follow a hardened image approach designed to secure container foundations.",
      stepsLabel: "Build approach:",
      steps: [
        "Base Container Foundation",
        "Security Hardening",
        "Testing & Validation",
        "Signed Container Image",
        "Production Deployment",
      ],
      traitsLabel: "Key characteristics:",
      traits: [
        "Hardened base images",
        "Minimal production variants",
        "Image attestations and metadata",
      ],
    },
    {
      id: "cleanstart",
      label: "CleanStart Verified Images",
      body: "CleanStart builds verified container images through controlled software supply chain processes.",
      stepsLabel: "Build approach:",
      steps: [
        "Source Code",
        "Source Verification",
        "Controlled Build Pipeline",
        "SBOM + Provenance Generation",
        "Cryptographic Signing",
        "Verified Container Image",
        "Production Deployment",
      ],
      traitsLabel: "Key characteristics:",
      traits: [
        "Source-built images",
        "Reproducible & hermetic build processes",
        "Software provenance",
        "Artifact verification",
      ],
    },
  ] as const satisfies readonly BuildFlowColumn[],
} as const;

/* ────────────────────── section 4: differentiators ────────────────────── */

export const DIFFERENTIATORS = {
  heading: "Where CleanStart Differentiates",
  items: [
    {
      id: "source-to-artifact",
      /** Document H2 — renders as the page's H3. */
      heading: "Source-to-Artifact Verification",
      body: "CleanStart emphasizes verification across the artifact lifecycle, from source inputs through reproducible builds and final image delivery.",
      /** Chained cubes: the unbroken link from source input to delivered image. */
      icon: "/images/compare/icon-provenance.webp",
    },
    {
      id: "reproducible-builds",
      heading: "Reproducible Build Confidence",
      body: "Security teams can validate how artifacts are created and reproduce build outcomes through controlled build processes.",
      icon: "/images/compare/icon-signed-artifact.webp",
    },
    {
      id: "verified-foundations",
      heading: "Verified Software Foundations",
      body: "CleanStart extends container security into broader software supply chain assurance across images, libraries, and dependencies.",
      /** Manifest plus components: images, libraries and dependencies together. */
      icon: "/images/compare/icon-sbom.webp",
    },
  ],
} as const;

/* ───────────────────────────── section 5: FAQ ───────────────────────────── */

export interface CompareFaq {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

export const FAQ_HEADING = "Frequently Asked Questions";

export const FAQS = [
  {
    id: "what-are-dhi",
    question: "What are Docker Hardened Images?",
    answer:
      "Docker Hardened Images are minimal, security-focused container images built to reduce attack surface and improve container security. They are based on Debian and Alpine foundations, ship as minimal production variants with reduced packages and secure defaults, and include supply chain metadata such as SBOMs, Cosign signatures, SLSA Build Level 3 provenance and VEX exploitability context.",
  },
  {
    id: "difference",
    question:
      "What is the difference between Docker Hardened Images and CleanStart?",
    answer:
      "Both provide hardened container images with SBOMs, Cosign signatures and SLSA-aligned provenance. The core difference is architecture: Docker Hardened Images harden existing Debian and Alpine base images and inherit from upstream distributions, while CleanStart uses a zero-inheritance model where every component is compiled from verified source on the CleanStart OS foundation (custom glibc), with hermetic builds, FIPS built in at build time, an AI BOM, and shell-less, read-only images.",
  },
  {
    id: "alternative",
    question: "Is CleanStart a good alternative to Docker Hardened Images?",
    answer:
      "Yes. CleanStart is a strong alternative for teams that need deeper software supply chain assurance. It builds verified images from source with reproducible and hermetic pipelines, inherits nothing from upstream distributions, provides provenance and cryptographic verification, and extends coverage across images, libraries and dependencies rather than container images alone.",
  },
  {
    id: "more-secure",
    question: "Which platform builds more secure container images?",
    answer:
      "Both are secure by design. Docker hardens a known base and adds attestations and signatures. CleanStart removes inherited risk entirely by compiling every component from verified source on a zero-inheritance foundation, hardening at build time, and validating each variant with a 78-test suite and 11 signed artifacts. Teams that prioritize source-to-artifact verification and hermetic builds generally favor CleanStart's approach.",
  },
  {
    id: "compliance",
    question: "Which solution offers better compliance support?",
    answer:
      "Both offer FIPS-ready and STIG-aligned images plus compliance artifacts. CleanStart builds FIPS in at compile time rather than bolting it on afterward, and pairs it with SBOMs, provenance and an AI BOM, which gives auditors a consistent, source-verified evidence trail for regulated environments.",
  },
  {
    id: "vulnerability-effort",
    question: "Which platform reduces vulnerability management effort the most?",
    answer:
      "Both reduce effort by shipping minimal images with less to patch. Docker uses patch-based remediation with fixes typically within 7 days on paid tiers. CleanStart automatically rebuilds affected images from source through its Continuous Trust Loop, targeting roughly 24-hour remediation, and adds vulnerability data accuracy and exploitability context so teams spend less time triaging false positives.",
  },
  {
    id: "advantages",
    question:
      "What are the advantages of CleanStart over Docker Hardened Images?",
    answer:
      "CleanStart's advantages include a zero-inheritance architecture (no upstream distro risk), source-based and hermetic builds, FIPS built in at build time, an AI BOM, shell-less and read-only images, faster source-based remediation via the Continuous Trust Loop, and supply chain assurance that extends across images, libraries and dependencies.",
  },
  {
    id: "devsecops",
    question: "Which hardened image solution is best for DevSecOps teams?",
    answer:
      "Both ship signed, attested images with SBOMs and SLSA-aligned provenance that plug into CI/CD gates and admission control. DevSecOps teams that want to verify how every artifact is built from source, reproduce build outcomes, and enforce provenance across images, libraries and dependencies tend to prefer CleanStart's source-to-artifact model.",
  },
] as const satisfies readonly CompareFaq[];

/* ───────────────────────────────── CTA ───────────────────────────────── */

export const CTA = {
  heading: "Build With Verified Container Images",
  body: "Secure your software supply chain with CleanStart Images built from source, backed by SBOMs, software provenance, and cryptographic verification.",
  button: "Start Building With CleanStart",
  href: "https://images.cleanstart.com",
} as const;

/* ──────────────────────── UI-only strings ──────────────────────── */

/**
 * Chrome the document does not write: link labels, accessible names and the
 * two marker states in the matrix. Kept apart from the copy above so a future
 * document diff never has to reason about them.
 */
export const UI = {
  jumpToMatrix: "Compare capabilities",
  available: "Available",
  notAvailable: "Not available",
  faqIntro:
    "Common questions about hardened container images, provenance, reproducible builds and compliance evidence.",
} as const;
