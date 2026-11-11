"use client";

import { useMemo, useState } from "react";
import { acceptDeal, type Deal, rejectDeal, undoDecision, useDeals } from "@/data/deals";
import { downloadCsv } from "../deals/csv";
import { daysBetween, fmtLong, fmtShort, plural, TODAY } from "../deals/dates";
import { avOf, type Check, checksFor, initialsOf, OVER_TARGET_DAYS, reviewSince, waitDays } from "../deals/derive";
import { Icon } from "../icon";
import { ProductChip } from "../ui/badge";
import { Dropdown } from "../ui/dropdown";
import { Drawer } from "../ui/overlay";
import { useToast } from "../ui/toast";

const MY_REGION = "India";
const ALL_PRODUCTS = "All products";
const ALL_REGIONS = "All regions";
const PRODUCT_OPTIONS = [ALL_PRODUCTS, "CleanStart Images", "Clean Libraries", "CleanSight"];
const REGION_OPTIONS = [ALL_REGIONS, "India", "Middle East"];
/** Decisions this month that are not in the slice: 12 accepted and 2 rejected before this session. */
const BASE_ACCEPTED = 12;
const BASE_REJECTED = 2;
/** Protected deals ending in 14 days across all partners. Only Kestrel's are in the slice, so this is fixed. */
const EXPIRING_ALL_PARTNERS = 5;
const SMALL_BTN = { height: 24, padding: "0 6px", fontSize: 12 } as const;

type RowState = "open" | "rejecting" | "approved" | "rejected";

