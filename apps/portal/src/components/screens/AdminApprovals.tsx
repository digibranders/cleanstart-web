"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fmtTimestamp } from "@/lib/dates";
import { PARTNER_CATEGORY_LABEL, PRODUCT_LABEL, type StaffScope } from "@/lib/domain";
import type { ApprovalQueueDto, ManagerOptionDto, RegistrationDetailDto } from "@/lib/dto";
import { BULK_DECIDE_MAX } from "@/lib/deal-rules";
import { type BulkItemResult, bulkDecideAction } from "@/server/actions/bulk-decide";
import { ROUTES } from "@/lib/routes";
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
import { type StaffDealFacet, type StaffDealFilters, type StaffDealsPageDto, staffDealHref } from "@/lib/staff-deals-dto";
import Link from "next/link";
import { downloadCsv } from "../deals/csv";
import { StaffDealFacetBar, StaffDealsTable } from "./StaffDealsTable";
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
import { ReassignControl } from "../deals/ReassignControl";
import { ProductChip } from "../ui/badge";
import { Dropdown } from "../ui/dropdown";
import { Drawer } from "../ui/overlay";
import { useToast } from "../ui/toast";
import { ScrollRegion } from "@/components/ui/scroll-region";
import { useRegions } from "@/components/regions-context";
import { isAllRegions, scopeCovers } from "@/lib/regions";

const ALL_PRODUCTS = "All products";
const ALL_REGIONS = "All regions";
const PRODUCT_OPTIONS = [ALL_PRODUCTS, "CleanStart Images", "Clean Libraries", "CleanSight"];
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
  viewerRegions: StaffScope;
  managers: ManagerOptionDto[];
  today: string;
  facet: StaffDealFacet;
  deals: StaffDealsPageDto;
  filters: StaffDealFilters;
  partners: { id: string; name: string }[];
  /** Partner managers: reassign a waiting registration and register a deal for a partner. */
  canReassign: boolean;
}

const chunked = <T,>(list: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));

function RegisterForPartnerLink(): React.JSX.Element {
  return (
    <Link href={ROUTES.admin.newDeal} className="btn btn-p">
      <Icon name="reg" />
      Register deal for a partner
    </Link>
  );
}

