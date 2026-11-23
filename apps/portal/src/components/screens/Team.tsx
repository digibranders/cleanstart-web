"use client";

import { useState } from "react";
import { AccessRequests } from "@/components/people/AccessRequests";
import { EditMemberDrawer } from "@/components/people/EditMemberDrawer";
import { InviteCard } from "@/components/people/InviteCard";
import { RowAction } from "@/components/people/RowAction";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { ConfirmDialog, Dialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { isOneOf, PARTNER_ROLE_LABEL, PARTNER_ROLES, type PartnerRole } from "@/lib/domain";
import type { TeamDto, TeamMemberDto } from "@/lib/dto";
import { emailDomain, initialsOf, invitedLabel, lastSeenLabel, rowKey } from "@/lib/people";
import { filterTeam, type TeamFilter, type TeamSort } from "@/lib/team-list";
import { fmtShort } from "@/lib/dates";
import { partnerPermissionTable } from "@/server/auth/policies";
import { reactivateMemberAction } from "@/server/actions/member-edit";
import type { ActionResult } from "@/server/actions/result";
import {
  changeMemberRoleAction,
  removeMemberAction,
  resendInviteAction,
  revokeInviteAction,
} from "@/server/actions/team";
import { ScrollRegion } from "@/components/ui/scroll-region";

const ROLE_ORDER: readonly PartnerRole[] = ["sales", "technical", "partner_admin"];
const ROLE_OPTIONS: readonly DropdownOption[] = ROLE_ORDER.map((value) => ({ value, label: PARTNER_ROLE_LABEL[value] }));
const ROLE_TONE: Record<PartnerRole, BadgeTone> = {
  partner_admin: "violet",
  sales: "blue",
  technical: "cyan",
};
const AVATARS = ["av-1", "av-2", "av-3", "av-4"] as const;

const PERMISSIONS = partnerPermissionTable();

const ROLE_FILTERS: readonly DropdownOption[] = [{ value: "all", label: "All roles" }, ...ROLE_OPTIONS];
const STATUS_FILTERS: readonly DropdownOption[] = [
  { value: "all", label: "Any status" },
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
];
const SORT_OPTIONS: readonly DropdownOption[] = [
  { value: "default", label: "Sort: default" },
  { value: "name", label: "Sort: name" },
  { value: "last_active", label: "Sort: last active" },
];
const KEEP_WITH_COMPANY = "";

function Perm({ yes }: { yes: boolean }): React.JSX.Element {
  return <td className={`r ${yes ? "t-green" : "t-muted"}`}>{yes ? "Yes" : "No"}</td>;
}

export function Team({ team, today }: { team: TeamDto; today: string }): React.JSX.Element {
  const toast = useToast();
  const { members, requests } = team;
  const [removing, setRemoving] = useState<{ member: TeamMemberDto; moveTo: string } | null>(null);
  const [editing, setEditing] = useState<TeamMemberDto | null>(null);
  const [showRemoved, setShowRemoved] = useState(false);
  const [filter, setFilter] = useState<TeamFilter>({ q: "", role: "all", status: "all", sort: "default" });
  const visible = filterTeam(members, filter);

  // A failed action shows its safe message (for example "Every company needs at least one partner admin.").
  const report = async (pending: Promise<ActionResult<unknown>>, success?: string): Promise<void> => {
    const result = await pending;
    if (!result.ok) toast(result.error.message);
    else if (success) toast(success);
  };

  const [pendingRole, setPendingRole] = useState<{ member: TeamMemberDto; role: PartnerRole } | null>(null);

  const applyRole = (member: TeamMemberDto, role: PartnerRole): void =>
    void report(
      changeMemberRoleAction({ userId: member.id, role }),
      `${member.name} is now ${PARTNER_ROLE_LABEL[role].toLowerCase()}`,
    );

  // Gaining or losing partner admin changes who can invite and remove people, so it is confirmed first.
  const changeRole = (member: TeamMemberDto, role: PartnerRole): void => {
    if (role === "partner_admin" || member.role === "partner_admin") setPendingRole({ member, role });
    else applyRole(member, role);
  };

  // Someone who only has an invite has no account to remove: removing them withdraws the invite.
  const isInviteOnly = (member: TeamMemberDto): boolean => member.inviteId !== null && member.inviteId === member.id;

  // Who can take over a leaving person's deals: someone who stays, has a login and registers deals.
  const heirs = (member: TeamMemberDto): TeamMemberDto[] =>
    members.filter((m) => m.id !== member.id && m.status === "active" && m.role !== "technical" && !isInviteOnly(m));

  const remove = (member: TeamMemberDto, moveTo: string): void => {
    void report(
      isInviteOnly(member) && member.inviteId
        ? revokeInviteAction({ inviteId: member.inviteId })
        : removeMemberAction({ userId: member.id, ...(moveTo !== KEEP_WITH_COMPANY ? { moveDealsTo: moveTo } : {}) }),
    );
  };

  const reactivate = (id: string, name: string): void =>
    void report(reactivateMemberAction({ userId: id }), `${name} was sent a new invite`);

  const resend = (member: TeamMemberDto): void => {
    if (!member.inviteId) return;
    void report(resendInviteAction({ inviteId: member.inviteId }), `Invite resent to ${member.email}`);
  };

  const lastActive = (m: TeamMemberDto): string =>
    m.isYou ? "Now" : m.status === "invited" ? invitedLabel(m.invitedAt) : lastSeenLabel(m.lastActiveAt, today);

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Team</h1>
          <span className="h1-sub">
            Everyone at {team.partnerName} with a login. Deals stay with the company when someone leaves, or move to a colleague.
          </span>
        </div>
      </div>

      <AccessRequests requests={requests} today={today} />

      <div className="row">
        <section
          aria-labelledby="people"
          className="card clip"
          style={{ flex: "1 1 620px", minWidth: 0 }}
        >
          <div className="card-h">
            <h2 id="people" className="card-t">
              People
            </h2>
            <span className="card-meta tnum">
              {members.length} people, {members.filter((m) => m.status !== "active").length} invited
            </span>
          </div>
          <div className="toolbar">
            <div className="filters">
              <label className="sr" htmlFor="team-q">
                Search people
              </label>
              <input
                id="team-q"
                className="finput"
                type="search"
                placeholder="Search name or email"
                value={filter.q}
                onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
              />
              <Dropdown
                value={filter.role}
                options={ROLE_FILTERS}
                ariaLabel="Role"
                onChange={(v) => setFilter((f) => ({ ...f, role: v === "all" ? "all" : isOneOf(PARTNER_ROLES, v) ? v : f.role }))}
              />
              <Dropdown
                value={filter.status}
                options={STATUS_FILTERS}
                ariaLabel="Status"
                onChange={(v) => setFilter((f) => ({ ...f, status: v === "active" || v === "invited" ? v : "all" }))}
              />
              <Dropdown
                value={filter.sort}
                options={SORT_OPTIONS}
                ariaLabel="Sort"
                onChange={(v) => setFilter((f) => ({ ...f, sort: (v === "name" || v === "last_active" ? v : "default") as TeamSort }))}
              />
            </div>
            <button
              type="button"
              className={`btn btn-g${showRemoved ? " on" : ""}`}
              aria-pressed={showRemoved}
              onClick={() => setShowRemoved((v) => !v)}
            >
              Removed ({team.removed.length})
            </button>
          </div>
          <ScrollRegion label="Team members">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Role</th>
                  <th scope="col" className="hide-sm">
                    Status
                  </th>
                  <th scope="col" className="hide-sm">
                    Last active
                  </th>
                  <th scope="col" className="r hide-sm">
                    Deals
                  </th>
                  <th scope="col" className="r">
                    <span className="sr">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((m, i) => (
                  <tr key={m.id}>
                    <td style={{ whiteSpace: "normal" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className={`av av-r ${m.isYou ? "av-me" : (AVATARS[i % AVATARS.length] ?? "av-1")}`}>
                          {initialsOf(m.name)}
                        </span>
                        <span className="li-t">
                          <span className="li-n" style={{ fontSize: 13 }}>
                            {m.name}
                            {m.isYou ? (
                              <span className="t-muted" style={{ fontWeight: 500 }}>
                                {" "}
                                (you)
                              </span>
                            ) : null}
                          </span>
                          <span className="li-s" style={{ overflowWrap: "anywhere" }}>
                            {m.email}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td>
                      {m.isYou ? (
                        <Badge tone={ROLE_TONE[m.role]}>{PARTNER_ROLE_LABEL[m.role]}</Badge>
                      ) : (
                        <Dropdown
                          variant="rsel"
                          id={`role-${rowKey(m.email)}`}
                          ariaLabel={`Role for ${m.name}`}
                          value={m.role}
                          options={ROLE_OPTIONS}
                          onChange={(v) => {
                            if (isOneOf(PARTNER_ROLES, v) && v !== m.role) changeRole(m, v);
                          }}
                        />
                      )}
                    </td>
                    <td className="hide-sm">
                      <Badge tone={m.status === "active" ? "accepted" : "pending"}>
                        {m.status === "active" ? "Active" : "Invited"}
                      </Badge>
                    </td>
                    <td className="t-sec hide-sm">{lastActive(m)}</td>
                    <td className="tnum r hide-sm">{m.deals}</td>
                    <td className="r">
                      {m.isYou ? null : (
                        <span className="acts">
                          {isInviteOnly(m) ? null : (
                            <button
                              type="button"
                              className="btn btn-g"
                              style={{ height: 24, padding: "0 8px", fontSize: 12 }}
                              aria-label={`Edit ${m.name}`}
                              onClick={() => setEditing(m)}
                            >
                              Edit
                            </button>
                          )}
                          {m.status === "invited" ? (
                            <RowAction
                              label={`Resend invite to ${m.name}`}
                              tip="Resend invite"
                              icon="send"
                              onClick={() => resend(m)}
                            />
                          ) : null}
                          <RowAction
                            label={`Remove ${m.name}`}
                            tip="Remove access"
                            icon="trash"
                            tone="no"
                            onClick={() => setRemoving({ member: m, moveTo: KEEP_WITH_COMPANY })}
                          />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
          {visible.length === 0 ? (
            <p className="t-muted" style={{ margin: 0, padding: "14px 16px", fontSize: 13 }}>
              No one matches. Clear the search or filters.
            </p>
          ) : null}
          {showRemoved ? (
            <div style={{ borderTop: "1px solid var(--line, #ECEAF2)" }}>
              <h3 className="card-t" style={{ padding: "12px 16px 0", margin: 0 }}>
                Removed people
              </h3>
              {team.removed.length === 0 ? (
                <p className="t-muted" style={{ margin: 0, padding: "10px 16px 14px", fontSize: 13 }}>
                  Nobody has been removed.
                </p>
              ) : (
                <ScrollRegion label="Removed people">
                  <table className="tbl">
                    <tbody>
                      {team.removed.map((r) => (
                        <tr key={r.id}>
                          <td style={{ whiteSpace: "normal" }}>
                            <span className="li-t">
                              <span className="li-n" style={{ fontSize: 13 }}>
                                {r.name}
                              </span>
                              <span className="li-s" style={{ overflowWrap: "anywhere" }}>
                                {r.email}
                              </span>
                            </span>
                          </td>
                          <td className="t-sec hide-sm">
                            {PARTNER_ROLE_LABEL[r.role]}, removed {r.removedAt ? fmtShort(r.removedAt.slice(0, 10)) : ""}
                          </td>
                          <td className="r">
                            <button
                              type="button"
                              className="btn btn-s"
                              style={{ height: 26, padding: "0 10px", fontSize: 12 }}
                              aria-label={`Reactivate ${r.name}`}
                              onClick={() => reactivate(r.id, r.name)}
                            >
                              Reactivate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollRegion>
              )}
            </div>
          ) : null}
        </section>

        <aside style={{ flex: "0 1 320px", minWidth: 280, display: "flex", flexDirection: "column", gap: 12 }}>
          <InviteCard
            existingEmails={members.map((m) => m.email)}
            partnerDomain={emailDomain(members.find((m) => m.isYou)?.email ?? "")}
          />
          <section aria-labelledby="roles" className="card clip">
            <div className="card-h">
              <h2 id="roles" className="card-t">
                What each role can do
              </h2>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  <th scope="col" className="r">
                    Admin
                  </th>
                  <th scope="col" className="r">
                    Sales
                  </th>
                  <th scope="col" className="r">
                    Tech
                  </th>
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map(({ label, roles }) => (
                  <tr key={label}>
                    <td style={{ whiteSpace: "normal" }}>{label}</td>
                    <Perm yes={roles.partner_admin} />
                    <Perm yes={roles.sales} />
                    <Perm yes={roles.technical} />
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </aside>
      </div>

      {editing ? <EditMemberDrawer key={editing.id} member={editing} onClose={() => setEditing(null)} /> : null}

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={removing ? `Remove ${removing.member.name}?` : ""}
        footer={
          <>
            <button type="button" className="btn btn-s" onClick={() => setRemoving(null)}>
              Keep {removing?.member.name.split(" ")[0] ?? "them"}
            </button>
            <button
              type="button"
              className="btn btn-dd"
              onClick={() => {
                if (removing) remove(removing.member, removing.moveTo);
                setRemoving(null);
              }}
            >
              Remove access
            </button>
          </>
        }
      >
        <p style={{ margin: 0, lineHeight: 1.55 }}>
          They lose access at once and are signed out. You can reactivate them later from the Removed list.
        </p>
        {removing && !isInviteOnly(removing.member) && removing.member.deals > 0 ? (
          <div className="fg" style={{ marginTop: 14 }}>
            <label htmlFor="move-deals" className="lbl">
              Move their {removing.member.deals} {removing.member.deals === 1 ? "deal" : "deals"} to
            </label>
            <select
              id="move-deals"
              className="field"
              value={removing.moveTo}
              onChange={(e) => setRemoving((r) => (r ? { ...r, moveTo: e.target.value } : r))}
            >
              <option value={KEEP_WITH_COMPANY}>Leave with the company</option>
              {heirs(removing.member).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}, {PARTNER_ROLE_LABEL[m.role]}
                </option>
              ))}
            </select>
            <span className="hint">Only who owns the deals changes. Their status stays as it is.</span>
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={pendingRole !== null}
        onClose={() => setPendingRole(null)}
        onConfirm={() => pendingRole && applyRole(pendingRole.member, pendingRole.role)}
        title={pendingRole ? `Make ${pendingRole.member.name} ${PARTNER_ROLE_LABEL[pendingRole.role].toLowerCase()}?` : ""}
        body={
          pendingRole?.role === "partner_admin"
            ? "Partner admins can invite and remove people and edit the company profile."
            : "They will no longer be able to invite or remove people or edit the company profile."
        }
        confirmLabel="Change role"
      />
    </div>
  );
}
