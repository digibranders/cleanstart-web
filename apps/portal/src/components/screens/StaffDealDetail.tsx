"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtTimestamp } from "@/lib/dates";
import { EVENT_SOURCE_LABEL, PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL, PRODUCT_LABEL } from "@/lib/domain";
import type { ManagerOptionDto, RegistrationCheckDto, RegistrationDetailDto } from "@/lib/dto";
import { ROUTES } from "@/lib/routes";
import { acceptRegistrationAction, rejectRegistrationAction } from "@/server/actions/decisions";
import { issuesToErrors } from "@/server/actions/result";
import { fmtLong } from "../deals/dates";
import { defaultRejectReason, describeCheck, initialsOf, reviewSince } from "../deals/derive";
import { ConfirmationButton, OptionalFields } from "../deals/OptionalFields";
import { ReassignControl } from "../deals/ReassignControl";
import { StatusBadge } from "../deals/parts";
import { Icon } from "../icon";
import { useToast } from "../ui/toast";

interface Props {
  deal: RegistrationDetailDto | null;
  check: RegistrationCheckDto;
  today: string;
  /** Partner managers only; the control shows on a waiting registration. */
  canReassign: boolean;
  managers: ManagerOptionDto[];
}

export function StaffDealDetail({ deal, check, today, canReassign, managers }: Props): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  if (!deal) {
    return (
      <div className="wrap">
        <div className="head">
          <h1 className="h1">Deal not found</h1>
        </div>
        <div className="card">
          <div className="empty">
            This deal does not exist or is outside your region.{" "}
            <Link href={ROUTES.admin.approvals} className="linkbtn">
              Back to Deals
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const checked = describeCheck(deal, check);
  const waiting = deal.status === "pending";

  const accept = async (): Promise<void> => {
    setBusy(true);
    const result = await acceptRegistrationAction({ id: deal.id });
    setBusy(false);
    toast(result.ok ? `${deal.customer} accepted. HubSpot deal queued.` : result.error.message);
    if (result.ok) router.refresh();
  };

  const reject = async (): Promise<void> => {
    if (!reason?.trim()) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await rejectRegistrationAction({ id: deal.id, reason });
    setBusy(false);
    if (!result.ok) {
      toast(issuesToErrors(result.error).reason ?? result.error.message);
      return;
    }
    setReason(null);
    toast(`${deal.customer} rejected. The partner has been emailed.`);
    router.refresh();
  };

  const reasonErr = tried && !reason?.trim();

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <Link href={ROUTES.admin.approvals} className="linkbtn">
            Deals
          </Link>
          <h1 className="h1">{deal.customer}</h1>
          <StatusBadge status={deal.status} />
        </div>
        {deal.status === "accepted" ? <ConfirmationButton id={deal.id} /> : null}
        {waiting && reason === null ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-d" disabled={busy} onClick={() => setReason(defaultRejectReason(deal, checked))}>
              Reject
            </button>
            <button type="button" className="btn btn-p" disabled={busy} onClick={accept}>
              <Icon name="checkIcon" />
              Accept
            </button>
          </div>
        ) : null}
      </div>

      {waiting && reason !== null ? (
        <section aria-label="Reject" className="card" style={{ padding: 14 }}>
          <div className="fg">
            <label htmlFor="sd-reason" className="lbl">
              Reason the partner will see <span className="t-muted">(required)</span>
            </label>
            <input
              id="sd-reason"
              className={`field${reasonErr ? " field-err" : ""}`}
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-invalid={reasonErr || undefined}
            />
            {reasonErr ? <span className="err">Add a reason the partner will see.</span> : null}
            <span style={{ display: "inline-flex", gap: 8 }}>
              <button type="button" className="btn btn-s" onClick={() => setReason(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-dd" disabled={busy} onClick={reject}>
                Reject and email
              </button>
            </span>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="sd-fields" className="card" style={{ padding: 14 }}>
        <h2 id="sd-fields" className="card-t">
          Registration
        </h2>
        <dl className="dl">
          <dt>Customer</dt>
          <dd>{deal.customer}</dd>
          <dt>Website</dt>
          <dd>{deal.website ?? "Not recorded"}</dd>
          <dt>Product</dt>
          <dd>{PRODUCT_LABEL[deal.product]}</dd>
          <dt>Region</dt>
          <dd>{PARTNER_REGION_LABEL[deal.region]}</dd>
          <dt>Partner</dt>
          <dd>
            {deal.partnerName}, {PARTNER_CATEGORY_LABEL[deal.partnerCategory]}
          </dd>
          <dt>Registered by</dt>
          <dd>{deal.registeredByName ?? "Not recorded"}</dd>
          <dt>Partner manager</dt>
          <dd>{deal.managerName ?? "Not assigned"}</dd>
          <dt>Registered</dt>
          <dd>{fmtLong(deal.registeredOn)}</dd>
          {deal.resubmittedOn ? (
            <>
              <dt>Resubmitted</dt>
              <dd>{fmtLong(deal.resubmittedOn)}</dd>
            </>
          ) : null}
          <dt>Waiting since</dt>
          <dd>{fmtLong(reviewSince(deal))}</dd>
          <dt>Expected close</dt>
          <dd>{deal.expectedClose ? fmtLong(deal.expectedClose) : "Not recorded"}</dd>
          <OptionalFields deal={deal} />
          <dt>Stage</dt>
          <dd>{deal.stage ?? "Not recorded"}</dd>
          <dt>Protection ends</dt>
          <dd>{deal.protectionEnd ? fmtLong(deal.protectionEnd) : "Not started"}</dd>
          {deal.closedOn ? (
            <>
              <dt>Closed</dt>
              <dd>{fmtLong(deal.closedOn)}</dd>
            </>
          ) : null}
          {deal.decidedOn ? (
            <>
              <dt>Decided</dt>
              <dd>
                {fmtLong(deal.decidedOn)}
                {deal.decidedByLabel ? `, ${deal.decidedByLabel}` : ""}
              </dd>
            </>
          ) : null}
          {deal.rejectionReason ? (
            <>
              <dt>Rejection reason</dt>
              <dd>{deal.rejectionReason}</dd>
            </>
          ) : null}
          <dt>HubSpot</dt>
          <dd>{deal.crmRef ?? (waiting || deal.status === "rejected" ? "Not created" : "Not recorded")}</dd>
          {deal.extensionStatus ? (
            <>
              <dt>Extension</dt>
              <dd>
                {deal.extensionStatus}
                {deal.extensionReason ? `: ${deal.extensionReason}` : ""}
              </dd>
            </>
          ) : null}
        </dl>
        {canReassign && waiting ? <ReassignControl deal={deal} managers={managers} /> : null}
        {deal.notes ? (
          <div className="fg">
            <span className="lbl">Partner notes</span>
            <span style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{deal.notes}</span>
          </div>
        ) : null}
        <div className="fg">
          <span className="lbl">Checks</span>
          <span>
            <span className={`badge b-${checked.tone}`}>{checked.label}</span>
          </span>
          {checked.why ? <span className={checked.whyCls}>{checked.why}</span> : null}
          {check.other ? (
            <Link href={`${ROUTES.admin.approvals}/${check.other.id}`} className="linkbtn">
              Open the other registration
            </Link>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="sd-contacts" className="card" style={{ padding: 14 }}>
        <h2 id="sd-contacts" className="card-t">
          {deal.contacts.length > 1 ? "Contacts" : "Contact"}
        </h2>
        {deal.contacts.length === 0 ? (
          <span className="hint">Not recorded.</span>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {deal.contacts.map((c) => (
              <li key={c.id}>
                {c.name}
                {c.role ? `, ${c.role}` : ""}
                {c.email ? (
                  <>
                    {", "}
                    <a href={`mailto:${c.email}`} className="linkbtn">
                      {c.email}
                    </a>
                  </>
                ) : null}
                {c.phone ? `, ${c.phone}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="sd-activity" className="card" style={{ padding: 14 }}>
        <h2 id="sd-activity" className="card-t">
          Activity
        </h2>
        {deal.history.length === 0 ? (
          <span className="hint">No activity yet.</span>
        ) : (
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {deal.history.map((e) => (
              <li key={e.id} style={{ fontSize: 13 }}>
                <span>{e.text}</span>{" "}
                <span className="t-muted">
                  {e.byLabel}, {EVENT_SOURCE_LABEL[e.source]}, {fmtTimestamp(e.at, today)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="sd-thread" className="card" style={{ padding: 14 }}>
        <h2 id="sd-thread" className="card-t">
          Conversation with the partner
        </h2>
        {deal.thread.length === 0 ? (
          <span className="hint">No messages yet.</span>
        ) : (
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {deal.thread.map((m) => (
              <li key={m.id} style={{ display: "grid", gridTemplateColumns: "26px minmax(0, 1fr)", gap: 10 }}>
                <span className={`av av-r ${m.side === "partner" ? "av-2" : "av-me"}`}>{initialsOf(m.authorName)}</span>
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 12.5 }}>
                    <b style={{ fontWeight: 600 }}>{m.authorName}</b>{" "}
                    <span className="t-muted">
                      {m.authorOrg}, {fmtTimestamp(m.createdAt, today)}
                    </span>
                  </span>
                  <span style={{ fontSize: 13, lineHeight: 1.55 }}>{m.body}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
