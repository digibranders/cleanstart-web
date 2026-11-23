"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { AddPartnerDrawer, type NewPartnerValues } from "@/components/partners/add-partner-drawer";
import { ApplicationsTable } from "@/components/partners/applications-table";
import { downloadCsv } from "@/components/partners/csv";
import { PartnerDetail } from "@/components/partners/partner-detail";
import { CategoryDialog, ManagerDialog } from "@/components/partners/partner-dialogs";
import { type PartnerTab as Tab, partnerTabs } from "@/components/partners/partner-tabs";
import { CATEGORY_FOR_FILTER, type CategoryFilter, type PartnerSort, PartnersTable } from "@/components/partners/partners-table";
import { useToast } from "@/components/ui/toast";
import { daysBetween, plural } from "@/lib/dates";
import { PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL, PARTNER_STATUS_LABEL } from "@/lib/domain";
import type { ApplicationDto, ManagerOptionDto, PartnerDetailDto, PartnerListRow } from "@/lib/dto";
import { codeFromLabel, lastSeenLabel } from "@/lib/people";
import {
  approveApplicationAction,
  declineApplicationAction,
  reopenApplicationAction,
} from "@/server/actions/applications";
import {
  createPartnerAction,
  resendPartnerInvitesAction,
  restorePartnerAction,
  setPartnerCategoryAction,
  setPartnerManagerAction,
  suspendPartnerAction,
} from "@/server/actions/partners";
import type { ActionResult } from "@/server/actions/result";

interface AdminPartnersProps {
  partners: PartnerListRow[];
  /** The selected partner, loaded by the page. Null when there are no partners. */
  detail: PartnerDetailDto | null;
  managers: ManagerOptionDto[];
  applications: ApplicationDto[];
  /** Applications with status new, from countNewApplications. */
  waiting: number;
  /** Holders of `partner.create` add and change partners; other staff read the list. */
  canManage: boolean;
  /** Holders of `application.read` see the Applications tab and its count. */
  canReadApplications: boolean;
  /** Holders of `application.approve` get the approve, decline and undo buttons. */
  canDecide: boolean;
  today: string;
}

