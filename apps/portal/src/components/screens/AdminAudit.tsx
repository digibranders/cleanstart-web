"use client";

import { useCallback, useState } from "react";
import { Icon } from "@/components/icon";
import { AuditDrawer } from "@/components/people/AuditDrawer";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { type AuditEntry, useAudit } from "@/data/audit";

const ACTIONS = ["All actions", "Deal decisions", "Partners", "Documents", "People and access"] as const;
const WHO = ["Anyone", "CleanStart team", "Partner users", "HubSpot sync"] as const;
const PERIODS = ["Last 7 days", "Last 30 days", "Last 90 days"] as const;
const PERIOD_DAYS: Record<(typeof PERIODS)[number], number> = {
  "Last 7 days": 7,
  "Last 30 days": 30,
  "Last 90 days": 90,
};
const WHO_KIND: Record<Exclude<(typeof WHO)[number], "Anyone">, AuditEntry["whoKind"]> = {
  "CleanStart team": "staff",
  "Partner users": "partner",
  "HubSpot sync": "sync",
};

type ActionFilter = (typeof ACTIONS)[number];
type WhoFilter = (typeof WHO)[number];
type PeriodFilter = (typeof PERIODS)[number];

function pick<T extends string>(options: readonly T[], value: string, fallback: T): T {
  return options.find((o) => o === value) ?? fallback;
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function downloadCsv(rows: AuditEntry[]): void {
  const header = ["When", "Who", "Role", "Action", "On", "Source", "Details"];
  const lines = rows.map((e) =>
    [e.full, e.who, e.whoRole, e.action, e.target, e.source, e.note].map(csvCell).join(","),
  );
  const blob = new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cleanstart-audit-log.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminAudit(): React.JSX.Element {
  const toast = useToast();
  const all = useAudit();
  const [q, setQ] = useState("");
  const [action, setAction] = useState<ActionFilter>("All actions");
  const [who, setWho] = useState<WhoFilter>("Anyone");
  const [period, setPeriod] = useState<PeriodFilter>("Last 30 days");
  const [viewing, setViewing] = useState<string | null>(null);
  const closeView = useCallback((): void => setViewing(null), []);

  const needle = q.trim().toLowerCase();
  const events = all.filter(
    (e) =>
      e.ageDays < PERIOD_DAYS[period] &&
      (action === "All actions" || e.kind === action) &&
      (who === "Anyone" || e.whoKind === WHO_KIND[who]) &&
      (!needle || `${e.who} ${e.target} ${e.action}`.toLowerCase().includes(needle)),
  );
  const countText = `${events.length} ${events.length === 1 ? "event" : "events"}`;
  const selected = all.find((e) => e.id === viewing) ?? null;

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Audit log</h1>
          <span className="h1-sub">Every approval, upload and access change in the portal, newest first.</span>
        </div>
        <button
          type="button"
          className="btn btn-s"
          onClick={() => {
            downloadCsv(events);
            toast(`Exported ${countText} to CSV`);
          }}
        >
          <Icon name="dl" />
          Export CSV
        </button>
      </div>

      <section aria-label="Events" className="card clip">
        <div className="toolbar" data-tour="audit-filters">
          <div className="filters">
            <label className="sr" htmlFor="aq">
              Search
            </label>
            <input
              id="aq"
              className="finput"
              type="search"
              placeholder="Filter by partner, customer or person"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Dropdown
              ariaLabel="Action"
              value={action}
              options={ACTIONS}
              onChange={(v) => setAction(pick(ACTIONS, v, "All actions"))}
            />
            <Dropdown ariaLabel="Who" value={who} options={WHO} onChange={(v) => setWho(pick(WHO, v, "Anyone"))} />
            <Dropdown
              ariaLabel="Period"
              value={period}
              options={PERIODS}
              onChange={(v) => setPeriod(pick(PERIODS, v, "Last 30 days"))}
            />
          </div>
          <span className="card-meta tnum">{countText}</span>
        </div>
        <div style={{ overflowX: "auto" }} data-tour="audit-table">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Who</th>
                <th scope="col">Action</th>
                <th scope="col">On</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="tnum t-sec">{e.when}</td>
                  <td>
                    <span className="li-t">
                      <span className="li-n" style={{ fontSize: 13 }}>
                        {e.who}
                      </span>
                      <span className="li-s">{e.whoRole}</span>
                    </span>
                  </td>
                  <td>
                    <button type="button" className="linkbtn" onClick={() => setViewing(e.id)}>
                      {e.action}
                    </button>
                  </td>
                  <td style={{ whiteSpace: "normal" }}>{e.target}</td>
                  <td className="t-muted">{e.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length === 0 ? (
            <div className="empty">
              No events match these filters.{" "}
              <button
                type="button"
                className="btn btn-g"
                onClick={() => {
                  setQ("");
                  setAction("All actions");
                  setWho("Anyone");
                  setPeriod("Last 90 days");
                }}
                style={{ height: 24, padding: "0 6px", fontSize: 12 }}
              >
                Clear filters
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <AuditDrawer entry={selected} onClose={closeView} />
    </div>
  );
}
