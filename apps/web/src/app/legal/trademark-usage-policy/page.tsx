import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Trademark Usage Policy",
  description:
    "Rules governing the use of CleanStart trademarks, service marks, logos, product names, images, and related brand assets.",
  path: "/legal/trademark-usage-policy",
});

export default function TrademarkUsagePolicyPage() {
  return (
    <>
      <JsonLd
        id="trademark-usage-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Legal", path: "/legal" },
          { name: "Trademark Usage Policy" },
        ])}
      />
      <h1 className="article-h1">Trademark Usage Policy</h1>
            <p className="article-paragraph"><em>(Logo, Copy, and Images)</em></p>

            <h2 className="article-h2">Purpose</h2>
            <p className="article-paragraph">
              This Policy sets out the rules governing the use of CleanStart&trade; trademarks,
              service marks, logos, product names, images, and related brand assets
              (&ldquo;Marks&rdquo;). Its objective is to ensure the integrity of the CleanStart brand
              is preserved, while allowing authorized customers, partners, and third parties to make
              accurate and appropriate references to CleanStart products and services.
            </p>

            <h2 className="article-h2">Ownership</h2>
            <p className="article-paragraph">
              All rights, title, and interest in the Marks remain the exclusive property of
              CleanStart. No transfer of ownership or implied license is granted under this Policy.
              Permission to use the Marks is strictly limited to the conditions described herein.
            </p>

            <h2 className="article-h2">Authorized Usage</h2>
            <p className="article-paragraph">
              CleanStart permits use of its Marks solely for the purposes of identifying genuine
              CleanStart products or services, or to indicate a bona fide customer or partnership
              relationship, provided such use is accurate and not misleading. Marks must always appear
              in the exact form supplied by CleanStart, without modification, and must comply with any
              applicable brand guidelines issued by the company.
            </p>

            <h2 className="article-h2">Restrictions on Use</h2>
            <p className="article-paragraph">
              Marks may not be altered, distorted, or combined with any other logos, words, or
              graphics. They may not be used in a manner that implies endorsement, sponsorship, or
              affiliation beyond what has been expressly authorized in writing. CleanStart Marks must
              not be incorporated into product names, business names, domain names, advertising
              keywords, or social media handles. Use of screenshots, product images, or documentation
              excerpts must remain contextual, factual, and non-misleading.
            </p>

            <h2 className="article-h2">Presentation Standards</h2>
            <p className="article-paragraph">
              When displaying the CleanStart logo, appropriate clear space and proportional scaling
              must be maintained, and the logo must not be obscured, cropped, or placed on a
              background that impairs its legibility. References to CleanStart products should use the
              full and proper product names as they appear in official documentation, including the
              required &trade; or &reg; symbol at least once per page, document, or webpage. An
              appropriate attribution statement must accompany such use, for example:
              &ldquo;CleanStart&trade; is a registered trademark of CleanStart, Inc. All rights
              reserved.&rdquo;
            </p>

            <h2 className="article-h2">Use of Images and Documentation</h2>
            <p className="article-paragraph">
              Official images, diagrams, and excerpts from CleanStart materials may be reproduced only
              for non-commercial, educational, or informational purposes, provided that the content is
              not altered and the source is clearly acknowledged. Any commercial use, including use in
              promotional or marketing materials, requires prior written authorization from
              CleanStart.
            </p>

            <h2 className="article-h2">Enforcement</h2>
            <p className="article-paragraph">
              Unauthorized use of Marks constitutes a violation of CleanStart&apos;s intellectual
              property rights and may result in revocation of any usage rights, termination of related
              agreements, or pursuit of legal remedies. CleanStart reserves the right to amend this
              Policy at any time to reflect changes in its branding strategy, business operations, or
              applicable law.
            </p>
    </>
  );
}