export function AdminPartners({
  partners,
  detail,
  managers,
  applications,
  waiting,
  canManage,
  canReadApplications,
  canDecide,
  today,
}: AdminPartnersProps): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("Partners");
  const requestedTab = searchParams.get("tab");
  useEffect(() => {
    if (requestedTab === "applications" && canReadApplications) setTab("Applications");
  }, [requestedTab, canReadApplications]);
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [region, setRegion] = useState("All regions");
  const [status, setStatus] = useState("Any status");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<PartnerSort>("name");
  const [dialog, setDialog] = useState<"add" | "category" | "manager" | null>(null);

  const selectedParam = searchParams.get("selected");
  const open = selectedParam !== null && detail?.id === selectedParam ? detail : null;

  const wantedCategory = CATEGORY_FOR_FILTER[category];
  const wantedRegion = region === "All regions" ? null : codeFromLabel(PARTNER_REGION_LABEL, region);
  const wantedStatus = status === "Any status" ? null : codeFromLabel(PARTNER_STATUS_LABEL, status);
  const needle = query.trim().toLowerCase();
  const matching = partners.filter(
    (p) =>
      (!needle || p.name.toLowerCase().includes(needle) || p.domain.toLowerCase().includes(needle)) &&
      (!wantedCategory || p.category === wantedCategory) &&
      (!wantedRegion || p.region === wantedRegion) &&
      (!wantedStatus || p.status === wantedStatus),
  );
  const shown = [...matching].sort((a, b) => {
    if (sort === "active") return (b.lastActiveAt ?? "").localeCompare(a.lastActiveAt ?? "");
    if (sort === "pending") return b.pending - a.pending || a.name.localeCompare(b.name);
    if (sort === "won") return b.won - a.won || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });

  const total = partners.length;
  const active = partners.filter((p) => p.status === "active").length;
  const onboarding = partners.filter((p) => p.status === "onboarding").length;
  const inactive = partners.filter((p) => p.status === "inactive").length;
  const partnerUsers = partners.reduce((sum, p) => sum + p.users, 0);
  const signedInThisMonth = partners.filter(
    (p) => p.lastActiveAt !== null && daysBetween(p.lastActiveAt.slice(0, 10), today) <= 30,
  ).length;
  const protectedDeals = partners.reduce((sum, p) => sum + p.protectedCount, 0);
  const protectingPartners = partners.filter((p) => p.protectedCount > 0).length;

  const waitingApplications = applications.filter((a) => a.status === "new");
  const oldestApplicationDays = waitingApplications.reduce(
    (max, a) => Math.max(max, daysBetween(a.submittedAt.slice(0, 10), today)),
    0,
  );

  const filterApplications = (next: { astatus?: string; aq?: string }): void => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const select = (id: string): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const closeDetail = (): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("selected");
    router.replace(params.size > 0 ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  };

  const report = async (pending: Promise<ActionResult<unknown>>, success: string): Promise<boolean> => {
    const result = await pending;
    toast(result.ok ? success : result.error.message);
    return result.ok;
  };

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
        PARTNER_CATEGORY_LABEL[p.category],
        PARTNER_REGION_LABEL[p.region],
        PARTNER_STATUS_LABEL[p.status],
        p.pending,
        p.protectedCount,
        p.won,
        lastSeenLabel(p.lastActiveAt, today),
        p.managerName ?? "",
      ]),
    );
    toast(`Exported ${shown.length} ${shown.length === 1 ? "partner" : "partners"} to CSV`);
  };

  const onAdd = async (input: NewPartnerValues): Promise<string | null> => {
    const result = await createPartnerAction(input);
    if (!result.ok) return result.error.message;
    setDialog(null);
    setTab("Partners");
    setCategory("All");
    setRegion("All regions");
    setStatus("Any status");
    setQuery("");
    select(result.data.id);
    toast(input.sendInvite ? `Invite sent to ${input.adminEmail.trim()}` : `${result.data.name} added, invite not sent yet`);
    return null;
  };

  const tabs = partnerTabs(total, waiting, canReadApplications);

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
          {canManage ? (
            <button type="button" className="btn btn-p" onClick={() => setDialog("add")}>
              <Icon name="userplus" />
              Add partner
            </button>
          ) : null}
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
        {canReadApplications ? (
          <div className="kpi">
            <span className="kpi-l">Oldest application</span>
            <span className="kpi-v t-amber">
              {waitingApplications.length === 0 ? "None" : oldestApplicationDays === 0 ? "Today" : plural(oldestApplicationDays, "day")}
            </span>
            <span className="kpi-f">{waitingApplications.length === 0 ? "Nothing waiting" : "Still waiting for a decision"}</span>
          </div>
        ) : null}
        <div className="kpi">
          <span className="kpi-l">Partner users</span>
          <span className="kpi-v">{partnerUsers}</span>
          <span className="kpi-f">{signedInThisMonth} partners signed in this month</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Protected deals</span>
          <span className="kpi-v">{protectedDeals}</span>
          <span className="kpi-f">From {protectingPartners} partners</span>
        </div>
      </section>

      <div className="row">
        <section aria-label="Partners and applications" className="card clip" style={{ flex: "1 1 100%", minWidth: 0 }}>
          <div className="tabs" role="group" aria-label="View" style={{ padding: "0 8px" }}>
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
              selectedId={open?.id ?? ""}
              today={today}
              category={category}
              region={region}
              status={status}
              query={query}
              sort={sort}
              onQuery={setQuery}
              onSort={setSort}
              onCategory={setCategory}
              onRegion={setRegion}
              onStatus={setStatus}
              onSelect={select}
            />
          ) : (
            <ApplicationsTable
              applications={applications}
              status={searchParams.get("astatus") ?? ""}
              query={searchParams.get("aq") ?? ""}
              onFilter={filterApplications}
              waiting={waiting}
              canDecide={canDecide}
              onApprove={(a, choice) =>
                void report(
                  approveApplicationAction({ id: a.id, category: choice.category, region: choice.region }),
                  `Approved ${a.company}. Invite sent to ${a.applicantName}`,
                )
              }
              onDecline={(a, reason) =>
                void report(
                  declineApplicationAction({ id: a.id, reason }),
                  `Rejected ${a.company}. ${a.applicantName} has been emailed`,
                )
              }
              onUndo={(a) => void report(reopenApplicationAction({ id: a.id }), `${a.company} is back in the queue`)}
            />
          )}
        </section>

        {tab === "Partners" && open ? (
          <PartnerDetail
            key={open.id}
            partner={open}
            onClose={closeDetail}
            today={today}
            canManage={canManage}
            onChangeManager={() => setDialog("manager")}
            onChangeCategory={() => setDialog("category")}
            onResendInvites={() => {
              void (async () => {
                const result = await resendPartnerInvitesAction({ id: open.id });
                if (!result.ok) {
                  toast(result.error.message);
                  return;
                }
                const count = result.data.count;
                toast(
                  count > 0
                    ? `Invites resent to ${count} ${count === 1 ? "person" : "people"} at ${open.name}`
                    : `Everyone at ${open.name} has accepted their invite`,
                );
              })();
            }}
            onSuspend={() => void report(suspendPartnerAction({ id: open.id }), `${open.name} is suspended`)}
            onRestore={() => void report(restorePartnerAction({ id: open.id }), `Access restored for ${open.name}`)}
          />
        ) : null}
      </div>

      {dialog === "add" ? <AddPartnerDrawer partners={partners} onClose={() => setDialog(null)} onAdd={onAdd} /> : null}
      {dialog === "category" && detail ? (
        <CategoryDialog
          partner={detail}
          current={detail.category}
          onClose={() => setDialog(null)}
          onSave={(value) => {
            setDialog(null);
            void report(
              setPartnerCategoryAction({ id: detail.id, category: value }),
              `${detail.name} is now listed as ${PARTNER_CATEGORY_LABEL[value].toLowerCase()}`,
            );
          }}
        />
      ) : null}
      {dialog === "manager" && detail ? (
        <ManagerDialog
          partner={detail}
          currentId={detail.managerId}
          managers={managers}
          onClose={() => setDialog(null)}
          onSave={(managerId) => {
            setDialog(null);
            const name = managers.find((m) => m.id === managerId)?.name ?? "The new manager";
            void report(setPartnerManagerAction({ id: detail.id, managerId }), `${name} now manages ${detail.name}`);
          }}
        />
      ) : null}
    </div>
  );
}
