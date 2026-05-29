import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { LegalHero } from "@/components/sections/legal/LegalHero";
import { LegalProse } from "@/components/sections/legal/LegalProse";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Acceptable Use Policy",
  description:
    "CleanStart's Acceptable Use Policy governs your access to and use of all CleanStart products, services, APIs, and documentation.",
  path: "/legal/acceptable-use-policy",
});

export default function AcceptableUsePolicyPage() {
  return (
    <>
      <JsonLd
        id="aup-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Legal", path: "/legal" },
          { name: "Acceptable Use Policy" },
        ])}
      />
      <Header />
      <main>
        <LegalHero title="Acceptable Use Policy" />
        <FadeUp>
          <LegalProse>
            <h2 className="article-h2">Introduction</h2>
            <p className="article-paragraph">
              This Acceptable Use Policy (&quot;AUP&quot;) governs your access to and use of all
              products, services, platform features, container image repositories, APIs,
              dashboards, and documentation (collectively, the &quot;Services&quot;) provided by
              CleanStart Security Inc. (&quot;CleanStart,&quot; &quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;).
            </p>
            <p className="article-paragraph">
              By accessing or using the Services, you (&quot;User,&quot; &quot;Customer,&quot; or
              &quot;you&quot;) agree to comply with this AUP. This AUP is incorporated by reference
              into CleanStart&apos;s Terms of Service and any applicable Master Service and License
              Agreement or Order Form executed between you and CleanStart. If you are accepting this
              AUP on behalf of a company or other legal entity, you represent that you have the
              authority to bind that entity.
            </p>
            <p className="article-paragraph">
              CleanStart reserves the right to modify this AUP at any time. Updates will be posted
              to our website with a revised effective date and are binding upon posting. Continued
              use of the Services constitutes acceptance of the revised AUP.
            </p>

            <h2 className="article-h2">Reporting Suspected Violations</h2>
            <p className="article-paragraph">
              We encourage anyone who suspects a violation of this AUP to report it to us at{" "}
              <a href="mailto:legal@cleanstart.com">legal@cleanstart.com</a>. We investigate all
              reports and respond in the way we consider appropriate.
            </p>

            <h2 className="article-h2">Permitted Use</h2>
            <p className="article-paragraph">
              You may use CleanStart&apos;s Services for any lawful purpose that is consistent with
              your agreement with us. You are solely responsible for any data, information, or
              materials you use in connection with CleanStart&apos;s products and services,
              including maintaining your own copies. CleanStart does not monitor your content for
              illegal activity. You must comply with all applicable laws and regulations. Any use
              that facilitates a violation of applicable law is strictly prohibited.
            </p>

            <h2 className="article-h2">What You Cannot Do</h2>
            <p className="article-paragraph">
              You may not use CleanStart&apos;s Services for the following, including but not
              limited to:
            </p>
            <ul className="article-ul">
              <li className="article-li">
                <strong>Illegal or Harmful Activity</strong> Using the Services for anything that
                violates applicable law, promotes violence or hatred, causes harm to others, or
                damages CleanStart&apos;s reputation.
              </li>
              <li className="article-li">
                <strong>Objectionable Content</strong> Using the Services to create, share, or
                distribute content that is harassing, defamatory, obscene, indecent, or otherwise
                objectionable.
              </li>
              <li className="article-li">
                <strong>Fraudulent or Misleading Activity</strong> Using the Services to make false
                representations, spread misleading information, or engage in any deceptive or
                fraudulent conduct.
              </li>
              <li className="article-li">
                <strong>Intellectual Property Violations</strong> Using the Services in a way that
                infringes the rights of others, including content protected by copyright,
                trademark, or patent.
              </li>
              <li className="article-li">
                <strong>Impersonation</strong> Using the Services to impersonate CleanStart, its
                team, or any other person or entity, or misrepresenting your affiliation with
                CleanStart.
              </li>
              <li className="article-li">
                <strong>Unauthorized Redistribution</strong> Reselling, sublicensing, or
                distributing CleanStart&apos;s Services to third parties as a standalone product
                without our prior written consent.
              </li>
              <li className="article-li">
                <strong>Competitive Use</strong> Using CleanStart&apos;s Services to develop or
                offer products or services that compete with CleanStart.
              </li>
              <li className="article-li">
                <strong>Disruption</strong> Using the Services in any way that interferes with,
                degrades, or disrupts the experience of other users or the normal operation of
                CleanStart&apos;s platform.
              </li>
              <li className="article-li">
                <strong>Privacy Violations</strong> Using the Services to collect or misuse
                information about others without their consent or sharing your account access with
                unauthorized parties.
              </li>
            </ul>

            <h2 className="article-h2">Compliance with Applicable Laws</h2>
            <p className="article-paragraph">
              You agree to use the CleanStart Service in full compliance with all applicable local,
              state, national, and international laws and regulations, including but not limited
              to data protection laws, privacy laws, and export control regulations.
            </p>

            <h2 className="article-h2">General Terms</h2>
            <p className="article-paragraph">
              If you breach this AUP, CleanStart reserves the right to immediately suspend or
              terminate your access to the Service. Where possible, we will endeavour to notify you
              and provide an opportunity to remedy the situation before taking further action.
            </p>
            <p className="article-paragraph">
              CleanStart may also terminate your subscription agreement for cause in the event of a
              serious or repeated violation. We reserve the right to remove any prohibited content
              and deny access to any person who violates this AUP.
            </p>
            <p className="article-paragraph">
              Please note that CleanStart may be required to disclose information about your use of
              the Service if mandated by law, regulation, court order, or government request.
              Where we are permitted to do so, we will notify you of any such disclosure.
            </p>
          </LegalProse>
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
