"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Icon } from "@/components/icon";
import { RowAction } from "@/components/people/RowAction";
import { StaffInviteDrawer } from "@/components/people/StaffInviteDrawer";
import { Badge } from "@/components/ui/badge";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { MultiDropdown } from "@/components/ui/multi-dropdown";
import { ConfirmDialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { isOneOf, STAFF_ROLE_LABEL, STAFF_ROLES, type StaffRole, type StaffScope } from "@/lib/domain";
import type { StaffMemberDto } from "@/lib/dto";
import { initialsOf, lastSeenLabel, rowKey } from "@/lib/people";
import { ROUTES } from "@/lib/routes";
import type { ActionResult } from "@/server/actions/result";
import {
  changeStaffRegionAction,
  changeStaffRoleAction,
  removeStaffAction,
  resendStaffInviteAction,
} from "@/server/actions/staff";
import { useRegions } from "@/components/regions-context";
import { ScrollRegion } from "@/components/ui/scroll-region";
import { scopeCovers, scopeLabel as labelOf } from "@/lib/regions";

const ROLE_OPTIONS: readonly DropdownOption[] = STAFF_ROLES.map((value) => ({ value, label: STAFF_ROLE_LABEL[value] }));

// [action, partner manager, sales, marketing]
const PERMISSIONS: ReadonlyArray<readonly [string, string, string, string]> = [
  ["Approve or reject a deal", "Yes", "Own regions", "No"],
  ["See deals", "All partners", "Own regions", "No"],
  ["Register a deal for a partner", "Yes", "No", "No"],
  ["Approve applications and set tier", "Yes", "No", "No"],
  ["Invite or remove partner users", "Any partner", "No", "No"],
  ["Publish documents", "Yes", "No", "Yes"],
  ["Download documents", "Yes", "Yes", "Yes"],
];

function roleToast(name: string, role: StaffRole): string {
  const phrase = role === "sales" ? "in sales" : role === "marketing" ? "in marketing" : "a partner manager";
  return `${name} is now ${phrase}`;
}

export function AdminTeam({ people, today }: { people: StaffMemberDto[]; today: string }): React.JSX.Element {
  const toast = useToast();
  const { regions } = useRegions();
  const scopeLabel = (scope: StaffScope): string => labelOf(scope, regions);
  // The regions to offer: active ones, plus any inactive one the person already covers.
  const scopeOptions = (current: StaffScope): { key: string; label: string }[] =>
    regions.filter((r) => r.active || scopeCovers(current, r.key)).map((r) => ({ key: r.key, label: r.name }));
  const [confirming, setConfirming] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const closeInvite = useCallback((): void => setInviteOpen(false), []);

  const report = async (pending: Promise<ActionResult<unknown>>): Promise<boolean> => {
    const result = await pending;
    if (!result.ok) toast(result.error.message);
    return result.ok;
  };

  const [pendingRole, setPendingRole] = useState<{ person: StaffMemberDto; role: StaffRole } | null>(null);

  const changeRegions = async (person: StaffMemberDto, scope: StaffScope): Promise<void> => {
    const next = scope === "all" ? ["all"] : scope;
    if (await report(changeStaffRegionAction({ userId: person.id, regions: next }))) {
      toast(`${person.name} now covers ${scopeLabel(scope)}`);
    }
  };

  const resend = async (person: StaffMemberDto): Promise<void> => {
    if (!person.inviteId) return;
    if (await report(resendStaffInviteAction({ inviteId: person.inviteId }))) toast(`Invite resent to ${person.email}`);
  };

  const changeRole = async (person: StaffMemberDto, role: StaffRole): Promise<void> => {
    if (!(await report(changeStaffRoleAction({ userId: person.id, role })))) return;
    toast(roleToast(person.name, role));
  };

  const remove = async (person: StaffMemberDto): Promise<void> => {
    setConfirming(null);
    if (await report(removeStaffAction({ id: person.id }))) toast(`Removed access for ${person.name}`);
  };

  const lastActive = (p: StaffMemberDto): string =>
    p.isYou ? "Now" : p.status === "invited" ? "Invite pending" : lastSeenLabel(p.lastActiveAt, today);

  // Derived from the data so it survives a refresh: anyone no longer a partner manager who still has partners.
  const warned = people.find((p) => p.role !== "partner_manager" && p.partners.length > 0);

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">CleanStart team</h1>
          <span className="h1-sub">
            People at CleanStart who use this admin. A role decides what each person can see and do.
          </span>
        </div>
        <button type="button" className="btn btn-p" onClick={() => setInviteOpen(true)}>
          <Icon name="userplus" />
          Invite teammate
        </button>
      </div>

      <section aria-labelledby="ppl" className="card clip">
        <div className="card-h">
          <h2 id="ppl" className="card-t">
            People
          </h2>
          <span className="card-meta tnum">
            {people.length} people, {people.filter((p) => p.status === "invited").length} invited
          </span>
        </div>
        <ScrollRegion label="Staff">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Role</th>
                <th scope="col" className="hide-sm">
                  Region
                </th>
                <th scope="col" className="hide-sm">
                  Partners managed
                </th>
                <th scope="col" className="hide-sm">
                  Last active
                </th>
                <th scope="col" className="hide-sm">
                  Status
                </th>
                <th scope="col" className="r">
                  <span className="sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id}>
                  <td style={{ whiteSpace: "normal" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="av av-1 av-r">{initialsOf(p.name)}</span>
                      <span className="li-t">
                        <span className="li-n" style={{ fontSize: 13 }}>
                          {p.name}
                          {p.isYou ? (
                            <>
                              {" "}
                              <span className="t-muted" style={{ fontWeight: 500 }}>
                                (you)
                              </span>
                            </>
                          ) : null}
                        </span>
                        <span className="li-s" style={{ overflowWrap: "anywhere" }}>
                          {p.email}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td>
                    {p.isYou || p.status === "invited" ? (
                      <Badge tone="neutral">{STAFF_ROLE_LABEL[p.role]}</Badge>
                    ) : (
                      <Dropdown
                        variant="rsel"
                        id={`trole-${rowKey(p.email)}`}
                        ariaLabel={`Role for ${p.name}`}
                        value={p.role}
                        options={ROLE_OPTIONS}
                        onChange={(v) => {
                          if (isOneOf(STAFF_ROLES, v) && v !== p.role) setPendingRole({ person: p, role: v });
                        }}
                      />
                    )}
                  </td>
                  <td className="t-sec hide-sm">
                    {p.isYou || p.status === "invited" ? (
                      scopeLabel(p.regions)
                    ) : (
                      <MultiDropdown
                        variant="rsel"
                        id={`tregion-${rowKey(p.email)}`}
                        ariaLabel={`Regions for ${p.name}`}
                        value={p.regions}
                        summary={scopeLabel(p.regions)}
                        options={scopeOptions(p.regions)}
                        onCommit={(next) => void changeRegions(p, next)}
                      />
                    )}
                  </td>
                  <td className="t-sec hide-sm" title={p.partners.join(", ")}>
                    {p.partners.length ? `${p.partners.length} partners` : "None"}
                  </td>
                  <td className="t-sec hide-sm">{lastActive(p)}</td>
                  <td className="hide-sm">
                    <Badge tone={p.status === "active" ? "accepted" : "pending"}>
                      {p.status === "active" ? "Active" : "Invited"}
                    </Badge>
                  </td>
                  <td className="r">
                    {p.isYou ? null : confirming === p.id ? (
                      <span className="acts">
                        <button
                          type="button"
                          className="btn btn-dd"
                          onClick={() => void remove(p)}
                          style={{ height: 26, padding: "0 8px", fontSize: 12 }}
                        >
                          Remove access
                        </button>
                        <button
                          type="button"
                          className="act"
                          onClick={() => setConfirming(null)}
                          aria-label={`Keep ${p.name}`}
                          data-tip="Cancel"
                        >
                          <Icon name="x" />
                        </button>
                      </span>
                    ) : (
                      <span className="acts">
                        {p.status === "invited" ? (
                          <RowAction
                            label={`Resend invite to ${p.name}`}
                            tip="Resend invite"
                            icon="send"
                            onClick={() => void resend(p)}
                          />
                        ) : null}
                        <RowAction
                          label={`Remove access for ${p.name}`}
                          tip="Remove access"
                          icon="trash"
                          tone="no"
                          onClick={() => setConfirming(p.id)}
                        />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
        {warned ? (
          <div className="card-b" style={{ borderTop: "1px solid #F0EFF4" }}>
            <div className="note note-amber" role="status">
              <Icon name="warn" />
              <span>
                {warned.name} still manages {warned.partners.length} partners in {scopeLabel(warned.regions)}.
                Those partners need a new partner manager.{" "}
                <Link href={ROUTES.admin.partners} style={{ fontWeight: 600 }}>
                  Reassign on Partners
                </Link>
              </span>
            </div>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="perm" className="card clip">
        <div className="card-h">
          <h2 id="perm" className="card-t">
            What each role can do
          </h2>
          <span className="card-meta">Partner accounts never reach this admin or the website CMS</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Action</th>
              <th scope="col">Partner manager</th>
              <th scope="col">Sales</th>
              <th scope="col">Marketing</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map(([action, ...cells]) => (
              <tr key={action}>
                <td>{action}</td>
                {cells.map((cell, i) => (
                  <td key={`${action}-${i}`} className={cell === "No" ? "t-muted" : "t-green"}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <ConfirmDialog
        open={pendingRole !== null}
        onClose={() => setPendingRole(null)}
        onConfirm={() => pendingRole && void changeRole(pendingRole.person, pendingRole.role)}
        title={pendingRole ? `Change ${pendingRole.person.name} to ${STAFF_ROLE_LABEL[pendingRole.role].toLowerCase()}?` : ""}
        body="Their access to deals, partners and documents changes straight away."
        confirmLabel="Change role"
      />

      <StaffInviteDrawer open={inviteOpen} onClose={closeInvite} existingEmails={people.map((p) => p.email)} />
    </div>
  );
}
