import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Pre-General Availability Terms",
  description:
    "Terms governing the use of CleanStart products, features, or services designated as alpha, beta, preview, or otherwise not yet generally available.",
  path: "/legal/pre-general-availability-terms",
});

export default function PreGeneralAvailabilityTermsPage() {
  return (
    <>
      <JsonLd
        id="pre-ga-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Legal", path: "/legal" },
          { name: "Pre-General Availability Terms" },
        ])}
      />
      <h1 className="article-h1">Pre-General Availability Terms</h1>
            <h2 className="article-h2">Purpose</h2>
            <p className="article-paragraph">
              These Pre-GA Terms apply to CleanStart&trade; products, features, or services that are
              designated as alpha, beta, preview, or otherwise not yet generally available
              (&ldquo;Pre-GA Offerings&rdquo;). They supplement the Master Services Agreement and
              related Service Level Agreements, and govern the Customer&apos;s use of Pre-GA Offerings
              provided by CleanStart.
            </p>

            <h2 className="article-h2">Limited Availability and Functionality</h2>
            <p className="article-paragraph">
              Pre-GA Offerings are made available at CleanStart&apos;s sole discretion for evaluation,
              testing, and feedback purposes only. They may be incomplete, may contain errors or
              defects, and may not function in the same manner as generally available products.
              CleanStart does not guarantee continued availability of any Pre-GA Offering and may
              modify, suspend, or discontinue such offerings at any time without notice.
            </p>

            <h2 className="article-h2">Exclusions from SLA and Warranties</h2>
            <p className="article-paragraph">
              Unless expressly stated otherwise, Pre-GA Offerings are provided &ldquo;as is&rdquo; and
              are excluded from the commitments, service credits, and remedies specified under the
              CleanStart Service Level Agreement. CleanStart disclaims all warranties with respect to
              Pre-GA Offerings, whether express, implied, or statutory, including warranties of
              performance, reliability, or fitness for a particular purpose.
            </p>

            <h2 className="article-h2">Customer Responsibilities</h2>
            <p className="article-paragraph">
              Customers using Pre-GA Offerings acknowledge that such use is at their sole risk and
              agree to use them only for non-production purposes, unless expressly authorized by
              CleanStart. Customers must provide prompt feedback on issues, performance, and
              usability, and consent to CleanStart&apos;s use of such feedback for product improvement
              without restriction. Customers are further responsible for ensuring that their test use
              of Pre-GA Offerings does not expose confidential or sensitive data without appropriate
              safeguards.
            </p>

            <h2 className="article-h2">Data Handling and Security</h2>
            <p className="article-paragraph">
              While CleanStart applies commercially reasonable security measures across its services,
              Customers acknowledge that Pre-GA Offerings may not have undergone the same level of
              security review, certification, or compliance validation as generally available
              services. Accordingly, Customers are advised not to rely on Pre-GA Offerings for
              mission-critical workloads or for processing highly sensitive data.
            </p>

            <h2 className="article-h2">Transition to General Availability</h2>
            <p className="article-paragraph">
              CleanStart has no obligation to release any Pre-GA Offering as a generally available
              product. If a Pre-GA Offering transitions to general availability, continued use shall
              be subject to the standard terms of the Master Services Agreement and SLA, and may
              require execution of additional orders or amendments.
            </p>

            <h2 className="article-h2">Termination</h2>
            <p className="article-paragraph">
              Either party may terminate participation in a Pre-GA Offering at any time upon written
              notice. Upon termination, Customer must cease all use of the Pre-GA Offering and, if
              applicable, return or delete any related materials in accordance with CleanStart&apos;s
              instructions.
            </p>

            <h2 className="article-h2">Governing Law</h2>
            <p className="article-paragraph">
              These Pre-GA Terms shall be governed by the same law and dispute resolution provisions
              as the Master Services Agreement.
            </p>
    </>
  );
}
