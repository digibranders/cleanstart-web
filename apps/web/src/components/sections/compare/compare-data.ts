/**
 * Every string on `/compare/cleanstart-vs-docker-hardened-images`.
 *
 * The page is held to the SEO source document ("Docker Hardened Images vs
 * CleanStart - Final"). Copy here is the document's, verbatim, with one class
 * of edit: em-dashes are replaced with a colon or a semicolon per the house
 * writing rule. Nothing is added, cut or re-worded.
 *
 * The capability matrix was replaced wholesale on 2026-09-08 from a newer
 * final table: five groups and 32 rows, up from four and 20. Two things in it
 * still needs the source's own answer and is NOT invented here: the FIPS and
 * "Remediation SLA: High / Medium / Low" cells carry footnote markers [1] and
 * [4] in the source, and the footnote text was not supplied, so the markers
 * are omitted rather than left dangling.
 *
 * Five FAQ answers were rewritten on 2026-09-08 to stop contradicting that
 * table. They had claimed roughly 24-hour remediation against its seven-day
 * Critical SLA, and cited a 78-test suite, 11 signed artifacts, shell-less and
 * read-only images, "vulnerability data accuracy" and the Continuous Trust
 * Loop, none of which the new table carries. Every replacement clause is
 * traceable to a cell in it, and nothing was added beyond what it states. The
 * FIPS answer changed direction as a result: the table gives Docker
 * CMVP-validated variants, so the old "CleanStart builds FIPS in at compile
 * time rather than bolting it on" read as a claim the table does not support.
 * These are derived rewrites, not the SEO document's own words, and want its
 * review. The array feeds the FAQPage JSON-LD as well as the accordion, so the
 * structured data moved with them.
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
 * The displayed H1. The hero shows the comparison itself and leaves the
 * document title's ": Secure Container Images Compared" suffix to the page
 * title and breadcrumb (`TITLE`), per the 2026-09-03 design review. The
 * brand name takes the gradient so the title reads as one line of type.
 */
