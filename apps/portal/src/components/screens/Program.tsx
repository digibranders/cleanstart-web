import Link from "next/link";
import { EXTENSION_DAYS, MAX_EXTENSIONS, PROTECTION_DAYS, REVIEW_SLA_BUSINESS_DAYS } from "@/lib/deal-rules";
import { PARTNER_ROLE_LABEL } from "@/lib/domain";
import { ROUTES } from "@/lib/routes";

const BODY = { margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#5E5B6E" } as const;
const LIST = { ...BODY, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 } as const;
const HALF = { flex: "1 1 420px", minWidth: 0 } as const;

export function Program(): React.JSX.Element {
  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Program</h1>
          <span className="h1-sub">How the CleanStart partner program works.</span>
        </div>
      </div>

      <div className="row">
        <section aria-labelledby="benefits" className="card clip" style={HALF}>
          <div className="card-h">
            <h2 id="benefits" className="card-t">
              What you get
            </h2>
          </div>
          <div className="card-b">
            <ul style={LIST}>
              <li>Deal protection: a deal CleanStart accepts is protected for {PROTECTION_DAYS} days.</li>
              <li>
                <Link href={ROUTES.partner.documents}>Documents</Link>: guides, datasheets and sales material.
              </li>
              <li>A partner manager at CleanStart, for questions about a deal or the program.</li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="protection" className="card clip" style={HALF}>
          <div className="card-h">
            <h2 id="protection" className="card-t">
              Deal protection
            </h2>
          </div>
          <div className="card-b">
            <ul style={LIST}>
              <li>Protection runs {PROTECTION_DAYS} days from the day CleanStart accepts the deal.</li>
              <li>
                CleanStart reviews each registration within {REVIEW_SLA_BUSINESS_DAYS} business days (Monday to
                Friday).
              </li>
              <li>
                You can extend protection {MAX_EXTENSIONS === 1 ? "once" : `${MAX_EXTENSIONS} times`}, by{" "}
                {EXTENSION_DAYS} days.
              </li>
            </ul>
          </div>
        </section>
      </div>

      <div className="row">
        <section aria-labelledby="register" className="card clip" style={HALF}>
          <div className="card-h">
            <h2 id="register" className="card-t">
              How to register a deal
            </h2>
          </div>
          <div className="card-b">
            <ol style={LIST}>
              <li>
                Open <Link href={ROUTES.partner.newDeal}>Register deal</Link> and fill in the customer and the
                product. Each registration covers one product.
              </li>
              <li>Submit it. CleanStart reviews it and you get a notification with the decision.</li>
              <li>
                Follow it on <Link href={ROUTES.partner.deals}>Deals</Link>. Protection starts when CleanStart accepts
                it.
              </li>
            </ol>
          </div>
        </section>

        <section aria-labelledby="roles" className="card clip" style={HALF}>
          <div className="card-h">
            <h2 id="roles" className="card-t">
              Roles
            </h2>
          </div>
          <div className="card-b">
            <ul style={LIST}>
              <li>
                {PARTNER_ROLE_LABEL.partner_admin}: manages the <Link href={ROUTES.partner.team}>team</Link>, the
                company profile and deals.
              </li>
              <li>{PARTNER_ROLE_LABEL.sales}: registers and tracks deals, and uses documents.</li>
              <li>{PARTNER_ROLE_LABEL.technical}: uses documents and sees the company profile.</li>
            </ul>
          </div>
        </section>
      </div>

      <section aria-labelledby="support" className="card clip">
        <div className="card-h">
          <h2 id="support" className="card-t">
            Support
          </h2>
        </div>
        <div className="card-b">
          <p style={BODY}>
            Your partner manager is your contact. Find their name and email on{" "}
            <Link href={ROUTES.partner.company}>Company</Link>, or use Message your partner manager in the Help menu.
          </p>
        </div>
      </section>
    </div>
  );
}
