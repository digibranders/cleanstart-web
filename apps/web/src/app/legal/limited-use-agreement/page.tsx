import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Limited Use Agreement",
  description:
    "The CleanStart Limited Use Agreement governs your access to and use of the CleanStart website, registry, services, and software.",
  path: "/legal/limited-use-agreement",
});

export default function LimitedUseAgreementPage() {
  return (
    <>
      <JsonLd
        id="lua-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Legal", path: "/legal" },
          { name: "Limited Use Agreement" },
        ])}
      />
      <h1 className="article-h1">Limited Use Agreement</h1>
            <p className="article-paragraph">
              Triam Security India Pvt. Ltd. (Brand Name: CleanStart)
              <br />
              Effective Date: [&bull;]
            </p>
            <p className="article-paragraph">
              This Limited Use Agreement (&ldquo;Agreement&rdquo;) governs your access to and use of
              the website www.cleanstart.com (&ldquo;Website&rdquo;) operated by Triam Security India
              Pvt. Ltd., operating under its brand name &ldquo;CleanStart&rdquo; (&ldquo;CleanStart,
              &rdquo; &ldquo;we,&rdquo; or &ldquo;our&rdquo;).
            </p>
            <p className="article-paragraph">
              By accessing or using this Website, you (&ldquo;User&rdquo; or &ldquo;you&rdquo;) agree
              to be bound by these Terms. If you do not agree, you must not access or use the Website.
            </p>
            <p className="article-paragraph">
              PLEASE READ THESE TERMS AND CONDITIONS CAREFULLY BEFORE USING ANY SERVICE OR SOFTWARE
              OFFERED BY TRIAM SECURITY INDIA PVT. LTD. (operating under its brand name
              &ldquo;CleanStart&rdquo;). BY ACCESSING OR USING THE SERVICES OR SOFTWARE IN ANY MANNER,
              YOU (&ldquo;YOU&rdquo; OR &ldquo;CUSTOMER&rdquo;) AGREE TO BE BOUND BY THESE TERMS (THE
              &ldquo;AGREEMENT&rdquo;) TO THE EXCLUSION OF ALL OTHER TERMS, UNLESS OTHERWISE SPECIFIED
              HEREIN. YOU REPRESENT AND WARRANT THAT YOU HAVE THE AUTHORITY TO ENTER INTO THIS
              AGREEMENT. IF YOU ARE ENTERING INTO THIS AGREEMENT ON BEHALF OF AN ORGANIZATION OR
              ENTITY, REFERENCES TO &ldquo;CUSTOMER&rdquo; AND &ldquo;YOU&rdquo; IN THIS AGREEMENT,
              EXCEPT THIS SENTENCE, REFER TO THAT ORGANIZATION OR ENTITY. IF YOU DO NOT AGREE TO ALL
              OF THE FOLLOWING, YOU MAY NOT USE OR ACCESS THE SERVICES IN ANY MANNER. IF THE TERMS OF
              THIS AGREEMENT ARE CONSIDERED AN OFFER, ACCEPTANCE IS EXPRESSLY LIMITED TO SUCH TERMS.
            </p>

            <h2 className="article-h2">1. Terms Applicable to the Registry and Acceptable Use Policy</h2>
            <h3 className="article-h3">1.1 Registry</h3>
            <p className="article-paragraph">
              To the extent you access or make use of the CleanStart repository available at the
              following URL: [Insert Link] (the &ldquo;Registry&rdquo;), you agree to the terms and
              conditions set forth herein. You are responsible for management of login information and
              access credentials, and must prevent unauthorized access or use of the Registry. You are
              responsible for use by any person to whom you grant access, even if unauthorized.
            </p>
            <p className="article-paragraph">
              Any content uploaded to the Registry by you is considered Customer Data, for which you
              are solely responsible. You acknowledge that unauthorized third parties may gain access
              to or tamper with Customer Data. CleanStart is not liable for such unauthorized access
              unless caused by CleanStart&apos;s gross negligence or wilful misconduct.
            </p>
            <p className="article-paragraph">
              Use of the Registry is permitted solely for the Authorized Use defined herein.
            </p>

            <h2 className="article-h2">2. Limited Use Terms</h2>
            <p className="article-paragraph">
              Your use of the Registry, Software, and Service is limited to your internal use in India
              for the period authorized by CleanStart (the &ldquo;Authorized Use&rdquo;).
            </p>

            <h2 className="article-h2">3. Terms Applicable to the Service</h2>
            <h3 className="article-h3">3.1 Access to and Scope of Service</h3>
            <p className="article-paragraph">
              CleanStart will use commercially reasonable efforts to provide the service made
              available under this Agreement (the &ldquo;Service&rdquo;). Subject to your compliance,
              you may access and use the Service for the Authorized Use.
            </p>
            <h3 className="article-h3">3.2 Restrictions</h3>
            <p className="article-paragraph">You agree not to, and shall not permit others to:</p>
            <ul className="article-ul">
              <li className="article-li">(a) remove proprietary notices;</li>
              <li className="article-li">
                (b) reverse engineer or attempt to discover the Service&apos;s underlying source code
                or algorithms;
              </li>
              <li className="article-li">(c) rent, resell, or provide access to third parties; or</li>
              <li className="article-li">(d) use the Service to develop or offer competing products.</li>
            </ul>
            <p className="article-paragraph">
              Any violation entitles CleanStart to suspend or terminate access immediately without
              liability.
            </p>
            <h3 className="article-h3">3.3 Customer Data</h3>
            <p className="article-paragraph">
              You are solely responsible for Customer Data, including compliance with all Indian laws
              (including the Information Technology Act, 2000 and the Digital Personal Data Protection
              Act, 2023). CleanStart is not responsible for unauthorized access unless due to its
              gross negligence or wilful misconduct.
            </p>
            <h3 className="article-h3">3.4 Use of Customer Data</h3>
            <p className="article-paragraph">
              You grant CleanStart a limited license to use Customer Data solely to provide the
              Service. CleanStart has no obligation to retain Customer Data beyond thirty (30) days
              after termination unless required by law or agreed in writing.
            </p>
            <h3 className="article-h3">3.5 Aggregated De-identified Data</h3>
            <p className="article-paragraph">
              CleanStart may freely use Aggregated De-identified Data for business purposes including
              improving, testing, operating, and marketing its services.
            </p>
            <h3 className="article-h3">3.6 Personal Data</h3>
            <p className="article-paragraph">
              If you use the Service with personal data subject to GDPR or Indian DPDP Act, such use
              is permitted only if you first enter into CleanStart&apos;s Data Processing Agreement
              (&ldquo;DPA&rdquo;).
            </p>
            <h3 className="article-h3">3.7 Service Suspension</h3>
            <p className="article-paragraph">CleanStart may suspend your access:</p>
            <ul className="article-ul">
              <li className="article-li">(a) if use poses a security risk;</li>
              <li className="article-li">(b) if you are insolvent or subject to insolvency proceedings; or</li>
              <li className="article-li">
                (c) following ten (10) days&apos; notice if you breach this Agreement.
              </li>
            </ul>

            <h2 className="article-h2">4. Terms Applicable to the CleanStart Software</h2>
            <h3 className="article-h3">4.1 License Grant</h3>
            <p className="article-paragraph">
              CleanStart grants you a term-limited, non-exclusive, non-transferable, non-assignable
              and non-sublicensable license to use CleanStart software (&ldquo;Software&rdquo;) solely
              for the Authorized Use.
            </p>
            <h3 className="article-h3">4.2 License Limitations</h3>
            <p className="article-paragraph">You shall not:</p>
            <ul className="article-ul">
              <li className="article-li">(a) exceed the license scope;</li>
              <li className="article-li">(b) make copies or distribute the Software;</li>
              <li className="article-li">(c) sublicense, rent, or transfer rights;</li>
              <li className="article-li">(d) reverse engineer, except as permitted by Indian law;</li>
              <li className="article-li">(e) modify or create derivative works;</li>
              <li className="article-li">(f) remove intellectual property notices;</li>
              <li className="article-li">
                (g) use the Software with open-source licenses that require distribution in source
                code;
              </li>
              <li className="article-li">(h) use the Software for competing products; or</li>
              <li className="article-li">(i) misuse CleanStart&apos;s trademarks or brand.</li>
            </ul>
            <p className="article-paragraph">
              Unauthorized use may constitute a cognizable offence under Indian law.
            </p>

            <h2 className="article-h2">5. Termination</h2>
            <h3 className="article-h3">5.1 Term</h3>
            <p className="article-paragraph">
              The term of this Agreement shall commence on the date You first download the Software or
              access the Service (the &ldquo;Effective Date&rdquo;), and unless terminated earlier
              according to this Section 5, will terminate at the end of the Authorized Use (the
              &ldquo;Term&rdquo;).
            </p>
            <h3 className="article-h3">5.2 Termination</h3>
            <p className="article-paragraph">This Agreement may be terminated:</p>
            <ul className="article-ul">
              <li className="article-li">
                (a) by either Party for uncured material breach within ten (10) days of written
                notice of such breach to the other party if the breach is remediable, or immediately
                upon notice if the breach is not remediable; or
              </li>
              <li className="article-li">
                (b) by CleanStart at any time, with or without cause, by notice or by suspending
                access.
              </li>
            </ul>
            <h3 className="article-h3">5.3 Effect of Termination</h3>
            <p className="article-paragraph">
              Upon termination, you must immediately cease use of the Registry, Service, and Software.
              CleanStart is not obligated to return Customer Data unless legally required and
              expressly requested within 15 days.
            </p>
            <h3 className="article-h3">5.4 Survival</h3>
            <p className="article-paragraph">
              The following provisions will survive termination of this Agreement: Sections 3.4 (Use
              of Customer Data), 3.5 (Aggregated De-Identified Data), 5.3 (Effect of Termination),
              Section 5.4 (Survival), Section 6 (Confidentiality and Ownership), Section 9 (Limitation
              of Liability), Section 10 (Miscellaneous).
            </p>

            <h2 className="article-h2">6. Confidentiality and Ownership</h2>
            <h3 className="article-h3">6.1 Confidentiality</h3>
            <p className="article-paragraph">
              During the term of this Agreement, either party may provide the other party with
              confidential and/or proprietary materials and information (&ldquo;Confidential
              Information&rdquo;). All materials and information provided by the disclosing party and
              identified at the time of disclosure as &ldquo;Confidential&rdquo; or bearing a similar
              legend, and all other information that the receiving party reasonably should have known
              was the Confidential Information of the disclosing party, shall be considered
              Confidential Information. This Agreement is Confidential Information, and all pricing
              terms are CleanStart Confidential Information. The receiving party shall maintain the
              confidentiality of the Confidential Information and will not disclose such information to
              any third party without the prior written consent of the disclosing party. The
              receiving party will only use the Confidential Information internally for the purposes
              contemplated hereunder. The obligations in this Section shall not apply to any
              information that: (a) is made generally available to the public without breach of this
              Agreement, (b) is developed by the receiving party independently from and without
              reference to the Confidential Information, (c) is disclosed to the receiving party by a
              third party without restriction, or (d) was in the receiving party&apos;s lawful
              possession prior to the disclosure and was not obtained by the receiving party either
              directly or indirectly from the disclosing party. The receiving party may disclose
              Confidential Information as required by law or court order provided that the receiving
              party provides the disclosing party with prompt written notice thereof and uses the
              receiving party&apos;s best efforts to limit disclosure. At any time, upon the
              disclosing party&apos;s written request, the receiving party shall return to the
              disclosing party all of the disclosing party&apos;s Confidential Information in its
              possession, including, without limitation, all copies and extracts thereof.
            </p>
            <h3 className="article-h3">6.2 Ownership</h3>
            <p className="article-paragraph">
              CleanStart retains all right, title, and interest in and to the Registry, Service,
              Software, and any software, products, works or other intellectual property created,
              used, provided or made available by CleanStart under or in connection with the Registry,
              Service or Software.
            </p>
            <h3 className="article-h3">6.3 Feedback</h3>
            <p className="article-paragraph">
              Customer may from time to time provide suggestions, comments or other feedback to
              CleanStart with respect to the Registry, Service or Software (&ldquo;Feedback&rdquo;).
              Feedback, even if designated as confidential by Customer, shall not create any
              confidentiality obligation for CleanStart notwithstanding anything else. Customer shall,
              and hereby does, grant to CleanStart a non-exclusive, worldwide, perpetual, irrevocable,
              transferable, sublicensable, royalty-free, fully paid-up license to use and exploit the
              Feedback for any purpose. Nothing in this Agreement will impair CleanStart&apos;s right
              to develop, acquire, license, market, promote or distribute products, services, software
              or technologies that perform the same or similar functions as, or otherwise compete
              with, any products, software or technologies that Customer may develop, produce, market,
              or distribute.
            </p>

            <h2 className="article-h2">7. Indemnification</h2>
            <p className="article-paragraph">
              Customer shall indemnify, defend, and hold harmless CleanStart, its affiliates, and
              representatives, and each of their respective officers, directors, employees and
              representatives from and against any claims, damages, losses, liabilities, costs, and
              expenses (including reasonable attorneys&apos; fees), or governmental proceedings
              (including under Indian IT and data protection laws) arising out of or relating to any
              third party claim with respect to:
            </p>
            <ul className="article-ul">
              <li className="article-li">(a) Customer Data;</li>
              <li className="article-li">
                (b) breach of this Agreement or violation of applicable law by Customer;
              </li>
              <li className="article-li">
                (c) alleged infringement or misappropriation of third-party intellectual property
                rights resulting from Customer Data; or
              </li>
              <li className="article-li">(d) breach of, or non-compliance with, the AUP.</li>
            </ul>

            <h2 className="article-h2">8. Warranty Disclaimer</h2>
            <p className="article-paragraph">
              CleanStart does not represent or warrant that the operation of the Registry, Service or
              Software (or any portion thereof) will be uninterrupted or error free, or that the
              Registry, Service or Software (or any portion thereof) will operate in combination with
              other hardware, software, systems or data not provided by CleanStart. CUSTOMER
              ACKNOWLEDGES THAT CLEANSTART MAKES NO EXPRESS OR IMPLIED REPRESENTATIONS OR WARRANTIES
              OF ANY KIND WITH RESPECT TO THE REGISTRY, SERVICE OR SOFTWARE, OR THEIR CONDITION.
              CLEANSTART HEREBY EXPRESSLY EXCLUDES ANY AND ALL OTHER EXPRESS OR IMPLIED
              REPRESENTATIONS OR WARRANTIES, WHETHER UNDER COMMON LAW, STATUTE OR OTHERWISE, INCLUDING
              WITHOUT LIMITATION ANY AND ALL WARRANTIES AS TO MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, SATISFACTORY QUALITY OR NON-INFRINGEMENT OF THIRD-PARTY RIGHTS.
            </p>

            <h2 className="article-h2">9. Limitation of Liability</h2>
            <p className="article-paragraph">
              IN NO EVENT SHALL CLEANSTART BE LIABLE FOR ANY LOST DATA, LOST PROFITS, BUSINESS
              INTERRUPTION, REPLACEMENT SERVICE OR OTHER SPECIAL, INCIDENTAL, CONSEQUENTIAL, PUNITIVE
              OR INDIRECT DAMAGES, HOWEVER CAUSED AND REGARDLESS OF THEORY OF LIABILITY.
              CLEANSTART&apos;S LIABILITY FOR ALL CLAIMS ARISING UNDER THIS AGREEMENT, WHETHER IN
              CONTRACT, TORT OR OTHERWISE, SHALL NOT EXCEED THE LESSER OF (A) THE FEES PAID BY CUSTOMER
              IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM; OR (B) ONE LAKH (INR 1,00,000).
            </p>

            <h2 className="article-h2">10. Miscellaneous</h2>
            <h3 className="article-h3">10.1 Export Control</h3>
            <p className="article-paragraph">
              Customer shall comply with Indian and applicable export/import control laws.
            </p>
            <h3 className="article-h3">10.2 Compliance with Laws</h3>
            <p className="article-paragraph">
              Customer shall comply with all applicable Indian laws including the IT Act 2000, DPDP
              Act 2023, and privacy regulations.
            </p>
            <p className="article-paragraph">
              Customer shall comply with all applicable laws and regulations in its use of the
              Registry and any Software or Service, including without limitation the unlawful
              gathering or collecting, or assisting in the gathering or collecting of information in
              violation of any privacy laws or regulations. Customer shall, at its own expense,
              defend, indemnify and hold harmless CleanStart from and against any and all claims,
              losses, liabilities, damages, judgments, government or federal sanctions, costs and
              expenses (including attorneys&apos; fees) incurred by CleanStart arising from any claim
              or assertion by any third party of violation of privacy laws or regulations by Customer
              or any of its agents, officers, directors or employees.
            </p>
            <h3 className="article-h3">10.3 Assignment</h3>
            <p className="article-paragraph">
              Neither party may transfer or assign its rights and obligations under this Agreement
              without the prior written consent of the other party. Notwithstanding the foregoing,
              CleanStart may transfer and assign its rights under this Agreement without consent from
              the other party in connection with a change in control, acquisition or sale of all or
              substantially all of its assets. Any attempted assignment in violation of the foregoing
              shall be null and void.
            </p>
            <h3 className="article-h3">10.4 Force Majeure</h3>
            <p className="article-paragraph">
              Neither party shall be responsible for failure or delay in performance by events out of
              their reasonable control, including but not limited to, acts of God, Internet outage,
              terrorism, war, fires, earthquakes and other disasters (each a &ldquo;Force
              Majeure&rdquo;).
            </p>
            <h3 className="article-h3">10.5 Notices</h3>
            <p className="article-paragraph">
              Notices must be in writing and delivered by courier, registered post, or recognized
              delivery service.
            </p>
            <h3 className="article-h3">10.6 No Agency</h3>
            <p className="article-paragraph">
              Both parties agree that no agency, partnership, joint venture, or employment is created
              as a result of this Agreement. Customer does not have any authority of any kind to bind
              CleanStart.
            </p>
            <h3 className="article-h3">10.7 Governing Law and Jurisdiction</h3>
            <p className="article-paragraph">
              This Agreement shall be governed by and construed in accordance with the laws of India.
              Any disputes shall be subject to the exclusive jurisdiction of the courts at [Insert
              City - e.g., New Delhi or Gurugram], India.
            </p>
            <h3 className="article-h3">10.8 Publicity</h3>
            <p className="article-paragraph">
              Customer hereby grants CleanStart the right to identify Customer as a CleanStart
              customer, and use Customer&apos;s name, mark and logo on CleanStart&apos;s website and
              in CleanStart&apos;s marketing materials with respect to the same without royalty or
              compensation.
            </p>
            <h3 className="article-h3">10.9 Updated Agreement</h3>
            <p className="article-paragraph">
              CleanStart reserves the right to update this Agreement at any time. The terms and
              conditions of the updated version of the Agreement shall apply to the Registry, Services
              and Software following the date of publication of the updated version on
              CleanStart&apos;s website at the following URL: [www.cleanstart.com]. If Customer does
              not agree with any terms of the updated Agreement, Customer may not use or access the
              Registry, Service or Software in any manner.
            </p>
            <h3 className="article-h3">10.10 Contact Information</h3>
            <p className="article-paragraph">
              Triam Security India Pvt. Ltd. (Brand Name: CleanStart)
              <br />
              [Registered Office Address]
              <br />
              Email: <a href="mailto:legal@cleanstart.com">legal@cleanstart.com</a>
            </p>
            <h3 className="article-h3">10.11 Entire Agreement</h3>
            <p className="article-paragraph">
              This Agreement is the complete and exclusive statement of the mutual understanding of
              the parties and supersedes and cancels all previous written and oral agreements,
              communications, and other understandings relating to the subject matter of this
              Agreement, and all waivers and modifications must be in a writing signed by both
              parties, except as otherwise provided in this Agreement. Any term or provision of this
              Agreement held to be illegal or unenforceable shall be, to the fullest extent possible,
              interpreted so as to be construed as valid, but in any event the validity or
              enforceability of the remainder hereof shall not be affected.
            </p>
    </>
  );
}