interface QueueRow {
  deal: Deal;
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

function defaultReason(deal: Deal, check: Check): string {
  const rival = check.rival;
  if (rival && rival.registered < deal.registered) {
    return `${rival.partner} registered this customer for ${deal.product} on ${fmtShort(rival.registered)}.`;
  }
  return "";
}

export function AdminApprovals(): React.JSX.Element {
  const toast = useToast();
  const deals = useDeals();

  const [queue, setQueue] = useState<"mine" | "all">("mine");
  const [q, setQ] = useState("");
  const [product, setProduct] = useState(ALL_PRODUCTS);
  const [region, setRegion] = useState(ALL_REGIONS);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Record<string, Rejecting>>({});

  const rows = useMemo<QueueRow[]>(
    () =>
      deals
        .filter((d) => d.status === "Pending" || (d.decidedLive && (d.status === "Accepted" || d.status === "Rejected")))
        .sort((a, b) => reviewSince(a).localeCompare(reviewSince(b)))
        .map((deal) => {
          const age = waitDays(deal);
          const state: RowState =
            deal.status === "Accepted" ? "approved" : deal.status === "Rejected" ? "rejected" : deal.id in rejecting ? "rejecting" : "open";
          return {
            deal,
            check: checksFor(deal, deals),
            state,
            age,
            over: deal.status === "Pending" && age > OVER_TARGET_DAYS,
          };
        }),
    [deals, rejecting],
  );

  const needle = q.trim().toLowerCase();
  const visible = rows.filter(
    ({ deal }) =>
      (queue === "all" || deal.region === MY_REGION) &&
      (!needle || `${deal.partner} ${deal.customer}`.toLowerCase().includes(needle)) &&
      (product === ALL_PRODUCTS || deal.product === product) &&
      (region === ALL_REGIONS || deal.region === region),
  );

  const waiting = rows.filter((r) => r.state === "open" || r.state === "rejecting");
  const overCount = waiting.filter((r) => r.over).length;
  const conflictCount = waiting.filter((r) => r.check.kind === "conflict").length;
  const liveAccepted = rows.filter((r) => r.state === "approved").length;
  const liveRejected = rows.filter((r) => r.state === "rejected").length;
  const firstOpenId = visible.find((r) => r.state === "open")?.deal.id;
  const firstConflictId = visible.find((r) => r.check.kind === "conflict")?.deal.id;
  const viewing = rows.find((r) => r.deal.id === viewingId);

  const recentDecisions = deals
    .filter(
      (d) =>
        (d.status === "Accepted" || d.status === "Rejected") &&
        d.decidedOn !== undefined &&
        daysBetween(d.decidedOn, TODAY) <= 7,
    )
    .sort((a, b) => (b.decidedOn ?? "").localeCompare(a.decidedOn ?? ""));

  const accept = (row: QueueRow): void => {
    acceptDeal(row.deal.id);
    toast(`${row.deal.customer} accepted. HubSpot deal created.`);
  };

  const startReject = (row: QueueRow): void =>
    setRejecting((prev) => ({ ...prev, [row.deal.id]: { reason: defaultReason(row.deal, row.check), tried: false } }));

  const cancelReject = (id: string): void =>
    setRejecting((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });

  const confirmReject = (row: QueueRow): void => {
    const entry = rejecting[row.deal.id];
    if (!entry) return;
    if (!entry.reason.trim()) {
      setRejecting((prev) => ({ ...prev, [row.deal.id]: { ...entry, tried: true } }));
      return;
    }
    rejectDeal(row.deal.id, entry.reason);
    cancelReject(row.deal.id);
    toast(`${row.deal.customer} rejected. The partner has been emailed.`);
  };

  const undo = (row: QueueRow): void => {
    if (row.state === "rejecting") cancelReject(row.deal.id);
    else undoDecision(row.deal.id);
  };

  const exportCsv = (): void => {
    downloadCsv("deal-approvals.csv", [
      ["Partner", "Customer", "Product", "Region", "Submitted", "Waiting", "Checks", "Decision"],
      ...visible.map((r) => [
        r.deal.partner,
        r.deal.customer,
        r.deal.product,
        r.deal.region,
        fmtLong(reviewSince(r.deal)),
        ageLabel(r.age),
        r.check.label,
        r.state === "approved" ? "Accepted" : r.state === "rejected" ? "Rejected" : "Waiting",
      ]),
    ]);
    toast(`Exported ${visible.length} registrations to CSV`);
  };

  const queues: { key: "mine" | "all"; label: string; count: number }[] = [
    { key: "mine", label: "My queue", count: waiting.filter((r) => r.deal.region === MY_REGION).length },
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
        <div className="kpi" data-tour={firstConflictId ? undefined : "approvals-conflict"}>
          <span className="kpi-l">With a conflict</span>
          <span className="kpi-v t-amber">{conflictCount}</span>
          <span className="kpi-f">Same customer and product</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Decided this month</span>
          <span className="kpi-v">{BASE_ACCEPTED + BASE_REJECTED + liveAccepted + liveRejected}</span>
          <span className="kpi-f">
            Accepted {BASE_ACCEPTED + liveAccepted}, rejected {BASE_REJECTED + liveRejected}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Expiring in 14 days</span>
          <span className="kpi-v t-amber">{EXPIRING_ALL_PARTNERS}</span>
          <span className="kpi-f">Partners reminded</span>
        </div>
      </section>

      <section aria-label="Queue" className="card clip" data-tour="approvals-queue">
        <div className="toolbar">
          <div className="filters">
            <div className="seg" role="group" aria-label="Whose queue" style={{ marginRight: 4 }}>
              {queues.map((qv) => (
                <button
                  type="button"
                  key={qv.key}
                  className={`seg-b${queue === qv.key ? " seg-on" : ""}`}
                  aria-pressed={queue === qv.key}
                  onClick={() => setQueue(qv.key)}
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
            {visible.length} shown, oldest first. India goes to Farhan, Middle East to Omar.
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
                  <tr key={deal.id} data-tour={deal.id === firstConflictId ? "approvals-conflict" : undefined}>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className={`av ${avOf(deal.partner)}`}>{initialsOf(deal.partner)}</span>
                        <span className="li-n" style={{ fontSize: 13 }}>
                          {deal.partner}
                        </span>
                      </span>
                    </td>
                    <td>
                      <button type="button" className="linkbtn" onClick={() => setViewingId(deal.id)}>
                        {deal.customer}
                      </button>
                    </td>
                    <td>
                      <ProductChip product={deal.product} />
                    </td>
                    <td className="t-sec">{deal.region}</td>
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
                            aria-label={`Reject ${deal.customer} from ${deal.partner}`}
                            data-tip="Reject with a reason"
                          >
                            <Icon name="x" />
                          </button>
                          <button
                            type="button"
                            className="act act-ok"
                            onClick={() => accept(row)}
                            aria-label={`Accept ${deal.customer} from ${deal.partner}`}
                            data-tip="Accept and create the HubSpot deal"
                            data-tour={deal.id === firstOpenId ? "approvals-accept" : undefined}
                          >
                            <Icon name="checkIcon" />
                          </button>
                        </span>
                      ) : null}
                      {state === "approved" ? (
                        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <span className="badge b-accepted">Accepted, in HubSpot</span>
                          <button type="button" className="btn btn-g" onClick={() => undo(row)} style={SMALL_BTN}>
                            Undo
                          </button>
                        </span>
                      ) : null}
                      {state === "rejected" ? (
                        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <span className="badge b-rejected">Rejected, emailed</span>
                          <button type="button" className="btn btn-g" onClick={() => undo(row)} style={SMALL_BTN}>
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
                        <button type="button" className="btn btn-dd" onClick={() => confirmReject(row)}>
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
                <td className="tnum t-sec">{fmtShort(d.decidedOn ?? TODAY)}</td>
                <td>{d.partner}</td>
                <td style={{ fontWeight: 600 }}>{d.customer}</td>
                <td>
                  <ProductChip product={d.product} />
                </td>
                <td>
                  <span className={`badge ${d.status === "Accepted" ? "b-accepted" : "b-rejected"}`}>{d.status}</span>
                </td>
                <td className="tnum t-sec">{d.crmRef ?? "Not created"}</td>
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
          subtitle={`Registered by ${viewing.deal.partner}, ${viewing.deal.partnerCategory}`}
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
            <dd>{viewing.deal.product}</dd>
            <dt>Region</dt>
            <dd>{viewing.deal.region}</dd>
            <dt>Account manager</dt>
            <dd>{viewing.deal.manager}</dd>
            <dt>Partner</dt>
            <dd>{viewing.deal.partner}</dd>
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
        </Drawer>
      ) : null}
    </div>
  );
}
