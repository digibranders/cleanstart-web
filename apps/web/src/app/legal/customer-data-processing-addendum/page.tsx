import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Customer Data Processing Addendum",
  description:
    "CleanStart's Data Processing Addendum governs the processing of Customer Data in connection with CleanStart products and services, in accordance with applicable data protection laws.",
  path: "/legal/customer-data-processing-addendum",
});

export default function CustomerDataProcessingAddendumPage() {
  return (
    <>
      <JsonLd
        id="dpa-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Legal", path: "/legal" },
          { name: "Customer Data Processing Addendum" },
        ])}
      />
      <h1 className="article-h1">Customer Data Processing Addendum</h1>
            <p className="article-paragraph"><em>(&ldquo;DPA&rdquo;)</em></p>

            <h2 className="article-h2">Purpose</h2>
            <p className="article-paragraph">
              This Data Processing Addendum (&ldquo;Addendum&rdquo;) forms part of the Master
              Services Agreement and governs CleanStart&apos;s processing of Customer Data in
              connection with the provision of its products and services. The purpose of this
              Addendum is to ensure that such processing is conducted in accordance with applicable
              data protection laws and to establish the respective rights and obligations of the
              parties.
            </p>

            <h2 className="article-h2">Definitions</h2>
            <p className="article-paragraph">
              For the purposes of this Addendum, &ldquo;Customer Data&rdquo; means any personal data
              or other information provided, stored, or transmitted by the Customer or its end-users
              through the use of CleanStart products and services. &ldquo;Processing&rdquo; shall
              have the meaning given under applicable data protection laws, including the General
              Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA), to
              the extent applicable.
            </p>

            <h2 className="article-h2">Roles of the Parties</h2>
            <p className="article-paragraph">
              The Customer acts as the &ldquo;Data Controller&rdquo; (or equivalent under applicable
              law), determining the purposes and means of processing Customer Data. CleanStart acts
              as the &ldquo;Data Processor&rdquo; and processes Customer Data solely on behalf of and
              in accordance with the documented instructions of the Customer, except where otherwise
              required by applicable law.
            </p>

            <h2 className="article-h2">Processing Obligations</h2>
            <p className="article-paragraph">
              CleanStart shall process Customer Data only for the purpose of delivering services
              under the Master Services Agreement, including vulnerability management, remediation,
              image support, and related obligations set forth in the Service Level Agreement.
              CleanStart shall not process Customer Data for its own commercial purposes and shall
              not sell Customer Data to third parties.
            </p>

            <h2 className="article-h2">Security and Confidentiality</h2>
            <p className="article-paragraph">
              CleanStart will implement and maintain appropriate technical and organizational
              measures designed to protect Customer Data against unauthorized access, disclosure,
              alteration, or destruction. These measures include, but are not limited to, encryption,
              access controls, audit logging, vulnerability management, and incident response
              procedures consistent with the security commitments already detailed in the SLA.
              CleanStart personnel are bound by confidentiality obligations and are permitted to
              process Customer Data only as required to perform their duties.
            </p>

            <h2 className="article-h2">Subprocessors</h2>
            <p className="article-paragraph">
              CleanStart may engage third-party subprocessors to support the provision of its
              services, provided that such subprocessors are bound by data protection obligations no
              less protective than those set forth in this Addendum. CleanStart shall maintain a
              current list of subprocessors and will provide customers with notice of any material
              changes. Customers may object to a new subprocessor where they have reasonable grounds
              to believe such engagement would pose an unacceptable risk to data protection.
            </p>

            <h2 className="article-h2">International Transfers</h2>
            <p className="article-paragraph">
              Where the processing of Customer Data involves transfers outside of the jurisdiction in
              which the data originated, CleanStart will ensure that appropriate safeguards are in
              place, such as reliance on Standard Contractual Clauses, binding corporate rules, or
              other lawful transfer mechanisms recognized under applicable law.
            </p>

            <h2 className="article-h2">Customer Responsibilities</h2>
            <p className="article-paragraph">
              The Customer remains responsible for ensuring that its instructions to CleanStart
              comply with applicable data protection laws and for providing legally sufficient
              notices and obtaining necessary consents from its data subjects. The Customer is also
              responsible for the security of its own networks and systems used to transmit Customer
              Data to CleanStart.
            </p>

            <h2 className="article-h2">Audit Rights</h2>
            <p className="article-paragraph">
              Upon reasonable notice, and subject to confidentiality obligations, CleanStart will
              make available to the Customer relevant documentation and information necessary to
              demonstrate compliance with this Addendum. Where required by applicable law, the
              Customer may conduct audits, either directly or through a mutually agreed independent
              auditor, provided that such audits do not unreasonably interfere with CleanStart&apos;s
              business operations.
            </p>

            <h2 className="article-h2">Data Subject Rights and Assistance</h2>
            <p className="article-paragraph">
              CleanStart will provide reasonable assistance to the Customer in responding to requests
              from data subjects, such as requests for access, correction, or deletion of personal
              data, where such assistance is legally required and technically feasible.
            </p>

            <h2 className="article-h2">Data Breach Notification</h2>
            <p className="article-paragraph">
              In the event of a confirmed data breach involving Customer Data, CleanStart will notify
              the Customer without undue delay, providing sufficient details to enable the Customer to
              comply with its legal obligations, including regulatory or data subject notification
              requirements. CleanStart will cooperate with the Customer in investigating, mitigating,
              and remediating the breach.
            </p>

            <h2 className="article-h2">Termination and Deletion</h2>
            <p className="article-paragraph">
              Upon termination or expiration of the Master Services Agreement, CleanStart will, at
              the Customer&apos;s election, return or securely delete all Customer Data, except where
              retention is required by applicable law.
            </p>

            <h2 className="article-h2">Governing Law and Hierarchy</h2>
            <p className="article-paragraph">
              This Addendum shall be governed by the same law and dispute resolution provisions as
              the Master Services Agreement. In the event of conflict between this Addendum and other
              terms of the Agreement, this Addendum shall control with respect to the processing of
              Customer Data.
            </p>
    </>
  );
}
