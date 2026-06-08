/**
 * The 8 hand-built Knowledge-Hub articles that predate the Academy import.
 * They are migrated into the CMS so they survive the static→CMS switch and stay
 * pinned at the top of the sidebar (lowest `displayOrder`).
 *
 * Seven come from `apps/web/.../kh-articles.data.ts` as `Block[]` and are
 * converted to HTML at seed time. VEX uses a bespoke React body, transcribed
 * here verbatim as HTML.
 */

/** Top-level legacy groups, pinned above the Academy sections. */
export const LEGACY_GROUPS: { slug: string; name: string; displayOrder: number }[] = [
  { slug: 'emerging-standards', name: 'Emerging Standards', displayOrder: 0 },
  { slug: 'security-features', name: 'Security Features', displayOrder: 1 },
  { slug: 'compliance-and-certification', name: 'Compliance and Certification', displayOrder: 2 },
  { slug: 'devops-kyverno', name: 'DevOps Kyverno', displayOrder: 3 },
];

/**
 * Maps the legacy `Article.category` string (as stored in kh-articles.data.ts /
 * the VEX article) to a legacy group slug. Normalized lower-case lookup.
 */
export const CATEGORY_TO_GROUP_SLUG: Record<string, string> = {
  'emerging standards': 'emerging-standards',
  'security features': 'security-features',
  'compliance and certification': 'compliance-and-certification',
  'devops kyverno': 'devops-kyverno',
};

