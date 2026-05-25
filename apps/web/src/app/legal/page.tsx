import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { LegalHero } from "@/components/sections/legal/LegalHero";
import { LegalLayout } from "@/components/sections/legal/LegalLayout";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Legal — Additional Third-Party Terms",
  description:
    "CleanStart's policy on third-party software and open source components included in or accessed through CleanStart products and services.",
  path: "/legal",
});

export default function LegalPage() {
  return (
    <>
      <JsonLd
        id="legal-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Legal" },
        ])}
      />
      <Header />
      <main>
        <LegalHero title="Legal" />
        <FadeUp>
          <LegalLayout activeHref="/legal">
            <h2 className="article-h2">Additional Third-Party Terms</h2>
            <p className="article-paragraph"><em>(for Integrated Services)</em></p>

            <h3 className="article-h3">1. Purpose</h3>
            <p className="article-paragraph">
              This Third-Party Software and Open Source Components Policy (this &ldquo;Policy&rdquo;)
              describes the third-party software components, including open source software, that
              may be included in or accessed through Cleanstart, Inc. (&ldquo;Cleanstart&rdquo;, the
              &ldquo;Company&rdquo;) products and services. This Policy supplements the Master
              Service and License Agreement (the &ldquo;MSA&rdquo;) and the Service Level Agreement
              (the &ldquo;SLA&rdquo;) between Cleanstart and the customer (the &ldquo;Customer&rdquo;),
              and is intended to provide transparency regarding the composition, licensing, and
              provenance of Cleanstart products and to clarify the respective rights and
              responsibilities of Cleanstart and Customer with respect to such components.
              Capitalised terms used but not defined in this Policy have the meanings given in the
              MSA.
            </p>
            <p className="article-paragraph">
              In the event of any conflict between this Policy and the MSA, the MSA shall control
              with respect to the subject matter hereof.
            </p>

            <h3 className="article-h3">2. Composition of Cleanstart Products</h3>
            <p className="article-paragraph">
              Each Cleanstart product, including without limitation Cleanstart Containers (formerly
              known as Hardened Images or Cleanstart Images), Cleanstart FIPS-validated images, and
              any successor or derivative product offerings (each, a &ldquo;Product&rdquo;), is
              composed of the following:
            </p>
            <ul className="article-ul">
              <li className="article-li">
                <strong>Cleanstart-authored materials:</strong> hardening configurations, build
                recipes, build pipelines, signing attestations, security advisories, documentation,
                the SBOM (as defined below), the Provenance Attestation (as defined below), and
                other materials authored by Cleanstart.
              </li>
              <li className="article-li">
                <strong>Third-Party Software:</strong> software components that are not authored by
                Cleanstart, including (i) open source software (&ldquo;OSS&rdquo;) and (ii) where
                applicable, commercial third-party software and integrated services made available
                pursuant to additional licence terms.
              </li>
            </ul>
            <p className="article-paragraph">
              The composition of each Product is documented in the SBOM made available with that
              Product.
            </p>

            <h3 className="article-h3">3. Open Source Software</h3>
            <p className="article-paragraph">
              <strong>3.1 Definition.</strong> &ldquo;OSS&rdquo; means software licensed under an
              open source licence meeting the definition promulgated by the Open Source Initiative
              (located at https://opensource.org/), or identified as an open source licence by the
              SPDX License List (located at https://spdx.org/licenses/).
            </p>
            <p className="article-paragraph">
              <strong>3.2 Upstream Licensing.</strong> All OSS components included in Cleanstart
              Products are licensed to Customer by their respective upstream maintainers or
              licensors under the applicable open source licence terms identified in the SBOM made
              available with each Product. Cleanstart does not relicense, sublicense, or modify the
              licence terms of any OSS component included in the Products. Nothing in this Policy,
              the MSA, the SLA, or any related Order Form is intended to limit Customer&apos;s
              rights under, or grant Customer rights that supersede, the terms of any OSS licence.
              Customer&apos;s rights to use, modify, or redistribute any OSS component included in
              a Product are governed solely by the applicable OSS licence and not by the MSA.
            </p>
            <p className="article-paragraph">
              <strong>3.3 Scope of Cleanstart&apos;s Licence Grant.</strong> The licence granted by
              Cleanstart to Customer under the MSA, and the ownership and intellectual property
              rights asserted by Cleanstart, extend only to the Cleanstart-authored materials
              identified in Section 2 of this Policy. Such licence and rights do not extend to any
              underlying OSS or other Third-Party Software contained within or accessed through the
              Products.
            </p>

            <h3 className="article-h3">4. Software Bill of Materials</h3>
            <p className="article-paragraph">
              <strong>4.1 SBOM Disclosure.</strong> For each Product made generally available,
              Cleanstart publishes a Software Bill of Materials (&ldquo;SBOM&rdquo;) in
              industry-standard formats, including:
            </p>
            <ul className="article-ul">
              <li className="article-li">
                <strong>Standard SBOM:</strong> SPDX 2.3 format, generated using widely-recognised
                tooling (including syft).
              </li>
              <li className="article-li">
                <strong>Cleanstart Enhanced SBOM:</strong> SPDX 3.0 format, generated by the
                Cleanstart Enhanced SBOM Generator, providing additional enriched metadata for each
                component.
              </li>
              <li className="article-li">
                <strong>CycloneDX:</strong> where applicable and as required for specific
                compliance use cases.
              </li>
            </ul>
            <p className="article-paragraph">
              <strong>4.2 SBOM Contents.</strong> The SBOM identifies, for each component contained
              in the Product, the following information where available: Component name and
              version; Package manager type (for example, apk, deb, rpm, npm, pypi, go); Declared
              licence using SPDX licence identifiers where available; Upstream supplier,
              maintainer, or originator; Upstream source location (repository URL); Cryptographic
              hashes; and Other relevant component metadata.
            </p>
            <p className="article-paragraph">
              <strong>4.3 SBOM as Authoritative Disclosure.</strong> The SBOM constitutes
              Cleanstart&apos;s complete and authoritative disclosure of the Third-Party Software
              components contained in the applicable Product. Cleanstart&apos;s disclosure
              obligations with respect to such components are satisfied upon making the SBOM
              available to Customer through the Cleanstart Delivery Portal or such other delivery
              mechanism as Cleanstart may designate from time to time.
            </p>
            <p className="article-paragraph">
              <strong>4.4 SBOM Licensing.</strong> Cleanstart releases each SBOM under the Creative
              Commons CC0 1.0 Universal (Public Domain Dedication) licence, enabling Customer to
              freely use, share, and rely on SBOM data for compliance, security, and operational
              purposes.
            </p>

            <h3 className="article-h3">5. Provenance Attestation</h3>
            <p className="article-paragraph">
              <strong>5.1 Provenance Disclosure.</strong> For each Product made generally available,
              Cleanstart publishes a build provenance attestation (the &ldquo;Provenance
              Attestation&rdquo;) conformant with the Supply chain Levels for Software Artifacts
              (SLSA) framework and the in-toto attestation specification.
            </p>
            <p className="article-paragraph">
              <strong>5.2 Provenance Contents.</strong> The Provenance Attestation identifies, for
              each Product: The build source repository and the cryptographic commit reference from
              which the Product was built; The build platform and builder identity; The build
              invocation identifier; The cryptographic digest of the resulting Product image; and
              Such additional metadata as required to enable independent verification of build
              integrity and origin.
            </p>
            <p className="article-paragraph">
              <strong>5.3 Cryptographic Signing.</strong> Cleanstart Products are cryptographically
              signed using industry-standard tooling (including Sigstore Cosign), and Provenance
              Attestations are recorded in tamper-evident transparency logs where applicable,
              enabling Customer to verify the integrity and origin of each Product they deploy.
            </p>

            <h3 className="article-h3">6. Commercial Third-Party Components</h3>
            <p className="article-paragraph">
              Certain Products may include commercial third-party software components, or rely on
              integrated third-party services, that are subject to licence terms, service
              agreements, and policies imposed by their respective owners or licensors
              (&ldquo;Commercial Third-Party Terms&rdquo;). Where applicable, such components and
              the associated Commercial Third-Party Terms are identified in the documentation
              accompanying the affected Product or, where applicable, in an addendum to this
              Policy.
            </p>
            <p className="article-paragraph">
              Customer must comply with all Commercial Third-Party Terms applicable to the
              components contained in the Products Customer uses, including without limitation
              licensing restrictions, usage limits, data handling requirements, and acceptable use
              obligations. In some cases, Customer may be required to hold a separate, valid
              licence directly from the third-party licensor before Customer is entitled to use the
              affected Product. Where Cleanstart&apos;s or Customer&apos;s licence to any such
              commercial component expires or is terminated for any reason, Cleanstart may suspend
              or terminate Customer&apos;s access to the affected Product, and Cleanstart will use
              commercially reasonable efforts to provide a substantially equivalent Product for the
              remainder of the then-applicable subscription term, where feasible.
            </p>
            <p className="article-paragraph">
              Cleanstart does not assume liability for a Customer&apos;s failure to comply with any
              Commercial Third-Party Terms.
            </p>

            <h3 className="article-h3">7. Customer Responsibilities</h3>
            <p className="article-paragraph">Customer is responsible for:</p>
            <ul className="article-ul">
              <li className="article-li">
                Reviewing the SBOM and the applicable Third-Party Software licence terms for each
                Product that Customer uses;
              </li>
              <li className="article-li">
                Complying with the obligations imposed by such licences, including any attribution,
                notice, or redistribution requirements;
              </li>
              <li className="article-li">
                Ensuring that Customer&apos;s use, modification, layering, or redistribution of any
                Cleanstart Product does not violate any applicable Third-Party Software licence;
              </li>
              <li className="article-li">
                Complying with any Commercial Third-Party Terms applicable to the components within
                the Products Customer uses, including obtaining any separate third-party licences
                required for Customer&apos;s use; and
              </li>
              <li className="article-li">
                Verifying the Provenance Attestation for any Product where Customer requires
                cryptographic assurance of Product origin or integrity prior to deployment.
              </li>
            </ul>

            <h3 className="article-h3">8. Cleanstart&apos;s Role</h3>
            <p className="article-paragraph">
              Cleanstart curates, hardens, and packages Third-Party Software and Cleanstart-authored
              materials into the Products, signs each Product release, and publishes the
              accompanying SBOM and Provenance Attestation. Cleanstart does not modify upstream
              source code in ways that change the licence terms of any OSS component.
            </p>

            <h3 className="article-h3">9. Limitation of Liability and Disclaimer</h3>
            <p className="article-paragraph">
              Cleanstart disclaims responsibility for interruptions, failures, vulnerabilities,
              defects, or deficiencies originating solely from Third-Party Software or from
              integrated third-party services beyond Cleanstart&apos;s reasonable control. Remedies
              and service credits provided under the SLA do not extend to outages or defects caused
              by such Third-Party Software or services, except as expressly stated in the SLA.
              Cleanstart&apos;s obligations and liabilities under this Policy are further limited
              by, and subject to, the warranty disclaimers, exclusions of damages, and Limitations
              of Liability set forth in the MSA, all of which apply in full to any claim arising
              under or in connection with this Policy. Cleanstart makes no warranty, representation,
              or guarantee regarding the accuracy, completeness, or fitness for any particular
              purpose of any Third-Party Software, OSS, or commercial third-party component
              included in or accessed through the Products, except to the extent expressly set
              forth in the MSA.
            </p>

            <h3 className="article-h3">10. Updates to this Policy</h3>
            <p className="article-paragraph">
              Cleanstart may update this Policy from time to time, provided that no such update
              shall materially and adversely diminish Customer&apos;s rights under the then-current
              Order Form for the remainder of its subscription term. The current version of this
              Policy is published at https://www.cleanstart.com/legal. Customer is encouraged to
              review this Policy periodically to remain familiar with its current terms.
            </p>

            <h3 className="article-h3">11. Contact</h3>
            <p className="article-paragraph">
              Questions regarding this Policy, the SBOM, or the Provenance Attestation may be
              directed to Cleanstart&apos;s security and legal teams through the Cleanstart Delivery
              Portal or via the contact mechanisms published at{" "}
              <a href="/contact-us">https://www.cleanstart.com/contact-us</a>.
            </p>
          </LegalLayout>
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
