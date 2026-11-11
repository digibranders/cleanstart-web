"use client";

import { Fragment, useState } from "react";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import type { Application } from "@/data/partners";
import { CategoryBadge } from "./badges";

const DEFAULT_REASON = "We already have a partner covering this region and segment.";

interface ApplicationsTableProps {
  applications: readonly Application[];
  waiting: number;
  onApprove: (application: Application) => void;
  onDecline: (application: Application, reason: string) => void;
  onUndo: (application: Application) => void;
}

/** Icon row action, same markup as ActButton but able to carry a tour anchor. */
function RowAction({
  label,
  tip,
  tone,
  icon,
  onClick,
  tour,
}: {
  label: string;
  tip: string;
  tone: "ok" | "no";
  icon: "check" | "x";
  onClick: () => void;
  tour?: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className={`act act-${tone}`}
      aria-label={label}
      data-tip={tip}
      data-tour={tour}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
}

export function ApplicationsTable({
  applications,
  waiting,
  onApprove,
  onDecline,
  onUndo,
}: ApplicationsTableProps): React.JSX.Element {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [reasonTried, setReasonTried] = useState(false);
  const firstOpenId = applications.find((a) => a.status === "New")?.id;

  const startReject = (id: string): void => {
    setRejectingId(id);
    setReason(DEFAULT_REASON);
    setReasonTried(false);
  };

  const confirmReject = (application: Application): void => {
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
        <span className="card-meta">
          From the Become a Partner form on cleanstart.com/partners and from /apply. New submissions first.
        </span>
        <span className="card-meta tnum">{waiting} waiting</span>
      </div>
      <div style={{ overflowX: "auto" }} data-tour="applications-list">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Company</th>
              <th scope="col">Applicant</th>
              <th scope="col">Wants to be</th>
              <th scope="col">Region</th>
              <th scope="col">Submitted</th>
              <th scope="col" className="r">
                Decision
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => {
              const rejecting = rejectingId === a.id && a.status === "New";
              return (
                <Fragment key={a.id}>
                  <tr>
                    <td>
                      <span className="li-t">
                        <span style={{ fontWeight: 600 }}>{a.company}</span>
                        <span className="li-s">{a.domain}</span>
                      </span>
                    </td>
                    <td>
                      <span className="li-t">
                        <span>{a.applicant}</span>
                        <span className="li-s">{a.role}</span>
                      </span>
                    </td>
                    <td>
                      <CategoryBadge category={a.category} />
                    </td>
                    <td className="t-sec">{a.region}</td>
                    <td className="tnum t-sec">{a.submitted}</td>
                    <td className="r">
                      {a.status === "New" && !rejecting ? (
                        <span className="acts">
                          <RowAction
                            label={`Reject ${a.company}`}
                            tip="Reject with a reason"
                            tone="no"
                            icon="x"
                            onClick={() => startReject(a.id)}
                          />
                          <RowAction
                            label={`Approve ${a.company}`}
                            tip="Approve and send the invite"
                            tone="ok"
                            icon="check"
                            onClick={() => onApprove(a)}
                            {...(a.id === firstOpenId ? { tour: "application-approve" } : {})}
                          />
                        </span>
                      ) : null}
                      {a.status === "New" && rejecting ? <Badge tone="neutral">Add a reason below</Badge> : null}
                      {a.status !== "New" ? (
                        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          {a.status === "Approved" ? (
                            <Badge tone="accepted">Approved, invite sent</Badge>
                          ) : (
                            <Badge tone="rejected">Rejected, emailed</Badge>
                          )}
                          <button
                            type="button"
                            className="btn btn-g"
                            onClick={() => onUndo(a)}
                            style={{ height: 24, padding: "0 6px", fontSize: 12 }}
                          >
                            Undo
                          </button>
                        </span>
                      ) : null}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6} style={{ paddingTop: 0, whiteSpace: "normal" }}>
                      <div className="note note-violet">
                        <span>
                          <b>Why they want to partner:</b> {a.reason}
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
                            Reject and email
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
        {applications.length === 0 ? <div className="empty">No applications yet.</div> : null}
      </div>
      <div style={{ padding: "10px 12px", borderTop: "1px solid #F0EFF4" }}>
        <span className="hint">
          Approving creates the partner company, makes the applicant its partner admin, and emails them an invite to
          set a password and accept the partner agreement.
        </span>
      </div>
    </>
  );
}