/** VEX article — bespoke React body transcribed to semantic HTML. */
export const VEX_HTML = `
<h2>Overview</h2>
<p>Vulnerability Exploitability eXchange (VEX) is an emerging standard that enables software suppliers and security teams to communicate whether vulnerabilities in software components are actually exploitable in a specific product context. By integrating VEX documents into your CI/CD pipeline, you can automatically suppress false-positive CVE alerts and focus remediation efforts on vulnerabilities that pose genuine risk. This knowledge base article explains how to create, manage, and integrate VEX documents into your security scanning workflow to reduce vulnerability noise and improve triage efficiency.</p>

<h2>The Problem: CVE Alert Fatigue</h2>
<p>Modern applications contain hundreds or thousands of dependencies. When vulnerability scanners analyze a Software Bill of Materials (SBOM), they often flag numerous CVEs that, while technically present in a component, cannot actually be exploited in your specific deployment context. Common reasons include: Vulnerable code not loaded: The affected function or class is excluded during compilation or never invoked at runtime. Configuration prevents exploitation: The vulnerable feature is disabled in your deployment configuration. Mitigations already in place: Sandboxing, input validation, or other controls neutralize the attack vector. Component not deployed: Test or development dependencies are flagged but never ship to production. Without a mechanism to communicate this context, security teams waste significant time investigating non-exploitable vulnerabilities, and pipelines may fail unnecessarily on CVEs that pose no real risk.</p>

<h2>What is VEX?</h2>
<p>VEX was developed by the National Telecommunications and Information Administration (NTIA) in 2021 and further refined by CISA through a multi-stakeholder working group. It provides a machine-readable format for declaring the exploitability status of vulnerabilities, designed to complement SBOMs.</p>
<p>A VEX document asserts one of four statuses for each vulnerability-product combination:</p>
<table>
<thead><tr><th>Status</th><th>Description</th></tr></thead>
<tbody>
<tr><td><strong>Not Affected</strong></td><td>No remediation is required. The vulnerability cannot be exploited in this product context.</td></tr>
<tr><td><strong>Affected</strong></td><td>Actions are recommended to remediate or mitigate the vulnerability.</td></tr>
<tr><td><strong>Fixed</strong></td><td>The product version contains a fix for the vulnerability.</td></tr>
<tr><td><strong>Under Investigation</strong></td><td>The exploitability is not yet determined. Updates will follow.</td></tr>
</tbody>
</table>

<h2>VEX Format Options</h2>
<p>VEX can be expressed in multiple formats. Choose based on your tooling ecosystem and interoperability requirements:</p>
<table>
<thead><tr><th>Format</th><th>Strengths</th><th>Best For</th></tr></thead>
<tbody>
<tr><td><strong>OpenVEX</strong></td><td>Minimal JSON-LD format, SBOM-agnostic, uses Package URLs (PURLs). Easy to embed in attestations.</td><td>Cloud-native environments, container security, Sigstore integration.</td></tr>
<tr><td><strong>CSAF VEX</strong></td><td>Rich product tree support, remediation details, OASIS standard. Supports complex product hierarchies.</td><td>Enterprise vendors with multiple product lines, regulatory compliance (FEDRAMP).</td></tr>
<tr><td><strong>CycloneDX VEX</strong></td><td>Native integration with CycloneDX SBOMs. VEX can be embedded directly or referenced externally.</td><td>Organizations already using CycloneDX for SBOM generation.</td></tr>
<tr><td><strong>SPDX 3.0</strong></td><td>VEX support in Security profile. ISO/IEC standard, strong open-source community support.</td><td>Open source projects, Linux Foundation ecosystem.</td></tr>
</tbody>
</table>

<h2>Integrating VEX into Your CI/CD Pipeline</h2>
<p>The goal is to make VEX consumption a required step after vulnerability scanning, allowing your pipeline to automatically filter out non-exploitable CVEs before failing builds or creating tickets.</p>
<h3>Pipeline Workflow</h3>
<ul>
<li><strong>Step 1 - SBOM Generation:</strong> Generate an SBOM using tools like Trivy, Syft, or your SCA solution. Output in CycloneDX or SPDX format.</li>
<li><strong>Step 2 - Vulnerability Scan:</strong> Scan the SBOM against vulnerability databases (NVD, OSV) to identify CVEs affecting your components.</li>
<li><strong>Step 3 - VEX Consumption:</strong> Query your VEX data source (local file, artifact repository, or API) to check each CVE's exploitability status.</li>
<li><strong>Step 4 - Policy Evaluation:</strong> Apply policy rules to determine build outcomes based on VEX-adjusted vulnerability data.</li>
<li><strong>Step 5 - Report and Act:</strong> Generate filtered reports showing only actionable vulnerabilities. Route findings appropriately.</li>
</ul>
<h3>Example: Using Trivy with VEX</h3>
<p>Trivy natively supports VEX in OpenVEX and CSAF formats. To filter vulnerabilities using a VEX document:</p>
<pre data-lang="bash">trivy image myapp:latest --vex ./vex-statements.openvex.json</pre>
<p>When a CVE listed in your VEX document has status &ldquo;not_affected,&rdquo; Trivy logs that it filtered out the vulnerability and excludes it from the final report.</p>
<h3>Example: Using cve-bin-tool with VEX</h3>
<p>The CVE Binary Tool supports VEX as a triage mechanism:</p>
<pre data-lang="bash">cve-bin-tool --sbom sbom.json --vex-file vex.json --filter-triage</pre>
<p>The --filter-triage flag removes vulnerabilities marked as NotAffected or FalsePositive from the output.</p>

<h2>Creating VEX Documents</h2>
<p>Using vexctl (OpenVEX) The vexctl tool from the OpenVEX project creates and manages VEX documents:</p>
<pre data-lang="bash"># Create a VEX statement declaring a CVE as not affected
vexctl create \\
  --product="pkg:npm/myapp@1.0.0" \\
  --vuln="CVE-2024-12345" \\
  --status="not_affected" \\
  --justification="vulnerable_code_not_in_execute_path"</pre>

<h2>Sample OpenVEX Document</h2>
<pre data-lang="json">{
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
}</pre>

<h2>Governance and Best Practices</h2>
<p>Implementing VEX requires clear ownership and processes: Establish ownership: Define who can create and approve VEX statements. Security engineers should validate justifications before pipeline integration. Version control VEX documents: Store VEX files in Git alongside your code. This creates an auditable history of security decisions. Define evidence requirements: Document what constitutes sufficient evidence for each justification type. Code analysis, runtime verification, or architecture review may be required. Review periodically: VEX statements should be reviewed when new information emerges. A &ldquo;not_affected&rdquo; status may change if exploitation techniques evolve. Sign attestations: For high-assurance environments, cryptographically sign VEX documents using Sigstore or similar mechanisms.</p>

<h2>Vendor VEX Sources</h2>
<p>Major vendors now publish VEX data that you can consume in your pipeline: Red Hat: VEX files available at <a href="https://access.redhat.com/security/data/csaf/v2/vex/">https://access.redhat.com/security/data/csaf/v2/vex/</a> covering all CVEs affecting the Red Hat portfolio. Microsoft: CSAF VEX advisories for Azure Linux and other products via <a href="https://msrc.microsoft.com/csaf/provider-metadata.json">https://msrc.microsoft.com/csaf/provider-metadata.json</a>. Cisco: VEX documents available through the Cisco Vulnerability Repository (CVR) for supported products.</p>
`.trim();
