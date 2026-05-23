import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { LegalHero } from "@/components/sections/legal/LegalHero";
import { LegalProse } from "@/components/sections/legal/LegalProse";
import { FadeUp } from "@/components/ui/FadeUp";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "CleanStart's Privacy Policy describes how we collect, use, and protect your personal information across our website, software, and services.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <JsonLd
        id="privacy-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Privacy Policy" },
        ])}
      />
      <Header />
      <main>
        <LegalHero title="Privacy Policy" />
        <FadeUp>
          <LegalProse>
            <p className="article-paragraph"><strong>Last Updated:</strong> 31-03-2026</p>

            <h2 className="article-h2">Data Controller / Data Fiduciary</h2>
            <p className="article-paragraph">
              For the purposes of applicable data protection laws: For users located in India,
              CleanStart Security Private Limited acts as the &ldquo;Data Fiduciary&rdquo;. For
              users located in Singapore, CleanStart Security Pte. Ltd. acts as the data controller.
              For users located in the United States, CleanStart Security INC acts as the data
              controller. For users located outside these jurisdictions, the relevant CleanStart
              group entity providing the Services shall act as the data controller.
            </p>
            <p className="article-paragraph">
              CleanStart, its affiliates and subsidiaries (&ldquo;we,&rdquo; &ldquo;us,&rdquo;
              &ldquo;our&rdquo;), thank you for using our services. This Privacy Policy aims to
              inform you about the collection, use, and disclosure of personal information when you
              use our website, software, and services, collectively referred to as the
              &ldquo;Service&rdquo;. We are committed to protecting your privacy and ensuring
              compliance with relevant data protection laws in the countries we operate in.
            </p>

            <h2 className="article-h2">1. Scope</h2>
            <p className="article-paragraph">
              At CleanStart, we believe that you should always be aware of the information we
              collect from you, the reasons for which we use it, and be empowered to make informed
              choices regarding the data you share with us. Accordingly, we aim to maintain
              complete transparency by informing you: how and why we collect, store, and process
              your personal data in the course of your interactions with us; the rights available
              to you in controlling and defining the extent of such interactions.
            </p>
            <p className="article-paragraph"><strong>Our Services are not directed at children.</strong></p>
            <p className="article-paragraph">
              In India, we do not knowingly process personal data of individuals under 18 years of
              age without verifiable parental consent, as required under applicable law. In the
              United States, our Services are not directed at children under 13 years of age. In
              Singapore, we comply with applicable requirements relating to minors&rsquo; data. If
              we become aware that we have collected personal data of a child in violation of
              applicable law, we will take steps to delete such information.
            </p>

            <h2 className="article-h2">2. Summary</h2>
            <p className="article-paragraph">
              While we would strongly advise you to read the Policy in full, the following summary
              will give you a snapshot of the salient points covered herein:
            </p>
            <ul className="article-ul">
              <li className="article-li">
                This Policy details the critical aspects governing your personal data relationship
                with CleanStart Security INC, having its registered office at 16192 Coastal
                Highway, Lewes, Delaware 19958, United States, and its subsidiary, CleanStart
                Security Private Limited., a company incorporated under the Laws of India, and
                having its registered office at 207-208, Arizona Business, Near Nav Gujarat
                College, Usmanpura, Ashram Road, Ahmedabad Gujarat 380013, India and CleanStart
                Security Pte. Ltd. a company incorporated under the Laws of Singapore, and having
                its registered office at 1003 Bukit Merah Central, #07-23, Singapore 159836
                (collectively, CleanStart);
              </li>
              <li className="article-li">
                Your personal data relationship with CleanStart varies based on the capacity in
                which you interact with us/avail of our Services. You could be: (i) a visitor to{" "}
                <a href="https://www.cleanstart.com/">https://www.cleanstart.com/</a> (&ldquo;Website&rdquo;)
                or any pages thereof (&ldquo;Visitor&rdquo;); (ii) a person/entity availing of one
                of our Services (&ldquo;Customer&rdquo;); or (iii) an
                employee/agent/representative/appointee of a customer who uses the said Service
                (&ldquo;User&rdquo;);
              </li>
              <li className="article-li">
                Based on whether you are a Visitor, Customer or User, the type of data we collect
                and the purpose for which we use it will differ and this Policy details such
                variations;
              </li>
              <li className="article-li">
                This Policy is a part of and should be read in conjunction with our{" "}
                <a href="/legal">Legal Terms</a>.
              </li>
              <li className="article-li">
                This Policy will clarify the rights available to you vis-à-vis the personal data
                you share with us.
              </li>
              <li className="article-li">
                If you have any queries or concerns with this Policy, please contact our Grievance
                Officer (refer Section 11). If you do not agree with the Policy, we would advise
                you to not visit/use the Website or the CleanStart application(s)/platform(s)
                (collectively &ldquo;App&rdquo;).
              </li>
            </ul>

            <h2 className="article-h2">3. Information We Collect and How We Use</h2>
            <p className="article-paragraph">
              You agree to use the CleanStart Service in full compliance with all applicable local,
              state, national, and international laws and regulations, including but not limited to
              data protection laws, privacy laws, and export control regulations.
            </p>

            <div className="my-8 overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ fontSize: "var(--text-body-sm)" }}>
                <thead>
                  <tr className="bg-[#F4F6FB]">
                    <th className="border border-[#E2E8F0] p-3 align-top w-[18%]">Type of User</th>
                    <th className="border border-[#E2E8F0] p-3 align-top w-[41%]">What Data We May Collect</th>
                    <th className="border border-[#E2E8F0] p-3 align-top w-[41%]">How and Why We Use It</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-[#E2E8F0] p-3 align-top"><strong>Visitor</strong></td>
                    <td className="border border-[#E2E8F0] p-3 align-top">
                      Your IP Address; Your location; How you behave on the Website (what pages you
                      land on, how much time you spend, etc.); What Device you use to access the
                      Website and its details (model, operating system, etc.); Cookies and Web
                      Beacon data; and Data from third parties who have your explicit consent to
                      lawfully share that data. If you submit an inquiry through the Website, we
                      will ask for your Name and E-mail. Job applicant information as we may post
                      job openings and opportunities on the website. If you reply to one of these
                      postings by submitting your application, we will collect your full name,
                      email address, phone number, resume, and cover letter.
                    </td>
                    <td className="border border-[#E2E8F0] p-3 align-top">
                      We use this information to analyse and identify your behaviour and enhance
                      the interactions you have with the Website. If you submit your details and
                      give us your consent, we may use your data to send you e-mails/newsletters,
                      re-target CleanStart advertisements or re-market our Services using services
                      from third-parties like Facebook and Google.
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#E2E8F0] p-3 align-top"><strong>Customer</strong></td>
                    <td className="border border-[#E2E8F0] p-3 align-top">
                      The name and e-mail of your representative who signs up for a Service on your
                      behalf; and Credit Card/Debit Card/Other Payment Mode information to check
                      your financial qualifications, detect fraud and facilitate payments for our
                      Services. Feedback and support information such as information collected
                      based on your participation in our surveys, including feedback on your use of
                      our Services, and any information contained in support requests.
                    </td>
                    <td className="border border-[#E2E8F0] p-3 align-top">
                      We collect this data in order to help you register for and facilitate
                      provision of our Services. We also use this data to enable you to make
                      payments for our Services. We use a third-party service provider to manage
                      payment processing. If you give us your consent, we may send you newsletters
                      and e-mails to market other products and services we may provide.
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#E2E8F0] p-3 align-top"><strong>User</strong></td>
                    <td className="border border-[#E2E8F0] p-3 align-top">
                      Your name, e-mail; Your IP Address; Your location (unless you deactivate
                      location services in the relevant section of the App); How you behave in the
                      relevant product environment and use the features; What device you use to
                      access the Website/App and its details (model, operating system, etc.);
                      Cookies and Web Beacon data; Data from third parties who have your explicit
                      consent to lawfully share that data.
                    </td>
                    <td className="border border-[#E2E8F0] p-3 align-top">
                      We collect this data in order to facilitate provision of our Services. We
                      will occasionally send you e-mails regarding changes or updates to the
                      Service that you are using. If you give us your consent, we may send you
                      newsletters and e-mails to market other products and services we may provide.
                      We may also conduct anonymized usage behaviour analysis at the aggregate
                      level to determine how the features of a particular Service are being used.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="article-h3">Information We Collect from External Sources</h3>
            <p className="article-paragraph">
              We may occasionally receive additional information about you from external sources,
              including third parties from whom we have lawfully acquired personal data. Such
              sources may include joint marketing collaborators, our group entities or affiliates,
              lead generation partners, event organisers, public databases, credit verification
              agencies, data service providers, and social media platforms. The categories of
              personal information obtained from such external sources may consist of: Contact and
              professional details such as mailing addresses, designations, email addresses, phone
              numbers, intent or behavioural insights, IP addresses, social media accounts,
              LinkedIn profiles, and other customised profile data. Information contained in
              résumés and background verification records. Transactional and service-related
              details including order history, delivery and payment information, purchase or
              redemption records, customer assistance data, and enrolment-related information.
            </p>

            <h3 className="article-h3">Legal Basis for Processing</h3>
            <p className="article-paragraph">
              We process personal data on the following legal bases, depending on the jurisdiction
              and nature of processing: To perform a contract or take steps prior to entering into
              a contract with you; Based on your consent; To comply with legal obligations; For
              legitimate business interests, including improving our Services, ensuring security,
              and preventing fraud, provided such interests do not override your rights. Where
              consent is required under applicable law, you may withdraw your consent at any time.
            </p>

            <h2 className="article-h2">4. How We Store and Protect Your Information</h2>
            <p className="article-paragraph">
              The Information that you provide, subject to disclosure in accordance with this
              Privacy Policy, shall be maintained in a safe and secure manner. CleanStart databases
              and information are stored on secure servers with appropriate firewalls.
            </p>
            <p className="article-paragraph">
              CleanStart uses industry standard physical, technical and administrative security
              measures in accordance with all security standards required under applicable law to
              safeguard and keep secure your Information. We conduct periodic reviews of our
              security measures pertaining to our information collection and storage, to guard
              against unauthorized access to systems.
            </p>
            <p className="article-paragraph">
              Given the nature of internet transactions, CleanStart does not take any
              responsibility for the transmission of information including User Information shared
              by you. Any transmission of User Information on the internet is done at your risk and
              CleanStart shall not be responsible for the circumvention of the privacy settings or
              security measures either by you or any third party.
            </p>
            <p className="article-paragraph">
              When you enter User information (such as log in credentials) in respect of your User
              Account (&ldquo;User Information&rdquo;) or when you upload any Information through
              the use of the Platform, we take reasonable efforts to ensure that your User
              Information and all other information submitted by you is safe and secure; however,
              the Company makes no representation, warranties or other assurances that the security
              measures are adequate, safe, fool proof or impenetrable.
            </p>
            <p className="article-paragraph">
              As a User of the Services, you have the responsibility to ensure data security. You
              should use the Services responsibly and not share your User Information including
              your username or password or account information with any person. You are solely
              responsible for all acts done under the account registered to you.
            </p>
            <p className="article-paragraph">
              In the event of a personal data breach that is likely to result in risk to your
              rights or as required under applicable law, we will notify the relevant regulatory
              authority and/or affected individuals within the timelines prescribed under
              applicable law. We will take appropriate remedial steps to mitigate the impact of
              such breach.
            </p>

            <h2 className="article-h2">5. Your Rights &amp; Preferences as a Data Subject</h2>
            <p className="article-paragraph">
              Depending on the jurisdiction and the applicable law, you may have certain rights
              regarding your personal information:
            </p>

            <h3 className="article-h3">5.1 Singapore — PDPA</h3>
            <p className="article-paragraph">
              In line with Singapore&rsquo;s Personal Data Protection Act, you may have the
              following rights:
            </p>
            <div className="my-6 overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ fontSize: "var(--text-body-sm)" }}>
                <thead>
                  <tr className="bg-[#F4F6FB]">
                    <th className="border border-[#E2E8F0] p-3 w-[8%]">Sl. No.</th>
                    <th className="border border-[#E2E8F0] p-3 w-[28%]">Right</th>
                    <th className="border border-[#E2E8F0] p-3">Requirement</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-[#E2E8F0] p-3 align-top">1.</td><td className="border border-[#E2E8F0] p-3 align-top"><strong>Right to be informed</strong></td><td className="border border-[#E2E8F0] p-3 align-top">You have a right to be informed about the manner in which any of your personal data is collected or used which we have endeavoured to do by way of this Policy.</td></tr>
                  <tr><td className="border border-[#E2E8F0] p-3 align-top">2.</td><td className="border border-[#E2E8F0] p-3 align-top"><strong>Right of access</strong></td><td className="border border-[#E2E8F0] p-3 align-top">You have a right to access the personal data you have provided by requesting us to provide you with the same.</td></tr>
                  <tr><td className="border border-[#E2E8F0] p-3 align-top">3.</td><td className="border border-[#E2E8F0] p-3 align-top"><strong>Right to rectification</strong></td><td className="border border-[#E2E8F0] p-3 align-top">You have a right to request us to amend or update your personal data if it is inaccurate or incomplete.</td></tr>
                  <tr><td className="border border-[#E2E8F0] p-3 align-top">4.</td><td className="border border-[#E2E8F0] p-3 align-top"><strong>Right to object</strong></td><td className="border border-[#E2E8F0] p-3 align-top">You have a right, at any time, to object to our processing of your personal data under certain circumstances.</td></tr>
                  <tr><td className="border border-[#E2E8F0] p-3 align-top">5.</td><td className="border border-[#E2E8F0] p-3 align-top"><strong>Right to file a case / complaint</strong></td><td className="border border-[#E2E8F0] p-3 align-top">You have the right to file a complaint with the respective data protection authority or institute civil proceedings against us, if you feel that your rights have been violated.</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="article-h3">5.2 USA</h3>
            <p className="article-paragraph">
              Depending on the State in the USA in which you are located, you may have certain
              rights in accordance with the local data protection laws such as:
            </p>
            <ul className="article-ul">
              <li className="article-li"><strong>Right to know:</strong> You have the right to know about the personal information we have collected from you and the manner in which we use and share this information.</li>
              <li className="article-li"><strong>Right to notice:</strong> You have a right to be informed at or before the point of collection what categories of personal information will be collected and the purposes for which these categories will be used.</li>
              <li className="article-li"><strong>Right to correct:</strong> You have a right to request us to amend or update your personal data if it is inaccurate or incomplete.</li>
              <li className="article-li"><strong>Right to delete:</strong> You have the right to request us to delete the personal information we hold about you, subject to certain restrictions. We may have legal obligations to preserve certain data which could prevent us from deleting it.</li>
              <li className="article-li"><strong>Right to opt out of sale or sharing of data:</strong> You have the right to opt-out of us sharing your personal information. We do not sell any data of our users/customers/leads.</li>
              <li className="article-li"><strong>Right to limit:</strong> You have the right to direct us to use your sensitive personal information only for limited purposes.</li>
              <li className="article-li"><strong>Right to non-discrimination:</strong> We assure no discrimination against consumers exercising their right of privacy.</li>
            </ul>

            <h3 className="article-h3">5.3 India</h3>
            <p className="article-paragraph">
              In accordance with the Digital Personal Data Protection Act, 2023, individuals
              located in India are entitled to the following rights with respect to their personal
              data, subject to the conditions and limitations prescribed under applicable law:
            </p>
            <ul className="article-ul">
              <li className="article-li"><strong>Right of access:</strong> You have the right to request access to a summary of your personal data processed by us, along with information regarding the processing activities undertaken.</li>
              <li className="article-li"><strong>Right to correction and erasure:</strong> You have the right to request correction of inaccurate or misleading personal data and the erasure of personal data that is no longer necessary for the purpose for which it was collected, subject to applicable legal requirements.</li>
              <li className="article-li"><strong>Right to withdraw consent:</strong> You have the right to withdraw your consent at any time for the processing of your personal data, provided that such withdrawal does not affect the lawfulness of processing carried out prior to such withdrawal.</li>
              <li className="article-li"><strong>Right to grievance redressal:</strong> You have the right to register a grievance with us in relation to the processing of your personal data. We shall endeavour to address such grievances within the timelines prescribed under applicable law.</li>
              <li className="article-li"><strong>Right to nominate:</strong> You have the right to nominate another individual to exercise your rights under the DPDP Act in the event of your death or incapacity.</li>
            </ul>

            <h2 className="article-h2">6. Information We Collect Automatically</h2>
            <p className="article-paragraph">
              When you access or interact with our website, we automatically gather certain limited
              technical and usage-related information. This data does not directly identify you
              (such as your name or contact details), but may include information relating to your
              device and usage patterns.
            </p>
            <p className="article-paragraph">
              The information collected automatically includes: Analytics and Usage Data, including
              your public IP address associated with incoming HTTPS requests (such as image
              downloads), and information regarding your interactions with the website, such as
              timestamps of access, pages or files viewed, searches performed, and other actions
              undertaken, including the features you use. Online and Device Information, including
              browser type and configuration, device-related event data (such as system activity,
              error logs or crash reports, and hardware settings), operating system, language
              preferences, device name, and request and referral URLs. Location Information,
              limited to country-level location inferred from your IP address. We may collect this
              information directly through our website or by using web analytics tools and
              technologies, including cookies, web beacons, and similar tracking technologies.
            </p>

            <h2 className="article-h2">7. Information We Share and Disclose</h2>
            <p className="article-paragraph">
              We share Information about you for the following operating and maintaining the
              Services:
            </p>
            <ul className="article-ul">
              <li className="article-li"><strong>To conduct Analytics:</strong> We use collective learnings about how people use our Services and feedback provided directly to us to troubleshoot and identify trends, usage, activity patterns and areas for integration and improvement. We may also share aggregated, pseudonymised information for compliance, industry and market analysis, demographic profiling, marketing and advertising, and other business purposes.</li>
              <li className="article-li"><strong>For Customer Support:</strong> We use your Information to resolve technical issues you encounter, respond to your requests for assistance, analyze crash information, and repair and improve the Services.</li>
              <li className="article-li"><strong>For Legal Reasons:</strong> We will also share Information with individuals or entities to the extent we believe in good faith it is required to ensure compliance with law/regulations and/or pursuant to enforceable orders of government, law enforcement or regulatory authorities; address fraud, security or technical issues; protect against harm to the rights, property or safety of the Product, its other users or the public as required or permitted by law.</li>
              <li className="article-li"><strong>For Effective Provision of Services:</strong> We may share your personal information with our employees, contractors and agents or our affiliates who need to know the information in order to provide Services to you and who are subject to strict contractual confidentiality obligations. We also share your personal information with our third-party service providers (website hosting, data analysis, IT and related infrastructure, customer service, email delivery, auditing, and other services).</li>
              <li className="article-li"><strong>Role as Data Processor:</strong> Where we process personal data on behalf of our Customers in connection with the provision of Services, we act as a data processor/service provider and process such personal data strictly in accordance with the applicable agreement entered into with the Customer and applicable data protection laws.</li>
            </ul>

            <h2 className="article-h2">8. Third-Party Advertising</h2>
            <p className="article-paragraph">
              We use third-party advertising companies to serve advertisements regarding goods and
              services that may be of interest to you when you access and use the Services and
              other websites or online services. You may receive advertisements based on
              information relating to your access to and use of the Services and other websites or
              online services on any of your devices, as well as on information received from third
              parties. These companies place or recognize a unique Cookie on your browser
              (including through the use of pixel tags) and use these technologies, along with
              information they collect about your online use, to recognize you across the devices
              you use.
            </p>

            <h2 className="article-h2">9. Information Retention</h2>
            <p className="article-paragraph">
              We will only keep your personal information for as long as it is necessary for the
              purposes set out in this Privacy Policy, unless a longer retention period is required
              or permitted by law (such as tax, accounting or other legal requirements). To
              determine the appropriate retention period, we consider the nature and sensitivity of
              the information, the potential risk of harm from unauthorized use or disclosure, the
              purposes for which we process the information, and any applicable legal requirements.
              When we have no ongoing legitimate business need to process your personal
              information, we will either delete or anonymize such information, or, if this is not
              possible, securely store and isolate it from any further processing until deletion is
              possible.
            </p>

            <h2 className="article-h2">10. Transfer of Information</h2>
            <p className="article-paragraph">
              If you believe that we have not been able to assist with your complaint or concern,
              depending on the data privacy/protection law applicable in your country, you have the
              right to lodge a complaint with the competent supervisory authority.
            </p>
            <p className="article-paragraph">
              In order for us to facilitate our global operations, we may transfer and access the
              data we collect and process in accordance with this Policy to our group companies
              around the world. We implement appropriate safeguards for cross-border data transfers
              as required under applicable law, which may include contractual safeguards,
              regulatory-approved transfer mechanisms, or other lawful bases for transfer. By using
              our Service and providing your information, you consent to the transfer of your data
              to these international locations.
            </p>
            <p className="article-paragraph">
              We take appropriate measures to ensure the security and confidentiality of your
              personal information during international transfers. These measures may include
              entering into data transfer agreements based on requirements of relevant data
              protection authorities or ensuring that the recipients of your data are certified
              under recognized data protection frameworks.
            </p>
            <p className="article-paragraph">
              Further, in the ordinary course of business, we may employ other companies and people
              to assist us in providing certain components of our Services in compliance with the
              provisions of this Policy. To do so, we may need to share your data with them. We
              will ensure, through contractual agreements and other appropriate measures, that
              these third parties process your data in accordance with applicable data protection
              laws.
            </p>

            <h2 className="article-h2">11. Contact Us</h2>
            <p className="article-paragraph">
              For any privacy-related queries or complaints, you may contact our Grievance Officer
              / Data Protection Contact:
            </p>
            <ul className="article-ul">
              <li className="article-li"><strong>Name:</strong> Saurabh Jain</li>
              <li className="article-li"><strong>Email:</strong> <a href="mailto:legal@cleanstart.com">legal@cleanstart.com</a></li>
            </ul>

            <h2 className="article-h2">12. Amendments</h2>
            <p className="article-paragraph">
              This Privacy Policy is subject to change from time to time. If we make changes to
              this Privacy Policy, we will update the &ldquo;Last Updated&rdquo; date at the top of
              this Privacy Policy. If you disagree with the revised Privacy Policy, you may delete
              your User Account and/or refrain from visiting the website.
            </p>
          </LegalProse>
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
