"use client";

import { useEffect, useMemo, useState } from "react";
import { fmtTimestamp } from "@/lib/dates";
import { PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL, PRODUCT_LABEL, type StaffRegion } from "@/lib/domain";
import type { ApprovalQueueDto, ManagerOptionDto, RegistrationDetailDto } from "@/lib/dto";
import {
  acceptRegistrationAction,
  hubspotConflictHintsAction,
  rejectRegistrationAction,
  undoDecisionAction,
} from "@/server/actions/decisions";
import { EXTENSION_DAYS } from "@/lib/deal-rules";
import { decideExtensionAction } from "@/server/actions/extension";
import { postMessageAction } from "@/server/actions/registrations";
import { issuesToErrors } from "@/server/actions/result";
import { downloadCsv } from "../deals/csv";
import { fmtLong, fmtShort, plural } from "../deals/dates";
import {
  avOf,
  CHIP_PRODUCT,
  type Check,
  defaultRejectReason,
  describeCheck,
  initialsOf,
  reviewSince,
  routingText,
} from "../deals/derive";
import type { HubspotHintDto } from "../deals/types";
import { Icon } from "../icon";
import { ProductChip } from "../ui/badge";
import { Dropdown } from "../ui/dropdown";
import { Drawer } from "../ui/overlay";
import { useToast } from "../ui/toast";

const ALL_PRODUCTS = "All products";
const ALL_REGIONS = "All regions";
const PRODUCT_OPTIONS = [ALL_PRODUCTS, "CleanStart Images", "Clean Libraries", "CleanSight"];
const REGION_OPTIONS = [ALL_REGIONS, "India", "Middle East"];
const SMALL_BTN = { height: 24, padding: "0 6px", fontSize: 12 } as const;
const HINT_LIMIT = 50;

type RowState = "open" | "rejecting" | "approved" | "rejected";

interface QueueRow {
  deal: RegistrationDetailDto;
  check: Check;
  state: RowState;
  age: number;
  over: boolean;
}

interface Rejecting {
  reason: string;
  tried: boolean;
}

function ageLabel(days: number): string {
  return days === 0 ? "Today" : plural(days, "day");
}

interface AdminApprovalsProps {
  queue: ApprovalQueueDto;
  extensions: RegistrationDetailDto[];
  viewerId: string;
  viewerRegion: StaffRegion;
  managers: ManagerOptionDto[];
  today: string;
}