export function AdminApprovals({
  queue,
  extensions,
  viewerId,
  viewerRegions,
  managers,
  today,
  facet,
  deals,
  filters,
  partners,
  canReassign,
}: AdminApprovalsProps): React.JSX.Element {
  const toast = useToast();
  const { regions, offer, name: regionName } = useRegions();

  const [view, setView] = useState<"mine" | "all">("all");
  const [q, setQ] = useState("");
  const [product, setProduct] = useState(ALL_PRODUCTS);
  const [region, setRegion] = useState(ALL_REGIONS);
  const regionOptions = [ALL_REGIONS, ...offer(regions.find((r) => r.name === region)?.key).map((r) => r.name)];
  // The Audit log links here with ?deal=<id> to open that registration.
  const [viewingId, setViewingId] = useState<string | null>(useSearchParams().get("deal"));
  const [declining, setDeclining] = useState<{ id: string; note: string; tried: boolean } | null>(null);
  const [rejecting, setRejecting] = useState<Record<string, Rejecting>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hints, setHints] = useState<Record<string, HubspotHintDto>>({});
  const [reply, setReply] = useState("");
  const [replyTried, setReplyTried] = useState(false);
  const [replying, setReplying] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [bulkReason, setBulkReason] = useState<string | null>(null);
  const [bulkTried, setBulkTried] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

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
    isAllRegions(viewerRegions) ? deal.managerId === viewerId : scopeCovers(viewerRegions, deal.region);

  const needle = q.trim().toLowerCase();
  const visible = rows.filter(
    ({ deal }) =>
      (view === "all" || inMyQueue(deal)) &&
      (!needle || `${deal.partnerName} ${deal.customer}`.toLowerCase().includes(needle)) &&
      (product === ALL_PRODUCTS || PRODUCT_LABEL[deal.product] === product) &&
      (region === ALL_REGIONS || regionName(deal.region) === region),
  );

  const waiting = rows.filter((r) => r.state === "open" || r.state === "rejecting");
  const inScope = waiting.filter((r) => view === "all" || inMyQueue(r.deal));
  const overCount = inScope.filter((r) => r.over).length;
  const conflictCount = inScope.filter((r) => r.check.kind === "conflict").length;
  const oldest = inScope.reduce<QueueRow | null>((top, r) => (top === null || r.age > top.age ? r : top), null);
  const viewing = rows.find((r) => r.deal.id === viewingId);
  const recentDecisions = queue.recentDecisions;
  const visibleExtensions = extensions.filter((d) => view === "all" || inMyQueue(d));

  const decideExt = async (deal: RegistrationDetailDto, decision: "grant" | "decline", note: string | null): Promise<void> => {
    setBusyId(deal.id);
    try {
      const result = await decideExtensionAction({ id: deal.id, decision, note });
      if (result.ok) setDeclining(null);
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
        regionName(r.deal.region),
        fmtLong(reviewSince(r.deal)),
        ageLabel(r.age),
        r.check.label,
        r.state === "approved" ? "Accepted" : r.state === "rejected" ? "Rejected" : "Waiting",
      ]),
    ]);
    toast(`Exported ${visible.length} registrations to CSV`);
  };

  const selectable = visible.filter((r) => r.state === "open").map((r) => r.deal.id);
  const chosen = selectable.filter((id) => selected.has(id));
  const allChosen = selectable.length > 0 && chosen.length === selectable.length;

  const toggleOne = (id: string): void =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const toggleAll = (): void => setSelected(allChosen ? new Set() : new Set(selectable));
  const clearSelection = (): void => {
    setSelected(new Set());
    setBulkReason(null);
    setBulkTried(false);
  };

  const runBulk = async (decision: "accept" | "reject"): Promise<void> => {
    if (decision === "reject" && !bulkReason?.trim()) {
      setBulkTried(true);
      return;
    }
    setBulkBusy(true);
    const items: BulkItemResult[] = [];
    let failure: string | null = null;
    for (const ids of chunked(chosen, BULK_DECIDE_MAX)) {
      const result = await bulkDecideAction({ decision, ids, reason: bulkReason ?? undefined });
      if (!result.ok) {
        failure = issuesToErrors(result.error).reason ?? result.error.message;
        break;
      }
      items.push(...result.data.items);
    }
    setBulkBusy(false);
    const done = items.filter((i) => i.status === "done").map((i) => i.id);
    const skipped = items.filter((i) => i.status === "skipped").length;
    const failed = items.filter((i) => i.status === "failed").length;
    setRowErrors(Object.fromEntries(items.filter((i) => i.message).map((i) => [i.id, i.message ?? ""])));
    setSelected((prev) => new Set([...prev].filter((id) => !done.includes(id))));
    if (done.length > 0 && failed + skipped === 0) {
      setBulkReason(null);
      setBulkTried(false);
    }
    const verb = decision === "accept" ? "accepted" : "rejected";
    const rest = [skipped ? `${skipped} skipped` : "", failed ? `${failed} failed` : ""].filter(Boolean).join(", ");
    toast(failure ?? `${done.length} ${verb}${rest ? `, ${rest}` : ""}.${skipped + failed > 0 ? " See the rows marked below." : ""}`);
  };

  const queues: { key: "mine" | "all"; label: string; count: number }[] = [
    { key: "mine", label: "My queue", count: waiting.filter((r) => inMyQueue(r.deal)).length },
    { key: "all", label: "All regions", count: waiting.length },
  ];

  if (facet !== "waiting") {
    return (
      <div className="wrap">
        <div className="head">
          <h1 className="h1">Deals</h1>
          {canReassign ? <RegisterForPartnerLink /> : null}
        </div>
        <StaffDealFacetBar facet={facet} counts={deals.counts} filters={filters} />
        <StaffDealsTable facet={facet} deals={deals} filters={filters} partners={partners} managers={managers} />
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Deals</h1>
          <span className="h1-sub">
            Accepting creates the deal in HubSpot, starts 90 days of protection and emails the partner.
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {canReassign ? <RegisterForPartnerLink /> : null}
          <button type="button" className="btn btn-s" onClick={exportCsv}>
            <Icon name="dl" />
            Export
          </button>
        </div>
      </div>

      <StaffDealFacetBar facet={facet} counts={deals.counts} filters={filters} />

      <section aria-label="Queue summary" className="card kpis">
        <div className="kpi">
          <span className="kpi-l">{view === "mine" ? "Waiting, my queue" : "Waiting, all regions"}</span>
          <span className="kpi-v">{inScope.length}</span>
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
          <span className="kpi-l">Oldest waiting</span>
          <span className="kpi-v">{oldest ? ageLabel(oldest.age) : "None"}</span>
          <span className="kpi-f">{oldest ? oldest.deal.customer : "Nothing waiting"}</span>
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
              placeholder="Partner or customer"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Dropdown id="ap" ariaLabel="Product" value={product} options={PRODUCT_OPTIONS} onChange={setProduct} />
            <Dropdown id="ar" ariaLabel="Region" value={region} options={regionOptions} onChange={setRegion} />
          </div>
          <span className="card-meta tnum">
            {visible.length} shown, oldest first. {routingText(managers, regions)}
          </span>
        </div>
        <ScrollRegion label="Approval queue">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col" style={{ width: 32 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all waiting registrations shown"
                    checked={allChosen}
                    disabled={selectable.length === 0}
                    onChange={toggleAll}
                  />
                </th>
                <th scope="col" className="hide-sm">
                  Partner
                </th>
                <th scope="col">Customer</th>
                <th scope="col" className="hide-sm">
                  Product
                </th>
                <th scope="col" className="hide-sm">
                  Region
                </th>
                <th scope="col" className="hide-sm">
                  Waiting
                </th>
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
                      {state === "open" ? (
                        <input
                          type="checkbox"
                          aria-label={`Select ${deal.customer} from ${deal.partnerName}`}
                          checked={selected.has(deal.id)}
                          onChange={() => toggleOne(deal.id)}
                        />
                      ) : null}
                    </td>
                    <td className="hide-sm">
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
                    <td className="hide-sm">
                      <ProductChip product={CHIP_PRODUCT[deal.product]} />
                    </td>
                    <td className="t-sec hide-sm">{regionName(deal.region)}</td>
                    <td className={`tnum hide-sm ${row.over ? "t-amber" : "t-sec"}`} data-hint={`Submitted ${fmtLong(reviewSince(deal))}`}>
                      {ageLabel(row.age)}
                      {row.over ? <span className="why why-amber">Over 2-day target</span> : null}
                    </td>
                    <td style={{ whiteSpace: "normal" }}>
                      {check.rival ? (
                        <Link href={staffDealHref(check.rival.id)} className={`badge b-${check.tone}`} data-hint="Open the other registration">
                          {check.label}
                        </Link>
                      ) : (
                        <span className={`badge b-${check.tone}`}>{check.label}</span>
                      )}
                      {check.why && state !== "rejecting" ? <span className={`${check.whyCls} hide-sm`}>{check.why}</span> : null}
                      {rowErrors[deal.id] ? (
                        <span className="err" role="alert">
                          {rowErrors[deal.id]}
                        </span>
                      ) : null}
                    </td>
                    <td className="r">
                      {state === "open" ? (
                        <span className="acts" style={{ gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn btn-d"
                            onClick={() => startReject(row)}
                            disabled={busyId === deal.id}
                            aria-label={`Reject ${deal.customer} from ${deal.partnerName}`}
                            data-hint="Reject with a reason"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            className="btn btn-p"
                            onClick={() => accept(row)}
                            disabled={busyId === deal.id}
                            aria-label={`Accept ${deal.customer} from ${deal.partnerName}`}
                            data-hint="Accept and create the HubSpot deal"
                          >
                            Accept
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
                    <td colSpan={8} style={{ paddingTop: 0, whiteSpace: "normal" }}>
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
                            Reason the partner will see <span className="t-muted">(required)</span>
                          </label>
                          <input
                            id={`reason-${deal.id}`}
                            className={`field${reasonErr ? " field-err" : ""}`}
                            type="text"
                            placeholder="For example, already registered by another partner"
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
        </ScrollRegion>
      </section>

      {chosen.length > 0 ? (
        <div
          role="region"
          aria-label="Bulk decision"
          className="card stick-b"
          style={{
            position: "sticky",
            bottom: 12,
            zIndex: 6,
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            flexWrap: "wrap",
            padding: "10px 14px",
            boxShadow: "0 6px 24px rgba(23, 20, 43, 0.14)",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, alignSelf: "center" }}>{chosen.length} selected</span>
          {bulkReason !== null ? (
            <div className="fg" style={{ flex: "1 1 280px" }}>
              <label htmlFor="bulk-reason" className="lbl">
                Reason every partner will see <span className="t-muted">(required)</span>
              </label>
              <input
                id="bulk-reason"
                className={`field${bulkTried && !bulkReason.trim() ? " field-err" : ""}`}
                type="text"
                maxLength={500}
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                aria-invalid={bulkTried && !bulkReason.trim() ? true : undefined}
              />
              {bulkTried && !bulkReason.trim() ? <span className="err">Add a reason the partners will see.</span> : null}
            </div>
          ) : null}
          <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: "auto" }}>
            <button type="button" className="btn btn-s" disabled={bulkBusy} onClick={bulkReason === null ? clearSelection : () => setBulkReason(null)}>
              {bulkReason === null ? "Clear" : "Cancel"}
            </button>
            {bulkReason === null ? (
              <>
                <button type="button" className="btn btn-d" disabled={bulkBusy} onClick={() => setBulkReason("")}>
                  Reject selected
                </button>
                <button type="button" className="btn btn-p" disabled={bulkBusy} onClick={() => runBulk("accept")}>
                  <Icon name="checkIcon" />
                  Accept selected
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-dd" disabled={bulkBusy} onClick={() => runBulk("reject")}>
                Reject {chosen.length} and email
              </button>
            )}
          </span>
        </div>
      ) : null}

      {visibleExtensions.length > 0 ? (
        <section aria-labelledby="extreq" className="card clip">
          <div className="card-h">
            <h2 id="extreq" className="card-t">
              Extension requests
            </h2>
            <span className="card-meta">{visibleExtensions.length}</span>
          </div>
          <ScrollRegion label="Extension requests">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Partner</th>
                  <th scope="col">Customer</th>
                  <th scope="col" className="hide-sm">
                    Product
                  </th>
                  <th scope="col" className="hide-sm">
                    Protected until
                  </th>
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
                    <td className="hide-sm">
                      <ProductChip product={CHIP_PRODUCT[d.product]} />
                    </td>
                    <td className="tnum t-sec hide-sm">{d.protectionEnd ? fmtLong(d.protectionEnd) : ""}</td>
                    <td className="t-sec" style={{ whiteSpace: "normal", maxWidth: 360 }}>
                      {d.extensionReason}
                      {declining?.id === d.id ? (
                        <span className="fg" style={{ marginTop: 8 }}>
                          <label htmlFor={`ext-why-${d.id}`} className="lbl">
                            Reason for declining, sent to {d.partnerName}
                          </label>
                          <textarea
                            id={`ext-why-${d.id}`}
                            className={`field${declining.tried && !declining.note.trim() ? " field-err" : ""}`}
                            rows={2}
                            maxLength={500}
                            value={declining.note}
                            onChange={(e) => setDeclining({ ...declining, note: e.target.value })}
                            aria-invalid={declining.tried && !declining.note.trim() ? true : undefined}
                          />
                          {declining.tried && !declining.note.trim() ? <span className="err">Say why, so the partner knows.</span> : null}
                        </span>
                      ) : null}
                    </td>
                    <td className="r">
                      {declining?.id === d.id ? (
                        <span style={{ display: "inline-flex", gap: 6 }}>
                          <button type="button" className="btn btn-s" onClick={() => setDeclining(null)} disabled={busyId === d.id} style={SMALL_BTN}>
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-dd"
                            onClick={() => (declining.note.trim() ? decideExt(d, "decline", declining.note.trim()) : setDeclining({ ...declining, tried: true }))}
                            disabled={busyId === d.id}
                            style={SMALL_BTN}
                          >
                            Send decline
                          </button>
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", gap: 6 }}>
                          <button type="button" className="btn btn-s" onClick={() => setDeclining({ id: d.id, note: "", tried: false })} disabled={busyId === d.id} style={SMALL_BTN}>
                            Decline
                          </button>
                          <button type="button" className="btn btn-p" onClick={() => decideExt(d, "grant", null)} disabled={busyId === d.id} style={SMALL_BTN}>
                            Grant {EXTENSION_DAYS} days
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </section>
      ) : null}

      <section aria-labelledby="recentdec" className="card clip">
        <div className="card-h">
          <h2 id="recentdec" className="card-t">
            Recent decisions
          </h2>
          <span className="card-meta">Last 7 days</span>
        </div>
        {recentDecisions.length === 0 ? (
          <div className="empty">No decisions in the last 7 days.</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col" className="hide-sm">
                  Decided
                </th>
                <th scope="col">Partner</th>
                <th scope="col">Customer</th>
                <th scope="col" className="hide-sm">
                  Product
                </th>
                <th scope="col">Decision</th>
                <th scope="col" className="hide-sm">
                  HubSpot
                </th>
              </tr>
            </thead>
            <tbody>
              {recentDecisions.map((d) => (
                <tr key={d.id}>
                  <td className="tnum t-sec hide-sm">{fmtShort(d.decidedOn ?? today)}</td>
                  <td>{d.partnerName}</td>
                  <td style={{ fontWeight: 600 }}>
                    <Link href={staffDealHref(d.id)} className="linkbtn">
                      {d.customer}
                    </Link>
                  </td>
                  <td className="hide-sm">
                    <ProductChip product={CHIP_PRODUCT[d.product]} />
                  </td>
                  <td>
                    <span className={`badge ${d.status === "rejected" ? "b-rejected" : "b-accepted"}`}>
                      {d.status === "rejected" ? "Rejected" : "Accepted"}
                    </span>
                  </td>
                  <td className="tnum t-sec hide-sm">{d.crmRef ?? (d.status === "rejected" ? "Not created" : "Queued")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
                <Link href={staffDealHref(viewing.deal.id)} className="btn btn-s">
                  Open deal page
                </Link>
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
            <dt>{viewing.deal.contacts.length > 1 ? "Contacts" : "Contact"}</dt>
            <dd>
              {viewing.deal.contacts.length === 0
                ? "Not recorded"
                : viewing.deal.contacts.map((c) => (
                    <span key={c.id} style={{ display: "block" }}>
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
                    </span>
                  ))}
            </dd>
            <dt>Website</dt>
            <dd>{viewing.deal.website ?? "Not recorded"}</dd>
            <dt>Expected close</dt>
            <dd>{viewing.deal.expectedClose ? fmtLong(viewing.deal.expectedClose) : "Not recorded"}</dd>
            <dt>Product</dt>
            <dd>{PRODUCT_LABEL[viewing.deal.product]}</dd>
            <dt>Region</dt>
            <dd>{regionName(viewing.deal.region)}</dd>
            <dt>Partner manager</dt>
            <dd>{viewing.deal.managerName ?? "Not assigned"}</dd>
            <dt>Partner</dt>
            <dd>{viewing.deal.partnerName}</dd>
            <dt>Submitted</dt>
            <dd>{fmtLong(reviewSince(viewing.deal))}</dd>
          </dl>
          {viewing.deal.notes ? (
            <div className="fg">
              <span className="lbl">Partner notes</span>
              <span style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{viewing.deal.notes}</span>
            </div>
          ) : null}
          {canReassign && viewing.state === "open" ? (
            <ReassignControl key={`${viewing.deal.id}-${viewing.deal.managerId}-${viewing.deal.region}`} deal={viewing.deal} managers={managers} />
          ) : null}
          <div className="fg">
            <span className="lbl">Checks</span>
            <span>
              <span className={`badge b-${viewing.check.tone}`}>{viewing.check.label}</span>
            </span>
            {viewing.check.rival ? (
              <Link href={staffDealHref(viewing.check.rival.id)} className="linkbtn">
                Open the other registration
              </Link>
            ) : null}
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
