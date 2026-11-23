"use client";

import Link from "next/link";
import { Drawer } from "@/components/ui/overlay";
import { fmtShort, fmtLong } from "@/lib/dates";
import { countryName } from "@/lib/deal-format";
import { HEADCOUNT_BAND_LABEL, PARTNER_CATEGORY_LABEL, PRODUCT_LABEL } from "@/lib/domain";
import type { PartnerDetailDto } from "@/lib/dto";
import { formatAgreement, initialsOf } from "@/lib/people";
import { ROUTES } from "@/lib/routes";
import { RegionName } from "@/components/regions-context";
import { DealStatusBadge, PartnerStatusBadge, ProductMark } from "./badges";
import { PartnerPeople } from "./partner-people";

interface PartnerDetailProps {
  partner: PartnerDetailDto;
  today: string;
  /** Partner managers change things; staff sales only read. */
  canManage: boolean;
  onChangeManager: () => void;
  onChangeCategory: () => void;
  onEditIdentity: () => void;
  onEditProfile: () => void;
  onEditDetails: () => void;
  onResendInvites: () => void;
  onSuspend: () => void;
  onRestore: () => void;
  onClose: () => void;
}

const SMALL_BTN: React.CSSProperties = { height: 26, padding: "0 8px", fontSize: 12 };

export function PartnerDetail({
  partner: p,
  today,
  canManage,
  onChangeManager,
  onChangeCategory,
  onEditIdentity,
  onEditProfile,
  onEditDetails,
  onResendInvites,
  onSuspend,
  onRestore,
  onClose,
}: PartnerDetailProps): React.JSX.Element {
  const suspended = p.status === "suspended";

  return (
    <Drawer
      open
      onClose={onClose}
      title={p.name}
      subtitle={p.domain}
      lead={
        p.logoUrl ? (
          <span className="av av-logo" style={{ width: 36, height: 36, borderRadius: 9 }}>
            <img src={p.logoUrl} alt="" decoding="async" />
          </span>
        ) : (
          <span className="av av-1" style={{ width: 36, height: 36, borderRadius: 9, fontSize: 13 }}>
            {initialsOf(p.name)}
          </span>
        )
      }
    >
      <div style={{ display: "grid", gap: 12 }}>
      <section className="card clip">
        <div style={{ padding: 12 }}>
          <PartnerStatusBadge status={p.status} />
          {suspended && p.suspendReason ? (
            <p style={{ margin: "8px 0 0", fontSize: 12.5, lineHeight: 1.45 }}>
              <strong>Suspended:</strong> {p.suspendReason}
            </p>
          ) : null}
        </div>
        <hr className="hr" />
        <dl className="dl card-b" style={{ gridTemplateColumns: "110px minmax(0, 1fr)" }}>
          <dt>Category</dt>
          <dd>{PARTNER_CATEGORY_LABEL[p.category]}</dd>
          <dt>Region</dt>
          <dd><RegionName k={p.region} /></dd>
          <dt>Partner since</dt>
          <dd>{fmtLong(p.since)}</dd>
          <dt>Agreement</dt>
          <dd>{formatAgreement(p.agreementVersion, p.agreementAcceptedAt)}</dd>
          <dt>Partner manager</dt>
          <dd style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {p.managerName ?? "Not assigned"}
            {canManage ? (
              <button type="button" className="btn btn-t" onClick={onChangeManager} style={{ height: 22, padding: "0 6px" }}>
                Change
              </button>
            ) : null}
          </dd>
          <dt>Partner admin</dt>
          <dd>{p.adminName ?? "Not invited yet"}</dd>
          <dt>HubSpot company</dt>
          <dd className="tnum">{p.hubspotCompanyId ?? "Not created yet"}</dd>
          {p.website ? (
            <>
              <dt>Website</dt>
              <dd>{p.website}</dd>
            </>
          ) : null}
          {p.phone ? (
            <>
              <dt>Phone</dt>
              <dd className="tnum">{p.phone}</dd>
            </>
          ) : null}
          {p.address ? (
            <>
              <dt>Address</dt>
              <dd>{p.address}</dd>
            </>
          ) : null}
          {p.about ? (
            <>
              <dt>About</dt>
              <dd>{p.about}</dd>
            </>
          ) : null}
          {(
            [
              ["Legal name", p.legalName],
              ["Tax ID", p.taxId],
              ["HQ country", countryName(p.hqCountry)],
              ["Company size", p.headcountBand ? HEADCOUNT_BAND_LABEL[p.headcountBand] : null],
              ["Billing contact", [p.billingContactName, p.billingContactEmail].filter(Boolean).join(", ") || null],
              ["Support contact", [p.supportContactName, p.supportContactEmail].filter(Boolean).join(", ") || null],
            ] as const
          ).map(([label, value]) =>
            value ? (
              <div key={label} style={{ display: "contents" }}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ) : null,
          )}
        </dl>
        <div className="kpis" style={{ borderTop: "1px solid #F0EFF4", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          {(
            [
              ["Users", p.users],
              ["Pending", p.pending],
              ["Protected", p.protectedCount],
              ["Won", p.won],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="kpi" style={{ padding: "8px 10px" }}>
              <span className="kpi-l">{label}</span>
              <span className="kpi-v" style={{ fontSize: 16 }}>
                {value}
              </span>
            </div>
          ))}
        </div>
        {canManage ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              padding: "10px 12px",
              borderTop: "1px solid #F0EFF4",
              background: "#FCFCFD",
            }}
          >
            <button type="button" className="btn btn-s" style={SMALL_BTN} onClick={onEditIdentity}>
              Edit name, domain, region
            </button>
            <button type="button" className="btn btn-s" style={SMALL_BTN} onClick={onEditProfile}>
              Edit profile
            </button>
            <button type="button" className="btn btn-s" style={SMALL_BTN} onClick={onEditDetails}>
              Edit details and logo
            </button>
            <button type="button" className="btn btn-s" style={SMALL_BTN} onClick={onChangeCategory}>
              Change category
            </button>
            <button type="button" className="btn btn-s" style={SMALL_BTN} onClick={onResendInvites}>
              Resend invites
            </button>
            {!suspended ? (
              <button type="button" className="btn btn-d" style={{ ...SMALL_BTN, marginLeft: "auto" }} onClick={onSuspend}>
                Suspend
              </button>
            ) : null}
            {suspended ? (
              <button type="button" className="btn btn-s" style={{ ...SMALL_BTN, marginLeft: "auto" }} onClick={onRestore}>
                Restore access
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <PartnerPeople partner={p} today={today} canManage={canManage} />

      <section aria-labelledby="sel-deals" className="card clip">
        <div className="card-h">
          <h2 id="sel-deals" className="card-t">
            Recent deals
          </h2>
          <Link href={ROUTES.admin.approvals} className="link-sm">
            Queue
          </Link>
        </div>
        {p.recentDeals.map((d) => (
          <div key={d.registrationId} className="li">
            <ProductMark product={d.product} />
            <span className="li-t">
              <span className="li-n">{d.customer}</span>
              <span className="li-s">
                {PRODUCT_LABEL[d.product]}, {fmtShort(d.registeredOn)}
              </span>
            </span>
            <DealStatusBadge status={d.status} />
          </div>
        ))}
        {p.recentDeals.length === 0 ? (
          <p style={{ margin: 0, padding: 12, fontSize: 12.5, color: "#6B687D" }}>No deals registered yet.</p>
        ) : null}
      </section>
      </div>
    </Drawer>
  );
}
