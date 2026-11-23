"use client";

import { Fragment, useEffect, useState } from "react";
import { Dropdown } from "@/components/ui/dropdown";
import { Badge } from "@/components/ui/badge";
import { fmtLong } from "@/lib/dates";
import {
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABEL,
  PARTNER_REGION_LABEL,
  PARTNER_REGIONS,
  type PartnerCategory,
  type PartnerRegion,
} from "@/lib/domain";
import type { ApplicationDto } from "@/lib/dto";
import { codeFromLabel } from "@/lib/people";
import { ApplicationDrawer } from "./application-drawer";
import { PartnerCategoryBadge } from "./badges";
import { Seg } from "./seg";
import { ScrollRegion } from "@/components/ui/scroll-region";

const CATEGORY_OPTIONS: readonly string[] = PARTNER_CATEGORIES.map((c) => PARTNER_CATEGORY_LABEL[c]);
const REGION_OPTIONS: readonly string[] = PARTNER_REGIONS.map((r) => PARTNER_REGION_LABEL[r]);

const STATUS_OPTIONS = [
  { value: "all", label: "Any status" },
  { value: "new", label: "Waiting" },
  { value: "info_requested", label: "Info requested" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Rejected" },
];

interface ApplicationsTableProps {
  applications: readonly ApplicationDto[];
  waiting: number;
  /** Current filters, read from the URL by the page so the server does the matching. */
  status: string;
  query: string;
  onFilter: (next: { astatus?: string; aq?: string }) => void;
  /** Only partner managers decide; other staff see the queue read-only. */
  canDecide: boolean;
  onApprove: (application: ApplicationDto, choice: { category: PartnerCategory; region: PartnerRegion }) => void;
  onDecline: (application: ApplicationDto, reason: string) => void;
  onUndo: (application: ApplicationDto) => void;
}

export function ApplicationsTable({
  applications,
  waiting,
  status,
  query,
  onFilter,
  canDecide,
  onApprove,
  onDecline,
  onUndo,
}: ApplicationsTableProps): React.JSX.Element {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reasonTried, setReasonTried] = useState(false);
  const [categoryLabel, setCategoryLabel] = useState<string>(PARTNER_CATEGORY_LABEL.channel);
  const [regionLabel, setRegionLabel] = useState<string>(PARTNER_REGION_LABEL.india);

  const [text, setText] = useState(query);
  // Wait for a pause in typing before asking the server to filter.
  useEffect(() => {
    if (text.trim() === query.trim()) return;
    const timer = setTimeout(() => onFilter({ aq: text.trim() }), 300);
    return () => clearTimeout(timer);
  }, [text, query, onFilter]);

  const startReject = (id: string): void => {
    setApprovingId(null);
    setRejectingId(id);
    setReason("");
    setReasonTried(false);
  };

  const startApprove = (application: ApplicationDto): void => {
    // A portal application already carries a category and region; a website entry needs the manager to set them.
    if (application.category && application.region) {
      onApprove(application, { category: application.category, region: application.region });
      return;
    }
    setRejectingId(null);
    setApprovingId(application.id);
    setCategoryLabel(application.category ? PARTNER_CATEGORY_LABEL[application.category] : PARTNER_CATEGORY_LABEL.channel);
    setRegionLabel(application.region ? PARTNER_REGION_LABEL[application.region] : PARTNER_REGION_LABEL.india);
  };

  const confirmApprove = (application: ApplicationDto): void => {
    const category = codeFromLabel(PARTNER_CATEGORY_LABEL, categoryLabel);
    const region = codeFromLabel(PARTNER_REGION_LABEL, regionLabel);
    if (!category || !region) return;
    setApprovingId(null);
    onApprove(application, { category, region });
  };

  const confirmReject = (application: ApplicationDto): void => {
    if (!reason.trim()) {
      setReasonTried(true);
      return;
    }
    setRejectingId(null);
    onDecline(application, reason);
  };

  return (
    <>
      <div className="toolbar">
        <div className="filters">
          <label className="sr" htmlFor="application-q">
            Search applications
          </label>
          <input
            id="application-q"
            className="finput"
            type="search"
            placeholder="Company, domain or applicant"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Dropdown
            ariaLabel="Application status"
            value={status || "all"}
            options={STATUS_OPTIONS}
            onChange={(v) => onFilter({ astatus: v === "all" ? "" : v })}
          />
        </div>
        <span className="card-meta tnum">{waiting} waiting</span>
      </div>
      <ScrollRegion label="Applications">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Company</th>
              <th scope="col" className="hide-sm">
                Applicant
              </th>
              <th scope="col" className="hide-sm">
                Wants to be
              </th>
              <th scope="col" className="hide-sm">
                Region
              </th>
              <th scope="col" className="hide-sm">
                Submitted
              </th>
              <th scope="col" className="r">
                Decision
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => {
              const isOpen = a.status === "new" || a.status === "info_requested";
              const rejecting = rejectingId === a.id && isOpen;
              const approving = approvingId === a.id && isOpen;
              return (
                <Fragment key={a.id}>
                  <tr>
                    <td>
                      <span className="li-t">
                        <button type="button" className="linkbtn" style={{ fontWeight: 600, textAlign: "left", padding: 0 }} onClick={() => setDetailId(a.id)} aria-label={`Open the application from ${a.company}`}>
                          {a.company}
                        </button>
                        <span className="li-s">{a.domain}</span>
                        <span className="li-s tnum">{a.reference}</span>
                        <span style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                          <Badge tone="neutral">{a.source === "website" ? "Website form" : "Portal form"}</Badge>
                          {a.personalEmail ? <Badge tone="pending">Personal email</Badge> : null}
                          {a.existingDomain ? <Badge tone="violet">Domain already a partner</Badge> : null}
                          {a.status === "info_requested" ? <Badge tone="pending">Info requested</Badge> : null}
                        </span>
                      </span>
                    </td>
                    <td className="hide-sm">
                      <span className="li-t">
                        <span>{a.applicantName}</span>
                        {a.role ? <span className="li-s">{a.role}</span> : null}
                        <span className="li-s">{a.email}</span>
                        {a.phone ? <span className="li-s tnum">{a.phone}</span> : null}
                      </span>
                    </td>
                    <td className="hide-sm">
                      {a.category ? <PartnerCategoryBadge category={a.category} /> : <span className="t-muted">Not set</span>}
                    </td>
                    <td className="t-sec hide-sm">
                      {a.region ? PARTNER_REGION_LABEL[a.region] : <span className="t-muted">Not set</span>}
                    </td>
                    <td className="tnum t-sec hide-sm">{fmtLong(a.submittedAt)}</td>
                    <td className="r" style={{ whiteSpace: "normal" }}>
                      {isOpen && !rejecting && !approving && canDecide ? (
                        <span className="acts" style={{ gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn btn-d"
                            aria-label={`Decline ${a.company}`}
                            title="Decline with a reason"
                            onClick={() => startReject(a.id)}
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            className="btn btn-p"
                            aria-label={`Approve and invite ${a.company}`}
                            title="Creates the partner company, makes the applicant its partner admin and emails an invite"
                            onClick={() => startApprove(a)}
                          >
                            Approve and invite
                          </button>
                        </span>
                      ) : null}
                      {isOpen && rejecting ? <Badge tone="neutral">Add a reason below</Badge> : null}
                      {isOpen && approving ? <Badge tone="neutral">Choose below</Badge> : null}
                      {!isOpen ? (
                        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          {a.status === "approved" ? (
                            <Badge tone="accepted">Approved, invite sent</Badge>
                          ) : (
                            <Badge tone="rejected">Rejected, emailed</Badge>
                          )}
                          {canDecide ? (
                            <button
                              type="button"
                              className="btn btn-g"
                              onClick={() => onUndo(a)}
                              style={{ height: 24, padding: "0 6px", fontSize: 12 }}
                            >
                              Undo
                            </button>
                          ) : null}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6} style={{ paddingTop: 0, whiteSpace: "normal" }}>
                      <div className="note note-violet">
                        <span>
                          <b>Why they want to partner:</b> {a.reason ?? "Not given."}
                          {a.declineReason ? (
                            <>
                              <br />
                              <b>Reason sent:</b> {a.declineReason}
                            </>
                          ) : null}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {approving ? (
                    <tr>
                      <td colSpan={6} style={{ paddingTop: 0, whiteSpace: "normal" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "flex-end",
                            flexWrap: "wrap",
                            padding: "8px 10px",
                            borderRadius: 7,
                            background: "#FCFCFD",
                            border: "1px solid #F0EFF4",
                          }}
                        >
                          <div className="fg">
                            <span id={`aa-cat-${a.id}`} className="lbl">
                              Partner type
                            </span>
                            <Seg options={CATEGORY_OPTIONS} value={categoryLabel} onChange={setCategoryLabel} labelledBy={`aa-cat-${a.id}`} />
                          </div>
                          <div className="fg">
                            <span id={`aa-reg-${a.id}`} className="lbl">
                              Region
                            </span>
                            <Seg options={REGION_OPTIONS} value={regionLabel} onChange={setRegionLabel} labelledBy={`aa-reg-${a.id}`} />
                          </div>
                          <button type="button" className="btn btn-s" onClick={() => setApprovingId(null)}>
                            Cancel
                          </button>
                          <button type="button" className="btn btn-p" onClick={() => confirmApprove(a)}>
                            Approve and send invite
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  {rejecting ? (
                    <tr>
                      <td colSpan={6} style={{ paddingTop: 0, whiteSpace: "normal" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "flex-end",
                            flexWrap: "wrap",
                            padding: "8px 10px",
                            borderRadius: 7,
                            background: "#FCFCFD",
                            border: "1px solid #F0EFF4",
                          }}
                        >
                          <div className="fg" style={{ flex: "1 1 360px" }}>
                            <label htmlFor={`ar-${a.id}`} className="lbl">
                              Reason the applicant will see
                            </label>
                            <input
                              id={`ar-${a.id}`}
                              className={`field${reasonTried && !reason.trim() ? " field-err" : ""}`}
                              type="text"
                              placeholder="For example, we already have a partner covering this region"
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              aria-invalid={reasonTried && !reason.trim() ? true : undefined}
                              aria-describedby={`ar-${a.id}-err`}
                            />
                            {reasonTried && !reason.trim() ? (
                              <span className="err" id={`ar-${a.id}-err`}>
                                Add a reason the applicant will see.
                              </span>
                            ) : null}
                          </div>
                          <button type="button" className="btn btn-s" onClick={() => setRejectingId(null)}>
                            Cancel
                          </button>
                          <button type="button" className="btn btn-dd" onClick={() => confirmReject(a)}>
                            Decline and email
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {applications.length === 0 ? <div className="empty">{status || query ? "No applications match these filters." : "No applications yet."}</div> : null}
      </ScrollRegion>
      <ApplicationDrawer application={applications.find((x) => x.id === detailId) ?? null} onClose={() => setDetailId(null)} canDecide={canDecide} />
      <div style={{ padding: "10px 12px", borderTop: "1px solid #F0EFF4" }}>
        <span className="hint">
          Approving creates the partner company, makes the applicant its partner admin, and emails them an invite to
          set a password and accept the partner agreement.
        </span>
      </div>
    </>
  );
}
