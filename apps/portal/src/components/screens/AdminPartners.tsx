"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { AddPartnerDrawer } from "@/components/partners/add-partner-drawer";
import { ApplicationsTable } from "@/components/partners/applications-table";
import { downloadCsv } from "@/components/partners/csv";
import { PartnerDetail } from "@/components/partners/partner-detail";
import { CategoryDialog, ManagerDialog } from "@/components/partners/partner-dialogs";
import { CATEGORY_FOR_FILTER, type CategoryFilter, PartnersTable } from "@/components/partners/partners-table";
import { useToast } from "@/components/ui/toast";
import {
  addPartner,
  approveApplication,
  declineApplication,
  type NewPartnerInput,
  partnersSlice,
  reopenApplication,
  resendInvites,
  setPartnerCategory,
  setPartnerManager,
  setPartnerSuspended,
  UNLISTED_ACTIVE_PARTNERS,
} from "@/data/partners";

type Tab = "Partners" | "Applications";

export function AdminPartners(): React.JSX.Element {
  const toast = useToast();
  const { partners, applications } = partnersSlice.use();
  const [tab, setTab] = useState<Tab>("Partners");
  const requestedTab = useSearchParams().get("tab");
  useEffect(() => {
    if (requestedTab === "applications") setTab("Applications");
  }, [requestedTab]);
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [region, setRegion] = useState("All regions");
  const [status, setStatus] = useState("Any status");
  const [selectedId, setSelectedId] = useState("kestrel-systems");
  const [dialog, setDialog] = useState<"add" | "category" | "manager" | null>(null);

  const wantedCategory = CATEGORY_FOR_FILTER[category];
  const shown = partners.filter(
    (p) =>
      (!wantedCategory || p.category === wantedCategory) &&
      (region === "All regions" || p.region === region) &&
      (status === "Any status" || p.status === status),
  );
  const selected =
    shown.find((p) => p.id === selectedId) ?? shown[0] ?? partners.find((p) => p.id === selectedId) ?? partners[0];

  const total = UNLISTED_ACTIVE_PARTNERS + partners.length;
  const active = UNLISTED_ACTIVE_PARTNERS + partners.filter((p) => p.status === "Active").length;
  const onboarding = partners.filter((p) => p.status === "Onboarding").length;
  const inactive = partners.filter((p) => p.status === "Inactive").length;
  const waiting = applications.filter((a) => a.status === "New").length;

  const exportCsv = (): void => {
    downloadCsv(
      "partners.csv",
      [
        "Partner",
        "Domain",
        "Category",
        "Region",
        "Status",
        "Pending",
        "Protected",
        "Won YTD",
        "Last active",
        "Partner manager",
      ],
      shown.map((p) => [
        p.name,
        p.domain,
        p.category,
        p.region,
        p.status,
        p.pending,
        p.protected,
        p.won,
        p.last,
        p.manager,
      ]),
    );
    toast(`Exported ${shown.length} ${shown.length === 1 ? "partner" : "partners"} to CSV`);
  };

  const onAdd = (input: NewPartnerInput): void => {
    const added = addPartner(input);
    setDialog(null);
    setTab("Partners");
    setCategory("All");
    setRegion("All regions");
    setStatus("Any status");
    setSelectedId(added.id);
    toast(input.sendInvite ? `Invite sent to ${input.email.trim()}` : `${added.name} added, invite not sent yet`);
  };

  const tabs: readonly (readonly [Tab, number])[] = [
    ["Partners", total],
    ["Applications", waiting],
  ];

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Partners</h1>
          <span className="h1-sub">Approving an application creates the account and invites the applicant.</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="btn btn-s" onClick={exportCsv}>
            <Icon name="dl" />
            Export
          </button>
          <button type="button" className="btn btn-p" onClick={() => setDialog("add")}>
            <Icon name="userplus" />
            Add partner
          </button>
        </div>
      </div>

      <section aria-label="Partner summary" className="card kpis">
        <div className="kpi">
          <span className="kpi-l">Active partners</span>
          <span className="kpi-v">{active}</span>
          <span className="kpi-f">
            {onboarding} onboarding, {inactive} inactive
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Applications</span>
          <span className="kpi-v t-amber">{waiting}</span>
          <span className="kpi-f">Waiting for a decision</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Partner users</span>
          <span className="kpi-v">64</span>
          <span className="kpi-f">52 active this month</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Deals this quarter</span>
          <span className="kpi-v">46</span>
          <span className="kpi-f">From 15 partners</span>
        </div>
      </section>

      <div className="row">
        <section aria-label="Partners and applications" className="card clip" style={{ flex: "1 1 100%", minWidth: 0 }}>
          <div className="tabs" role="group" aria-label="View" style={{ padding: "0 8px" }} data-tour="partners-tabs">
            {tabs.map(([label, count]) => (
              <button
                key={label}
                type="button"
                className={`tab${tab === label ? " tab-on" : ""}`}
                aria-pressed={tab === label}
                onClick={() => setTab(label)}
              >
                {label}
                <span className="cnt">{count}</span>
              </button>
            ))}
          </div>

          {tab === "Partners" ? (
            <PartnersTable
              partners={shown}
              total={total}
              selectedId={selected?.id ?? ""}
              category={category}
              region={region}
              status={status}
              onCategory={setCategory}
              onRegion={setRegion}
              onStatus={setStatus}
              onSelect={setSelectedId}
            />
          ) : (
            <ApplicationsTable
              applications={applications}
              waiting={waiting}
              onApprove={(a) => {
                approveApplication(a.id);
                toast(`Approved ${a.company}. Invite sent to ${a.applicant}`);
              }}
              onDecline={(a, reason) => {
                declineApplication(a.id, reason);
                toast(`Rejected ${a.company}. ${a.applicant} has been emailed`);
              }}
              onUndo={(a) => {
                reopenApplication(a.id);
                toast(`${a.company} is back in the queue`);
              }}
            />
          )}
        </section>

        {tab === "Partners" && selected ? (
          <PartnerDetail
            key={selected.id}
            partner={selected}
            onChangeManager={() => setDialog("manager")}
            onChangeCategory={() => setDialog("category")}
            onResendInvites={() => {
              const count = resendInvites(selected.id);
              toast(
                count > 0
                  ? `Invites resent to ${count} ${count === 1 ? "person" : "people"} at ${selected.name}`
                  : `Everyone at ${selected.name} has accepted their invite`,
              );
            }}
            onSuspend={() => {
              setPartnerSuspended(selected.id, true);
              toast(`${selected.name} is suspended`);
            }}
            onRestore={() => {
              setPartnerSuspended(selected.id, false);
              toast(`Access restored for ${selected.name}`);
            }}
          />
        ) : null}
      </div>

      {dialog === "add" ? <AddPartnerDrawer partners={partners} onClose={() => setDialog(null)} onAdd={onAdd} /> : null}
      {dialog === "category" && selected ? (
        <CategoryDialog
          partner={selected}
          onClose={() => setDialog(null)}
          onSave={(value) => {
            setPartnerCategory(selected.id, value);
            setDialog(null);
            toast(`${selected.name} is now listed as ${value.toLowerCase()}`);
          }}
        />
      ) : null}
      {dialog === "manager" && selected ? (
        <ManagerDialog
          partner={selected}
          onClose={() => setDialog(null)}
          onSave={(value) => {
            setPartnerManager(selected.id, value);
            setDialog(null);
            toast(`${value} now manages ${selected.name}`);
          }}
        />
      ) : null}
    </div>
  );
}