export function AdminApprovals({ queue, extensions, viewerId, viewerRegion, managers, today }: AdminApprovalsProps): React.JSX.Element {
  const toast = useToast();

  const [view, setView] = useState<"mine" | "all">("mine");
  const [q, setQ] = useState("");
  const [product, setProduct] = useState(ALL_PRODUCTS);
  const [region, setRegion] = useState(ALL_REGIONS);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Record<string, Rejecting>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hints, setHints] = useState<Record<string, HubspotHintDto>>({});
  const [reply, setReply] = useState("");
  const [replyTried, setReplyTried] = useState(false);
  const [replying, setReplying] = useState(false);

  const waitingIds = queue.rows
    .filter((r) => r.registration.status === "pending")
    .map((r) => r.registration.id)
    .join(",");

  useEffect(() => {
    if (!waitingIds) return;
    let cancelled = false;
    hubspotConflictHintsAction({ ids: waitingIds.split(",").slice(0, HINT_LIMIT) })
      .then((result) => {
        if (!cancelled && result.ok) setHints(result.data);
      })
      .catch(() => {
        if (!cancelled) setHints({});
      });
    return () => {
      cancelled = true;
    };
  }, [waitingIds]);

  const rows = useMemo<QueueRow[]>(
    () =>
      queue.rows.map((entry) => {
        const deal = entry.registration;
        const state: RowState =
          deal.status === "accepted" ? "approved" : deal.status === "rejected" ? "rejected" : deal.id in rejecting ? "rejecting" : "open";
        return { deal, check: describeCheck(deal, entry.check, hints[deal.id]), state, age: entry.waitingBusinessDays, over: entry.overSla };
      }),
    [queue.rows, rejecting, hints],
  );

  const inMyQueue = (deal: RegistrationDetailDto): boolean =>
    viewerRegion === "all" ? deal.managerId === viewerId : deal.region === viewerRegion;

  const needle = q.trim().toLowerCase();
  const visible = rows.filter(
    ({ deal }) =>
      (view === "all" || inMyQueue(deal)) &&
      (!needle || `${deal.partnerName} ${deal.customer}`.toLowerCase().includes(needle)) &&
      (product === ALL_PRODUCTS || PRODUCT_LABEL[deal.product] === product) &&
      (region === ALL_REGIONS || PARTNER_REGION_LABEL[deal.region] === region),
  );

  const waiting = rows.filter((r) => r.state === "open" || r.state === "rejecting");
  const overCount = waiting.filter((r) => r.over).length;
  const conflictCount = waiting.filter((r) => r.check.kind === "conflict").length;
  const viewing = rows.find((r) => r.deal.id === viewingId);
  const recentDecisions = queue.recentDecisions;
  const visibleExtensions = extensions.filter((d) => view === "all" || inMyQueue(d));

  const decideExt = async (deal: RegistrationDetailDto, decision: "grant" | "decline"): Promise<void> => {
    setBusyId(deal.id);
    try {
      const result = await decideExtensionAction({ id: deal.id, decision, note: null });
      toast(
        result.ok
          ? decision === "grant"
            ? `Extension granted for ${deal.customer}.`
            : `Extension declined for ${deal.customer}.`
          : result.error.message,
      );
    } finally {
      setBusyId(null);
    }
  };

  const accept = async (row: QueueRow): Promise<void> => {
    setBusyId(row.deal.id);
    const result = await acceptRegistrationAction({ id: row.deal.id });
    setBusyId(null);
    toast(result.ok ? `${row.deal.customer} accepted. HubSpot deal queued.` : result.error.message);
  };

  const startReject = (row: QueueRow): void =>
    setRejecting((prev) => ({ ...prev, [row.deal.id]: { reason: defaultRejectReason(row.deal, row.check), tried: false } }));

  const cancelReject = (id: string): void =>
    setRejecting((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });

  const confirmReject = async (row: QueueRow): Promise<void> => {
    const entry = rejecting[row.deal.id];
    if (!entry) return;
    if (!entry.reason.trim()) {
      setRejecting((prev) => ({ ...prev, [row.deal.id]: { ...entry, tried: true } }));
      return;
    }
    setBusyId(row.deal.id);
    const result = await rejectRegistrationAction({ id: row.deal.id, reason: entry.reason });
    setBusyId(null);
    if (!result.ok) {
      toast(issuesToErrors(result.error).reason ?? result.error.message);
      return;
    }
    cancelReject(row.deal.id);
    toast(`${row.deal.customer} rejected. The partner has been emailed.`);
  };

  const undo = async (row: QueueRow): Promise<void> => {
    if (row.state === "rejecting") {
      cancelReject(row.deal.id);
      return;
    }
    setBusyId(row.deal.id);
    const result = await undoDecisionAction({ id: row.deal.id });
    setBusyId(null);
    if (!result.ok) toast(result.error.message);
  };

  const sendReply = async (event: React.FormEvent, deal: RegistrationDetailDto): Promise<void> => {
    event.preventDefault();
    if (!reply.trim()) {
      setReplyTried(true);
      return;
    }
    setReplying(true);
    const result = await postMessageAction({ registrationId: deal.id, body: reply });
    setReplying(false);
    if (!result.ok) {
      toast(result.error.message);
      return;
    }
    setReply("");
    setReplyTried(false);
  };

  const exportCsv = (): void => {
    downloadCsv("deal-approvals.csv", [
      ["Partner", "Customer", "Product", "Region", "Submitted", "Waiting", "Checks", "Decision"],
      ...visible.map((r) => [
        r.deal.partnerName,
        r.deal.customer,
        PRODUCT_LABEL[r.deal.product],
        PARTNER_REGION_LABEL[r.deal.region],
        fmtLong(reviewSince(r.deal)),
        ageLabel(r.age),
        r.check.label,
        r.state === "approved" ? "Accepted" : r.state === "rejected" ? "Rejected" : "Waiting",
      ]),
    ]);
    toast(`Exported ${visible.length} registrations to CSV`);
  };

  const queues: { key: "mine" | "all"; label: string; count: number }[] = [
    { key: "mine", label: "My queue", count: waiting.filter((r) => inMyQueue(r.deal)).length },
    { key: "all", label: "All regions", count: waiting.length },
  ];

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Deal approvals</h1>
          <span className="h1-sub">
            Accepting creates the deal in HubSpot, starts 90 days of protection and emails the partner.
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="btn btn-s" onClick={exportCsv}>
            <Icon name="dl" />
            Export
          </button>
        </div>
      </div>

      <section aria-label="Queue summary" className="card kpis">
        <div className="kpi">
          <span className="kpi-l">Waiting</span>
          <span className="kpi-v">{waiting.length}</span>
          <span className={`kpi-f${overCount ? " t-amber" : ""}`}>
            {overCount ? `${overCount} over the 2-day target` : "All within 2 days"}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-l">With a conflict</span>
          <span className="kpi-v t-amber">{conflictCount}</span>
          <span className="kpi-f">Same customer and product</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Decided, last 7 days</span>
          <span className="kpi-v">{queue.counts.acceptedLast7Days + queue.counts.rejectedLast7Days}</span>
          <span className="kpi-f">
            Accepted {queue.counts.acceptedLast7Days}, rejected {queue.counts.rejectedLast7Days}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Expiring in 14 days</span>
          <span className="kpi-v t-amber">{queue.counts.expiringIn14Days}</span>
          <span className="kpi-f">Partners reminded</span>
        </div>
      </section>

      <section aria-label="Queue" className="card clip">
        <div className="toolbar">
          <div className="filters">
            <div className="seg" role="group" aria-label="Whose queue" style={{ marginRight: 4 }}>
              {queues.map((qv) => (
                <button
                  type="button"
                  key={qv.key}
                  className={`seg-b${view === qv.key ? " seg-on" : ""}`}
                  aria-pressed={view === qv.key}
                  onClick={() => setView(qv.key)}
                  style={{ height: 24, padding: "0 10px" }}
                >
                  {qv.label} <span className="cnt">{qv.count}</span>
                </button>
              ))}
            </div>
            <label className="sr" htmlFor="aq">
              Filter
            </label>
            <input
              id="aq"
              className="finput"
              type="search"
              placeholder="Filter by partner or customer"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Dropdown id="ap" ariaLabel="Product" value={product} options={PRODUCT_OPTIONS} onChange={setProduct} />
            <Dropdown id="ar" ariaLabel="Region" value={region} options={REGION_OPTIONS} onChange={setRegion} />
          </div>
          <span className="card-meta tnum">
            {visible.length} shown, oldest first. {routingText(managers)}
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Partner</th>
                <th scope="col">Customer</th>
                <th scope="col">Product</th>
                <th scope="col">Region</th>
                <th scope="col">Waiting</th>
                <th scope="col">Checks</th>
                <th scope="col" className="r">
                  Decision
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.flatMap((row) => {
                const { deal, check, state } = row;
                const entry = rejecting[deal.id];
                const reasonErr = entry?.tried && !entry.reason.trim();
                const tr = (
                  <tr key={deal.id}>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className={`av ${avOf(deal.partnerName)}`}>{initialsOf(deal.partnerName)}</span>
                        <span className="li-n" style={{ fontSize: 13 }}>
                          {deal.partnerName}
                        </span>
                      </span>
                    </td>
                    <td>
                      <button type="button" className="linkbtn" onClick={() => setViewingId(deal.id)}>
                        {deal.customer}
                      </button>
                    </td>
                    <td>
                      <ProductChip product={CHIP_PRODUCT[deal.product]} />
                    </td>
                    <td className="t-sec">{PARTNER_REGION_LABEL[deal.region]}</td>
                    <td className={`tnum ${row.over ? "t-amber" : "t-sec"}`} title={`Submitted ${fmtLong(reviewSince(deal))}`}>
                      {ageLabel(row.age)}
                      {row.over ? <span className="why why-amber">Over 2-day target</span> : null}
                    </td>
                    <td style={{ whiteSpace: "normal" }}>
                      <span className={`badge b-${check.tone}`}>{check.label}</span>
                      {check.why && state !== "rejecting" ? <span className={check.whyCls}>{check.why}</span> : null}
                    </td>
                    <td className="r">
                      {state === "open" ? (
                        <span className="acts">
                          <button
                            type="button"
                            className="act act-no"
                            onClick={() => startReject(row)}
                            disabled={busyId === deal.id}
                            aria-label={`Reject ${deal.customer} from ${deal.partnerName}`}
                            data-tip="Reject with a reason"
                          >
                            <Icon name="x" />
                          </button>
                          <button
                            type="button"
                            className="act act-ok"
                            onClick={() => accept(row)}
                            disabled={busyId === deal.id}
                            aria-label={`Accept ${deal.customer} from ${deal.partnerName}`}
                            data-tip="Accept and create the HubSpot deal"
                          >
                            <Icon name="checkIcon" />
                          </button>
                        </span>
                      ) : null}
                      {state === "approved" ? (
                        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <span className="badge b-accepted">Accepted, syncing to HubSpot</span>
                          <button type="button" className="btn btn-g" onClick={() => undo(row)} disabled={busyId === deal.id} style={SMALL_BTN}>
                            Undo
                          </button>
                        </span>
                      ) : null}
                      {state === "rejected" ? (
                        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <span className="badge b-rejected">Rejected, emailed</span>
                          <button type="button" className="btn btn-g" onClick={() => undo(row)} disabled={busyId === deal.id} style={SMALL_BTN}>
                            Undo
                          </button>
                        </span>
                      ) : null}
                      {state === "rejecting" ? <span className="badge b-neutral">Add a reason below</span> : null}
                    </td>
                  </tr>
                );
                if (state !== "rejecting" || !entry) return [tr];
                return [
                  tr,
                  <tr key={`${deal.id}-reason`}>
                    <td colSpan={7} style={{ paddingTop: 0, whiteSpace: "normal" }}>
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
                          <label htmlFor={`reason-${deal.id}`} className="lbl">
                            Reason the partner will see
                          </label>
                          <input
                            id={`reason-${deal.id}`}
                            className={`field${reasonErr ? " field-err" : ""}`}
                            type="text"
                            value={entry.reason}
                            onChange={(e) =>
                              setRejecting((prev) => ({ ...prev, [deal.id]: { reason: e.target.value, tried: entry.tried } }))
                            }
                            aria-invalid={reasonErr || undefined}
                            aria-describedby={reasonErr ? `reason-${deal.id}-err` : undefined}
                          />
                          {reasonErr ? (
                            <span className="err" id={`reason-${deal.id}-err`}>
                              Add a reason the partner will see.
                            </span>
                          ) : null}
                        </div>
                        <button type="button" className="btn btn-s" onClick={() => undo(row)}>
                          Cancel
                        </button>
                        <button type="button" className="btn btn-dd" onClick={() => confirmReject(row)} disabled={busyId === deal.id}>
                          Reject and email
                        </button>
                      </div>
                    </td>
                  </tr>,
                ];
              })}
            </tbody>
          </table>
          {visible.length === 0 ? <div className="empty">No registrations match these filters.</div> : null}
        </div>
      </section>

      {visibleExtensions.length > 0 ? (
        <section aria-labelledby="extreq" className="card clip">
          <div className="card-h">
            <h2 id="extreq" className="card-t">
              Extension requests
            </h2>
            <span className="card-meta">{visibleExtensions.length}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Partner</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Product</th>
                  <th scope="col">Protected until</th>
                  <th scope="col">Reason</th>
                  <th scope="col" className="r">
                    Decision
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleExtensions.map((d) => (
                  <tr key={d.id}>
                    <td>{d.partnerName}</td>
                    <td style={{ fontWeight: 600 }}>{d.customer}</td>
                    <td>
                      <ProductChip product={CHIP_PRODUCT[d.product]} />
                    </td>
                    <td className="tnum t-sec">{d.protectionEnd ? fmtLong(d.protectionEnd) : ""}</td>
                    <td className="t-sec" style={{ whiteSpace: "normal", maxWidth: 360 }}>
                      {d.extensionReason}
                    </td>
                    <td className="r">
                      <span style={{ display: "inline-flex", gap: 6 }}>
                        <button type="button" className="btn btn-s" onClick={() => decideExt(d, "decline")} disabled={busyId === d.id} style={SMALL_BTN}>
                          Decline
                        </button>
                        <button type="button" className="btn btn-p" onClick={() => decideExt(d, "grant")} disabled={busyId === d.id} style={SMALL_BTN}>
                          Grant {EXTENSION_DAYS} days
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="recentdec" className="card clip">
        <div className="card-h">
          <h2 id="recentdec" className="card-t">
            Recent decisions
          </h2>
          <span className="card-meta">Last 7 days</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Decided</th>
              <th scope="col">Partner</th>
              <th scope="col">Customer</th>
              <th scope="col">Product</th>
              <th scope="col">Decision</th>
              <th scope="col">HubSpot</th>
            </tr>
          </thead>
          <tbody>
            {recentDecisions.map((d) => (
              <tr key={d.id}>
                <td className="tnum t-sec">{fmtShort(d.decidedOn ?? today)}</td>
                <td>{d.partnerName}</td>
                <td style={{ fontWeight: 600 }}>{d.customer}</td>
                <td>
                  <ProductChip product={CHIP_PRODUCT[d.product]} />
                </td>
                <td>
                  <span className={`badge ${d.status === "rejected" ? "b-rejected" : "b-accepted"}`}>
                    {d.status === "rejected" ? "Rejected" : "Accepted"}
                  </span>
                </td>
                <td className="tnum t-sec">{d.crmRef ?? (d.status === "rejected" ? "Not created" : "Queued")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {viewing ? (
        <Drawer
          open
          onClose={() => setViewingId(null)}
          title={viewing.deal.customer}
          subtitle={`Registered by ${viewing.deal.partnerName}, ${PARTNER_CATEGORY_LABEL[viewing.deal.partnerCategory]}`}
          footer={
            viewing.state === "open" ? (
              <>
                <button
                  type="button"
                  className="btn btn-d"
                  onClick={() => {
                    startReject(viewing);
                    setViewingId(null);
                  }}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="btn btn-p"
                  onClick={() => {
                    accept(viewing);
                    setViewingId(null);
                  }}
                >
                  <Icon name="checkIcon" />
                  Accept
                </button>
              </>
            ) : (
              <>
                <span className="hint">Decided. Undo it from the queue.</span>
                <button type="button" className="btn btn-s" onClick={() => setViewingId(null)}>
                  Close
                </button>
              </>
            )
          }
        >
          <dl className="dl">
            <dt>Customer</dt>
            <dd>{viewing.deal.customer}</dd>
            <dt>Contact</dt>
            <dd>{viewing.deal.contacts[0]?.name ?? "Not recorded"}</dd>
            <dt>Product</dt>
            <dd>{PRODUCT_LABEL[viewing.deal.product]}</dd>
            <dt>Region</dt>
            <dd>{PARTNER_REGION_LABEL[viewing.deal.region]}</dd>
            <dt>Account manager</dt>
            <dd>{viewing.deal.managerName ?? "Not assigned"}</dd>
            <dt>Partner</dt>
            <dd>{viewing.deal.partnerName}</dd>
            <dt>Submitted</dt>
            <dd>{fmtLong(reviewSince(viewing.deal))}</dd>
          </dl>
          <div className="fg">
            <span className="lbl">Checks</span>
            <span>
              <span className={`badge b-${viewing.check.tone}`}>{viewing.check.label}</span>
            </span>
            {viewing.check.why ? (
              <span className={viewing.check.whyCls} style={{ maxWidth: "none" }}>
                {viewing.check.why}
              </span>
            ) : null}
          </div>
          <div className="note note-violet">
            <span>Accepting creates the deal in HubSpot, starts 90 days of protection and emails the partner.</span>
          </div>
          <div className="fg">
            <span className="lbl">Conversation with the partner</span>
            {viewing.deal.thread.length > 0 ? (
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {viewing.deal.thread.map((m) => (
                  <li key={m.id} style={{ display: "grid", gridTemplateColumns: "26px minmax(0, 1fr)", gap: 10 }}>
                    <span className={`av av-r ${m.side === "partner" ? "av-2" : "av-me"}`}>{initialsOf(m.authorName)}</span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 12.5 }}>
                        <b style={{ fontWeight: 600 }}>{m.authorName}</b>{" "}
                        <span className="t-muted">
                          {m.authorOrg}, {fmtTimestamp(m.createdAt, today)}
                        </span>
                      </span>
                      <span style={{ fontSize: 13, lineHeight: 1.55, color: "#2A2838" }}>{m.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <span className="hint">No messages yet.</span>
            )}
          </div>
          <form onSubmit={(event) => sendReply(event, viewing.deal)} noValidate className="fg">
            <label htmlFor="appr-reply" className="lbl">
              Reply to {viewing.deal.partnerName}
            </label>
            <textarea
              id="appr-reply"
              className={`field${replyTried && !reply.trim() ? " field-err" : ""}`}
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              aria-invalid={replyTried && !reply.trim() ? true : undefined}
            />
            {replyTried && !reply.trim() ? <span className="err">Write a message first.</span> : null}
            <span>
              <button type="submit" className="btn btn-s" disabled={replying}>
                <Icon name="send" />
                Send
              </button>
            </span>
          </form>
        </Drawer>
      ) : null}
    </div>
  );
}