export const TITLE_PARTS = {
  lead: "Docker Hardened Images vs ",
  accent: "CleanStart",
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

/* ───────────────────────── shared fragments ───────────────────────── */

/**
 * The base Docker Hardened Images inherit, lifted verbatim from the capability
 * matrix's "Base foundation" row. The build-flow diagram draws it as the ghost
 * ahead of Docker's lane, which is why it lives here rather than inside that
 * component.
 */
export const INHERITED_BASE = {
  label: "Debian and Alpine-based images",
  note: "inherits upstream",
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
 * `text` renders the document's phrase; `both` is the source table's "✓
 * <detail>" shape, a tick with a qualifier beside it. The document's own "✓"
 * and "—" glyphs map to `yes` and `no` so the markers can carry an accessible
 * name and a colour rather than sitting in the page as bare punctuation.
 */
export type MatrixCell =
  | { readonly kind: "yes" }
  | { readonly kind: "no" }
  | { readonly kind: "both"; readonly value: string }
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
  /** Violet 3D icon that opens the group's chapter in the rendered table. */
  readonly icon: string;
  readonly rows: readonly MatrixRow[];
}

const yes: MatrixCell = { kind: "yes" };
const no: MatrixCell = { kind: "no" };
const text = (value: string): MatrixCell => ({ kind: "text", value });
/** A tick that carries a qualifier, the source table's "✓ <detail>" cells. */
const both = (value: string): MatrixCell => ({ kind: "both", value });

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
      icon: "/images/compare/icon-origin.webp",
      rows: [
        {
          id: "base-foundation",
          capability: "Base foundation",
          docker: text("Debian- and Alpine-based"),
          cleanstart: text("CleanStart OS"),
        },
        {
          id: "zero-inheritance",
          capability: "Zero-inheritance architecture",
          docker: text("Hardens an existing distro base"),
          cleanstart: text("Every component compiled from verified source"),
        },
        {
          id: "hardening-method",
          capability: "Hardening method",
          docker: text("Package reduction, hardened configuration, secure defaults"),
          cleanstart: text(
            "Compile-time hardening flags on a custom glibc, set at build rather than applied after",
          ),
        },
        {
          id: "distroless-variants",
          capability: "Distroless variants",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "variants",
          capability: "Production / dev / debug variants",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "architectures",
          capability: "linux/amd64 + linux/arm64",
          docker: yes,
          cleanstart: yes,
        },
      ],
    },
    {
      id: "build",
      label: "Build & Supply Chain Security",
      icon: "/images/compare/icon-provenance.webp",
      rows: [
        {
          id: "rebuilt-from-source",
          capability: "Rebuilt from source",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "hermetic-build",
          capability: "Hermetic build pipeline",
          docker: no,
          cleanstart: yes,
        },
        {
          id: "reproducible-builds",
          capability: "Reproducible builds",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "package-origin",
          capability: "Verified package-origin enforcement",
          docker: no,
          cleanstart: yes,
        },
        {
          id: "public-build-definitions",
          capability: "Public build definitions",
          docker: yes,
          cleanstart: no,
        },
        {
          id: "artifact-verification",
          capability: "Artifact verification",
          docker: both("Attestations and signatures"),
          cleanstart: both("Provenance and cryptographic signing"),
        },
      ],
    },
    {
      id: "transparency",
      label: "Software Transparency",
      icon: "/images/compare/icon-sbom.webp",
      rows: [
        {
          id: "sbom",
          capability: "SPDX + CycloneDX SBOM",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "signing",
          capability: "Cosign / Sigstore signing",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "slsa-provenance",
          capability: "SLSA provenance",
          docker: both("Build Level 3"),
          cleanstart: both("Build Level 3"),
        },
        {
          id: "in-toto",
          capability: "in-toto attestation format",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "vex",
          capability: "VEX / exploitability context",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "reachability-vex",
          capability: "Reachability-backed VEX evidence",
          docker: no,
          cleanstart: yes,
        },
        {
          id: "verdict-metadata",
          capability:
            "Reproducible verdict metadata (engine + CVE/KEV/EPSS snapshot versions)",
          docker: no,
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
      icon: "/images/compare/icon-regulatory.webp",
      rows: [
        {
          id: "fips",
          capability: "FIPS images",
          docker: both("CMVP-validated variants, Select/Enterprise"),
          cleanstart: both("FIPS-compliant set"),
        },
        {
          id: "stig",
          capability: "STIG-aligned images",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "cis",
          capability: "CIS Benchmark alignment",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "catalog-labels",
          capability: "Per-image compliance labels in catalog",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "compliance-artifacts",
          capability: "Compliance artifacts / audit evidence",
          docker: yes,
          cleanstart: yes,
        },
      ],
    },
    {
      id: "vulnerability",
      label: "Vulnerability Management & Remediation",
      icon: "/images/compare/icon-fips.webp",
      rows: [
        {
          id: "event-driven-rebuild",
          capability: "Continuous event-driven rebuild on upstream fix",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "sla-critical",
          capability: "Remediation SLA: Critical",
          docker: both("7 days"),
          cleanstart: both("7 days"),
        },
        {
          id: "sla-high-medium-low",
          capability: "Remediation SLA: High / Medium / Low",
          docker: no,
          cleanstart: both("14 days"),
        },
        {
          id: "vulnerability-intelligence",
          capability: "Vulnerability intelligence",
          docker: text("CVE metadata, VEX, security attestations"),
          cleanstart: text(
            "Vulnerability analysis, exploitability context, verification workflows",
          ),
        },
        {
          id: "malware-scanning",
          capability: "Malware scanning",
          docker: yes,
          cleanstart: yes,
        },
        {
          id: "malicious-package-screening",
          capability: "Malicious-package corpus screening",
          docker: yes,
          cleanstart: both(
            "Campaign correlation (maintainer clustering, shared C2, install-script AST fingerprints)",
          ),
        },
        {
          id: "kev-epss",
          capability: "KEV / EPSS enrichment",
          docker: no,
          cleanstart: yes,
        },
      ],
    },
  ] as const satisfies readonly MatrixGroup[]
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
      /** Sealed cube: the delivered image carrying its verification. */
      icon: "/images/compare/icon-signed-artifact.webp",
    },
    {
      id: "reproducible-builds",
      heading: "Reproducible Build Confidence",
      body: "Security teams can validate how artifacts are created and reproduce build outcomes through controlled build processes.",
      /** Checked list under a shield: build outcomes validated. */
      icon: "/images/compare/icon-stig.webp",
    },
    {
      id: "verified-foundations",
      heading: "Verified Software Foundations",
      body: "CleanStart extends container security into broader software supply chain assurance across images, libraries, and dependencies.",
      /** Shield with a seal: assurance across the whole foundation. */
      icon: "/images/compare/icon-fips.webp",
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
      "Both provide hardened container images with SPDX and CycloneDX SBOMs, Cosign and Sigstore signing, and SLSA Build Level 3 provenance. The core difference is architecture: Docker Hardened Images harden an existing Debian or Alpine base and inherit from upstream distributions, while CleanStart compiles every component from verified source on the CleanStart OS foundation, setting hardening flags at compile time on a custom glibc rather than applying them afterward, through a hermetic build pipeline with verified package-origin enforcement and an AI BOM.",
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
      "Both are secure by design. Docker hardens a known base and adds attestations and signatures. CleanStart removes inherited risk by compiling every component from verified source on a zero-inheritance foundation, setting hardening flags at compile time on a custom glibc, and enforcing verified package origin inside a hermetic build pipeline. Teams that prioritize source-to-artifact verification and hermetic builds generally favor CleanStart's approach.",
  },
  {
    id: "compliance",
    question: "Which solution offers better compliance support?",
    answer:
      "Both ship STIG-aligned images, CIS Benchmark alignment, per-image compliance labels in the catalog, and compliance artifacts for audit evidence. On FIPS they differ in kind: Docker Hardened Images offer CMVP-validated variants on their Select and Enterprise tiers, while CleanStart ships a FIPS-compliant set. CleanStart pairs that with SBOMs, provenance and an AI BOM, which gives auditors a source-verified evidence trail for regulated environments.",
  },
  {
    id: "vulnerability-effort",
    question: "Which platform reduces vulnerability management effort the most?",
    answer:
      "Both reduce effort by shipping minimal images with less to patch, rebuilding continuously when an upstream fix lands, and meeting a seven-day remediation SLA for Critical findings. CleanStart also publishes a 14-day SLA for High, Medium and Low. Its vulnerability intelligence adds exploitability context and verification workflows, reachability-backed VEX evidence, and KEV and EPSS enrichment, so teams spend less time triaging findings that are not reachable in their images.",
  },
  {
    id: "advantages",
    question:
      "What are the advantages of CleanStart over Docker Hardened Images?",
    answer:
      "CleanStart's advantages include a zero-inheritance architecture (no upstream distro risk), a hermetic build pipeline with verified package-origin enforcement, an AI BOM, reachability-backed VEX evidence, reproducible verdict metadata, KEV and EPSS enrichment, a published remediation SLA for High, Medium and Low findings as well as Critical, and supply chain assurance that extends across images, libraries and dependencies.",
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
  /** Marker on the divider between the two vendor columns. */
  versus: "vs",
  /** Column caption for the capability column in the matrix head. */
  capability: "Capability",
  /** Matrix controls and legend. */
  groupIndex: "Jump to",
  differencesOnly: "Show differences only",
  legendAvailable: "Available",
  legendNotAvailable: "Not available",
} as const;
