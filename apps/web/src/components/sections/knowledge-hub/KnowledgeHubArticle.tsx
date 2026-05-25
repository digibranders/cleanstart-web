import Link from "next/link";

const SIDEBAR_GROUPS: Array<{
  title: string;
  items: Array<{ label: string; href: string; active?: boolean }>;
}> = [
  {
    title: "Cleanstart Platform",
    items: [
      { label: "Getting Started", href: "#", active: true },
      { label: "Security Guidance", href: "#" },
      { label: "Compliance and Certification", href: "#" },
    ],
  },
];

const PROSE_TEXT_STYLE = {
  fontSize: "clamp(1.0625rem, 1.2vw, 1.1875rem)",
  lineHeight: "1.65",
  letterSpacing: "-0.01em",
  color: "#1f2030",
};

const SECTION_HEADING_STYLE = {
  fontSize: "clamp(1.5rem, 2vw, 2rem)",
  lineHeight: 1.2,
  letterSpacing: "-0.03em",
  color: "#0F1023",
};

const SUB_HEADING_STYLE = {
  fontSize: "clamp(1.125rem, 1.4vw, 1.375rem)",
  lineHeight: 1.3,
  letterSpacing: "-0.02em",
  color: "#0F1023",
};

export function KnowledgeHubArticle(): React.ReactElement {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-16 lg:pt-24 pb-section-cta">
        <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
          <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-112px)] lg:overflow-y-auto">
            <nav aria-label="Knowledge Hub categories" className="flex flex-col gap-8">
              {SIDEBAR_GROUPS.map((group) => (
                <div key={group.title} className="flex flex-col gap-4">
                  <h2
                    className="font-display font-semibold"
                    style={{
                      fontSize: "clamp(15px, 1.15vw, 18px)",
                      letterSpacing: "-0.02em",
                      color: "#471EC0",
                    }}
                  >
                    {group.title}
                  </h2>
                  <ul className="flex flex-col gap-3 border-l border-[#E5E7EF] pl-5">
                    {group.items.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="block transition-colors"
                          style={{
                            fontSize: "clamp(13px, 1vw, 15px)",
                            lineHeight: 1.4,
                            color: item.active ? "#0F1023" : "#5A5F75",
                            fontWeight: item.active ? 600 : 400,
                          }}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          <article className="min-w-0">
            <CategoryBadge>Emerging Standards</CategoryBadge>

            <h1
              className="font-display font-semibold mt-4"
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                color: "#0F1023",
              }}
            >
              How to Use VEX Documents to Suppress Non-Exploitable CVEs in Your
              Pipeline
            </h1>

            <p
              className="mt-6 font-medium"
              style={{
                fontSize: "clamp(1.0625rem, 1.2vw, 1.1875rem)",
                lineHeight: 1.5,
                letterSpacing: "-0.01em",
                color: "#3A3F55",
              }}
            >
              CleanStart addresses several critical challenges that plague
              traditional container security approaches.
            </p>

            <div className="mt-12 flex flex-col gap-14">
              <Section heading="Overview">
                <p style={PROSE_TEXT_STYLE}>
                  Vulnerability Exploitability eXchange (VEX) is an emerging
                  standard that enables software suppliers and security teams
                  to communicate whether vulnerabilities in software components
                  are actually exploitable in a specific product context. By
                  integrating VEX documents into your CI/CD pipeline, you can
                  automatically suppress false-positive CVE alerts and focus
                  remediation efforts on vulnerabilities that pose genuine
                  risk. This knowledge base article explains how to create,
                  manage, and integrate VEX documents into your security
                  scanning workflow to reduce vulnerability noise and improve
                  triage efficiency.
                </p>
              </Section>

              <Section heading="The Problem: CVE Alert Fatigue">
                <p style={PROSE_TEXT_STYLE}>
                  Modern applications contain hundreds or thousands of
                  dependencies. When vulnerability scanners analyze a Software
                  Bill of Materials (SBOM), they often flag numerous CVEs that,
                  while technically present in a component, cannot actually be
                  exploited in your specific deployment context. Common reasons
                  include: Vulnerable code not loaded: The affected function or
                  class is excluded during compilation or never invoked at
                  runtime. Configuration prevents exploitation: The vulnerable
                  feature is disabled in your deployment configuration.
                  Mitigations already in place: Sandboxing, input validation,
                  or other controls neutralize the attack vector. Component
                  not deployed: Test or development dependencies are flagged
                  but never ship to production. Without a mechanism to
                  communicate this context, security teams waste significant
                  time investigating non-exploitable vulnerabilities, and
                  pipelines may fail unnecessarily on CVEs that pose no real
                  risk.
                </p>
              </Section>

              <Section heading="What is VEX?">
                <p style={PROSE_TEXT_STYLE}>
                  VEX was developed by the National Telecommunications and
                  Information Administration (NTIA) in 2021 and further refined
                  by CISA through a multi-stakeholder working group. It
                  provides a machine-readable format for declaring the
                  exploitability status of vulnerabilities, designed to
                  complement SBOMs.
                </p>
                <p className="mt-4" style={PROSE_TEXT_STYLE}>
                  A VEX document asserts one of four statuses for each
                  vulnerability-product combination:
                </p>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr style={{ background: "#F4F2FB" }}>
                        <Th>Status</Th>
                        <Th>Description</Th>
                      </tr>
                    </thead>
                    <tbody>
                      <Tr>
                        <Td bold>Not Affected</Td>
                        <Td>
                          No remediation is required. The vulnerability cannot
                          be exploited in this product context.
                        </Td>
                      </Tr>
                      <Tr>
                        <Td bold>Affected</Td>
                        <Td>
                          Actions are recommended to remediate or mitigate the
                          vulnerability.
                        </Td>
                      </Tr>
                      <Tr>
                        <Td bold>Fixed</Td>
                        <Td>
                          The product version contains a fix for the
                          vulnerability.
                        </Td>
                      </Tr>
                      <Tr>
                        <Td bold>Under Investigation</Td>
                        <Td>
                          The exploitability is not yet determined. Updates
                          will follow.
                        </Td>
                      </Tr>
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section heading="VEX Format Options">
                <p style={PROSE_TEXT_STYLE}>
                  VEX can be expressed in multiple formats. Choose based on
                  your tooling ecosystem and interoperability requirements:
                </p>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr style={{ background: "#F4F2FB" }}>
                        <Th>Format</Th>
                        <Th>Strengths</Th>
                        <Th>Best For</Th>
                      </tr>
                    </thead>
                    <tbody>
                      <Tr>
                        <Td bold>OpenVEX</Td>
                        <Td>
                          Minimal JSON-LD format, SBOM-agnostic, uses Package
                          URLs (PURLs). Easy to embed in attestations.
                        </Td>
                        <Td>
                          Cloud-native environments, container security,
                          Sigstore integration.
                        </Td>
                      </Tr>
                      <Tr>
                        <Td bold>CSAF VEX</Td>
                        <Td>
                          Rich product tree support, remediation details, OASIS
                          standard. Supports complex product hierarchies.
                        </Td>
                        <Td>
                          Enterprise vendors with multiple product lines,
                          regulatory compliance (FEDRAMP).
                        </Td>
                      </Tr>
                      <Tr>
                        <Td bold>CycloneDX VEX</Td>
                        <Td>
                          Native integration with CycloneDX SBOMs. VEX can be
                          embedded directly or referenced externally.
                        </Td>
                        <Td>
                          Organizations already using CycloneDX for SBOM
                          generation.
                        </Td>
                      </Tr>
                      <Tr>
                        <Td bold>SPDX 3.0</Td>
                        <Td>
                          VEX support in Security profile. ISO/IEC standard,
                          strong open-source community support.
                        </Td>
                        <Td>
                          Open source projects, Linux Foundation ecosystem.
                        </Td>
                      </Tr>
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section heading="Integrating VEX into Your CI/CD Pipeline">
                <p style={PROSE_TEXT_STYLE}>
                  The goal is to make VEX consumption a required step after
                  vulnerability scanning, allowing your pipeline to
                  automatically filter out non-exploitable CVEs before failing
                  builds or creating tickets.
                </p>

                <h3
                  className="mt-10 font-display font-semibold"
                  style={SUB_HEADING_STYLE}
                >
                  Pipeline Workflow
                </h3>
                <p className="mt-3" style={PROSE_TEXT_STYLE}>
                  The goal is to make VEX consumption a required step after
                  vulnerability scanning, allowing your pipeline to
                  automatically filter out non-exploitable CVEs before failing
                  builds or creating tickets.
                </p>

                <ol className="mt-6 flex flex-col gap-3">
                  <Step
                    n={1}
                    title="SBOM Generation"
                    body="Generate an SBOM using tools like Trivy, Syft, or your SCA solution. Output in CycloneDX or SPDX format."
                  />
                  <Step
                    n={2}
                    title="Vulnerability Scan"
                    body="Scan the SBOM against vulnerability databases (NVD, OSV) to identify CVEs affecting your components."
                  />
                  <Step
                    n={3}
                    title="VEX Consumption"
                    body="Query your VEX data source (local file, artifact repository, or API) to check each CVE's exploitability status."
                  />
                  <Step
                    n={4}
                    title="Policy Evaluation"
                    body="Apply policy rules to determine build outcomes based on VEX-adjusted vulnerability data."
                  />
                  <Step
                    n={5}
                    title="Report and Act"
                    body="Generate filtered reports showing only actionable vulnerabilities. Route findings appropriately."
                  />
                </ol>

                <h3
                  className="mt-12 font-display font-semibold"
                  style={SUB_HEADING_STYLE}
                >
                  Example: Using Trivy with VEX
                </h3>
                <p className="mt-3" style={PROSE_TEXT_STYLE}>
                  Trivy natively supports VEX in OpenVEX and CSAF formats. To
                  filter vulnerabilities using a VEX document:
                </p>
                <CodeBlock>
                  trivy image myapp:latest --vex ./vex-statements.openvex.json
                </CodeBlock>
                <p className="mt-6" style={PROSE_TEXT_STYLE}>
                  When a CVE listed in your VEX document has status
                  &ldquo;not_affected,&rdquo; Trivy logs that it filtered out
                  the vulnerability and excludes it from the final report.
                </p>

                <h3
                  className="mt-12 font-display font-semibold"
                  style={SUB_HEADING_STYLE}
                >
                  Example: Using cve-bin-tool with VEX
                </h3>
                <p className="mt-3" style={PROSE_TEXT_STYLE}>
                  The CVE Binary Tool supports VEX as a triage mechanism:
                </p>
                <CodeBlock>
                  cve-bin-tool --sbom sbom.json --vex-file vex.json
                  --filter-triage
                </CodeBlock>
                <p className="mt-6" style={PROSE_TEXT_STYLE}>
                  The --filter-triage flag removes vulnerabilities marked as
                  NotAffected or FalsePositive from the output.
                </p>
              </Section>

              <Section heading="Creating VEX Documents">
                <p style={PROSE_TEXT_STYLE}>
                  Using vexctl (OpenVEX) The vexctl tool from the OpenVEX
                  project creates and manages VEX documents:
                </p>
                <CodeBlock multiline>
                  {`# Create a VEX statement declaring a CVE as not affected
vexctl create \\
  --product="pkg:npm/myapp@1.0.0" \\
  --vuln="CVE-2024-12345" \\
  --status="not_affected" \\
  --justification="vulnerable_code_not_in_execute_path"`}
                </CodeBlock>
              </Section>

              <Section heading="Sample OpenVEX Document">
                <CodeBlock multiline>
                  {`{
  "@context": "https://openvex.dev/ns/v0.2.0",
  "@id": "https://example.com/vex/myapp-v1",
  "author": "security-team@example.com",
  "timestamp": "2026-01-23T10:00:00Z",
  "version": 1,
  "statements": [{
    "vulnerability": { "name": "CVE-2024-12345" },
    "products": ["pkg:npm/myapp@1.0.0"],
    "status": "not_affected",
    "justification": "vulnerable_code_not_in_execute_path",
    "impact_statement": "The affected function parseXML() is never called by our application."
  }]
}`}
                </CodeBlock>
              </Section>

              <Section heading="Governance and Best Practices">
                <p style={PROSE_TEXT_STYLE}>
                  Implementing VEX requires clear ownership and processes:
                  Establish ownership: Define who can create and approve VEX
                  statements. Security engineers should validate justifications
                  before pipeline integration. Version control VEX documents:
                  Store VEX files in Git alongside your code. This creates an
                  auditable history of security decisions. Define evidence
                  requirements: Document what constitutes sufficient evidence
                  for each justification type. Code analysis, runtime
                  verification, or architecture review may be required. Review
                  periodically: VEX statements should be reviewed when new
                  information emerges. A &ldquo;not_affected&rdquo; status may
                  change if exploitation techniques evolve. Sign attestations:
                  For high-assurance environments, cryptographically sign VEX
                  documents using Sigstore or similar mechanisms.
                </p>
              </Section>

              <Section heading="Vendor VEX Sources">
                <p style={PROSE_TEXT_STYLE}>
                  Major vendors now publish VEX data that you can consume in
                  your pipeline: Red Hat: VEX files available at
                  https://access.redhat.com/security/data/csaf/v2/vex/ covering
                  all CVEs affecting the Red Hat portfolio. Microsoft: CSAF VEX
                  advisories for Azure Linux and other products via
                  https://msrc.microsoft.com/csaf/provider-metadata.json.
                  Cisco: VEX documents available through the Cisco
                  Vulnerability Repository (CVR) for supported products.
                </p>
              </Section>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <h2
        className="font-display font-semibold"
        style={SECTION_HEADING_STYLE}
      >
        {heading}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function CategoryBadge({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <span
      className="inline-flex items-center font-medium"
      style={{
        fontSize: "clamp(13px, 1vw, 15px)",
        lineHeight: 1.4,
        letterSpacing: "-0.01em",
        color: "#471EC0",
      }}
    >
      <span style={{ color: "#5A5F75", marginRight: "6px" }}>Category:</span>
      {children}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <th
      scope="col"
      className="border border-[#E5E7EF] px-6 py-3 font-display font-semibold"
      style={{
        fontSize: "clamp(14px, 1.1vw, 17px)",
        lineHeight: 1.4,
        letterSpacing: "-0.01em",
        color: "#0F1023",
      }}
    >
      {children}
    </th>
  );
}

function Tr({ children }: { children: React.ReactNode }): React.ReactElement {
  return <tr style={{ background: "#FFFFFF" }}>{children}</tr>;
}

function Td({
  children,
  bold = false,
}: {
  children: React.ReactNode;
  bold?: boolean;
}): React.ReactElement {
  return (
    <td
      className="border border-[#E5E7EF] px-6 py-4 align-top"
      style={{
        fontSize: "clamp(14px, 1.05vw, 16px)",
        lineHeight: 1.5,
        letterSpacing: "-0.01em",
        color: "#1f2030",
        fontWeight: bold ? 600 : 400,
      }}
    >
      {children}
    </td>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}): React.ReactElement {
  return (
    <li className="flex gap-4 items-start">
      <span
        className="shrink-0 flex items-center justify-center font-display font-semibold"
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "999px",
          background: "#F4F2FB",
          color: "#471EC0",
          fontSize: "clamp(13px, 1vw, 15px)",
          lineHeight: 1,
        }}
        aria-hidden
      >
        {n}
      </span>
      <p style={PROSE_TEXT_STYLE}>
        <span style={{ fontWeight: 600, color: "#0F1023" }}>
          Step {n} - {title}:
        </span>{" "}
        {body}
      </p>
    </li>
  );
}

function CodeBlock({
  children,
  multiline = false,
}: {
  children: React.ReactNode;
  multiline?: boolean;
}): React.ReactElement {
  return (
    <pre
      className="mt-4 overflow-x-auto"
      style={{
        background: "#0F1023",
        borderRadius: "12px",
        padding: "20px 24px",
        color: "#7CE3A0",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        fontSize: "clamp(0.875rem, 1.05vw, 1rem)",
        lineHeight: 1.6,
        whiteSpace: multiline ? "pre" : "pre-wrap",
      }}
    >
      <code>{children}</code>
    </pre>
  );
}
