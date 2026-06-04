import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Policies and Commitments",
  description:
    "CleanStart's consolidated commitments regarding the security, availability, and reliability of its products and services, supplementing the Master Services Agreement and SLA.",
  path: "/legal/policies-and-commitments",
});

export default function PoliciesAndCommitmentsPage() {
  return (
    <>
      <JsonLd
        id="policies-commitments-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Legal", path: "/legal" },
          { name: "Policies and Commitments" },
        ])}
      />
      <h1 className="article-h1">Policies and Commitments</h1>
            <p className="article-paragraph">
              <em>(including Security Commitments and Service Level Agreements)</em>
            </p>

            <h2 className="article-h2">Purpose</h2>
            <p className="article-paragraph">
              This Policy consolidates CleanStart&apos;s key commitments regarding the security,
              availability, and reliability of its products and services. It supplements the Master
              Services Agreement and forms the foundation of CleanStart&apos;s contractual obligations
              to its customers, alongside the Service Level Agreement (&ldquo;SLA&rdquo;) and related
              supporting documents.
            </p>

            <h2 className="article-h2">Security Commitments</h2>
            <p className="article-paragraph">
              CleanStart is committed to maintaining the confidentiality, integrity, and availability
              of customer data and to implementing industry-standard security practices across its
              operations. Security measures include continuous vulnerability scanning, patch
              management, access controls, encryption of data at rest and in transit, and incident
              response protocols. These commitments are reinforced by the Vulnerability Management and
              Remediation SLA, which defines strict timelines for addressing vulnerabilities
              classified under the Common Vulnerability Scoring System (CVSS).
            </p>

            <h2 className="article-h2">Availability and Performance Commitments</h2>
            <p className="article-paragraph">
              CleanStart guarantees high levels of availability for its image registry and related
              services, with commitments of 99.9% uptime for registry services and 99.95% uptime for
              image pull availability, measured monthly. In addition, CleanStart ensures timely
              support response based on priority levels, ranging from a two-hour response time for
              critical issues to an eight-business-hour response for medium or low-priority issues.
            </p>

            <h2 className="article-h2">Transparency and Reporting</h2>
            <p className="article-paragraph">
              CleanStart provides ongoing transparency into its security posture and service
              performance. Customers receive monthly vulnerability reports, proactive notifications of
              critical and high-severity issues, and access to a public security dashboard that
              displays current vulnerability status for generally available images. CleanStart also
              commits to documenting any exceptions or exclusions to remediation and reviewing its
              security posture annually to incorporate industry best practices.
            </p>

            <h2 className="article-h2">Customer Responsibilities</h2>
            <p className="article-paragraph">
              CleanStart&apos;s ability to deliver on these commitments depends on the active
              cooperation of its customers. Customers are responsible for submitting accurate and
              complete support requests, designating primary points of contact, and responding
              promptly to CleanStart&apos;s security communications. Customers must also ensure that
              their use of CleanStart products complies with applicable laws and third-party terms,
              and that their own networks and environments are secured against vulnerabilities outside
              CleanStart&apos;s control.
            </p>

            <h2 className="article-h2">Service Credits and Remedies</h2>
            <p className="article-paragraph">
              In the event that CleanStart fails to meet its defined SLA obligations, customers may be
              entitled to service credits as set forth in the SLA. These credits serve as the sole and
              exclusive remedy for SLA breaches, ensuring accountability while providing customers with
              meaningful compensation where commitments are not met.
            </p>

            <h2 className="article-h2">Continuous Improvement</h2>
            <p className="article-paragraph">
              CleanStart is dedicated to continuous improvement of its policies, security practices,
              and commitments. Security measures, remediation processes, and service standards are
              reviewed annually and updated to reflect customer feedback, regulatory developments, and
              advancements in industry best practices.
            </p>
    </>
  );
}
