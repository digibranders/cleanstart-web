"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { AccessRequests } from "@/components/people/AccessRequests";
import { InviteCard } from "@/components/people/InviteCard";
import { RowAction } from "@/components/people/RowAction";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { isOneOf, PARTNER_ROLE_LABEL, PARTNER_ROLES, type PartnerRole } from "@/lib/domain";
import type { TeamDto, TeamMemberDto } from "@/lib/dto";
import { initialsOf, invitedLabel, lastSeenLabel, rowKey } from "@/lib/people";
import type { ActionResult } from "@/server/actions/result";
import {
  changeMemberRoleAction,
  removeMemberAction,
  resendInviteAction,
  revokeInviteAction,
} from "@/server/actions/team";

const ROLE_ORDER: readonly PartnerRole[] = ["sales", "technical", "partner_admin"];
const ROLE_OPTIONS: readonly DropdownOption[] = ROLE_ORDER.map((value) => ({ value, label: PARTNER_ROLE_LABEL[value] }));
const ROLE_TONE: Record<PartnerRole, BadgeTone> = {
  partner_admin: "violet",
  sales: "blue",
  technical: "cyan",
};
const AVATARS = ["av-1", "av-2", "av-3", "av-4"] as const;

const PERMISSIONS: ReadonlyArray<readonly [string, boolean, boolean, boolean]> = [
  ["Register and track deals", true, true, false],
  ["Open documents", true, true, true],
  ["Invite or remove people", true, false, false],
  ["Edit company profile", true, false, false],
];

function Perm({ yes }: { yes: boolean }): React.JSX.Element {
  return <td className={`r ${yes ? "t-green" : "t-muted"}`}>{yes ? "Yes" : "No"}</td>;
}

export function Team({ team, today }: { team: TeamDto; today: string }): React.JSX.Element {
  const toast = useToast();
  const { members, requests } = team;
  const [confirming, setConfirming] = useState<string | null>(null);

  // A failed action shows its safe message (for example "Every company needs at least one partner admin.").
  const report = async (pending: Promise<ActionResult<unknown>>, success?: string): Promise<void> => {
    const result = await pending;
    if (!result.ok) toast(result.error.message);
    else if (success) toast(success);
  };

  const changeRole = (member: TeamMemberDto, role: PartnerRole): void =>
    void report(changeMemberRoleAction({ userId: member.id, role }));

  // Someone who only has an invite has no account to remove: removing them withdraws the invite.
  const isInviteOnly = (member: TeamMemberDto): boolean => member.inviteId !== null && member.inviteId === member.id;

  const remove = (member: TeamMemberDto): void => {
    setConfirming(null);
    void report(
      isInviteOnly(member) && member.inviteId
        ? revokeInviteAction({ inviteId: member.inviteId })
        : removeMemberAction({ userId: member.id }),
    );
  };

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
            Everyone at {team.partnerName} with a login. Deals stay with the company when someone leaves.
          </span>
        </div>
      </div>

      <AccessRequests requests={requests} today={today} />

      <div className="row">
        <section
          aria-labelledby="people"
          className="card clip"
          style={{ flex: "1 1 620px", minWidth: 0 }}
          data-tour="team-members"
        >
          <div className="card-h">
            <h2 id="people" className="card-t">
              People
            </h2>
            <span className="card-meta tnum">
              {members.length} people, {members.filter((m) => m.status !== "active").length} invited
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last active</th>
                  <th scope="col" className="r">
                    Deals
                  </th>
                  <th scope="col" className="r">
                    <span className="sr">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={m.id}>
                    <td>
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
                          <span className="li-s">{m.email}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      {m.isYou || m.status === "invited" ? (
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
                    <td>
                      <Badge tone={m.status === "active" ? "accepted" : "pending"}>
                        {m.status === "active" ? "Active" : "Invited"}
                      </Badge>
                    </td>
                    <td className="t-sec">{lastActive(m)}</td>
                    <td className="tnum r">{m.deals}</td>
                    <td className="r">
                      {m.isYou ? null : confirming === m.id ? (
                        <span className="confirm">
                          <button
                            type="button"
                            className="btn btn-dd"
                            onClick={() => remove(m)}
                            aria-label={`Confirm: remove access for ${m.name}`}
                            style={{ height: 24, padding: "0 8px", fontSize: 12 }}
                          >
                            Remove access
                          </button>
                          <button
                            type="button"
                            className="ibtn"
                            onClick={() => setConfirming(null)}
                            aria-label={`Keep ${m.name}`}
                            title="Cancel"
                            style={{ width: 24, height: 24 }}
                          >
                            <Icon name="x" />
                          </button>
                        </span>
                      ) : (
                        <span className="acts">
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
                            onClick={() => setConfirming(m.id)}
                          />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside style={{ flex: "0 1 320px", minWidth: 280, display: "flex", flexDirection: "column", gap: 12 }}>
          <InviteCard existingEmails={members.map((m) => m.email)} />
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
                {PERMISSIONS.map(([action, admin, sales, tech]) => (
                  <tr key={action}>
                    <td style={{ whiteSpace: "normal" }}>{action}</td>
                    <Perm yes={admin} />
                    <Perm yes={sales} />
                    <Perm yes={tech} />
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </aside>
      </div>
    </div>
  );
}
