"use client";

import { useState } from "react";
import { AccessRequests } from "@/components/people/AccessRequests";
import { InviteCard } from "@/components/people/InviteCard";
import { Icon } from "@/components/icon";
import { RowAction } from "@/components/people/RowAction";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { appendAudit } from "@/data/audit";
import { initialsOf, type PartnerRole, rowKey, type TeamMember, teamSlice } from "@/data/team";

const ROLES: readonly PartnerRole[] = ["Sales", "Technical", "Partner admin"];
const ROLE_TONE: Record<PartnerRole, BadgeTone> = {
  "Partner admin": "violet",
  Sales: "blue",
  Technical: "cyan",
};
const AVATARS = ["av-1", "av-2", "av-3", "av-4"] as const;

const PERMISSIONS: ReadonlyArray<readonly [string, boolean, boolean, boolean]> = [
  ["Register and track deals", true, true, false],
  ["Open documents", true, true, true],
  ["Invite or remove people", true, false, false],
  ["Edit company profile", true, false, false],
];

function isRole(value: string): value is PartnerRole {
  return (ROLES as readonly string[]).includes(value);
}

function Perm({ yes }: { yes: boolean }): React.JSX.Element {
  return <td className={`r ${yes ? "t-green" : "t-muted"}`}>{yes ? "Yes" : "No"}</td>;
}

export function Team(): React.JSX.Element {
  const toast = useToast();
  const { members, requests } = teamSlice.use();
  const [confirming, setConfirming] = useState<string | null>(null);

  const changeRole = (member: TeamMember, role: PartnerRole): void => {
    teamSlice.set((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.email === member.email ? { ...m, role } : m)),
    }));
    appendAudit({
      actor: "Aditi Rao",
      action: "Changed a role",
      target: `${member.name}, at Kestrel Systems`,
      detail: `${member.role} to ${role}.`,
      source: "Portal",
    });
  };

  const remove = (member: TeamMember): void => {
    teamSlice.set((prev) => ({ ...prev, members: prev.members.filter((m) => m.email !== member.email) }));
    setConfirming(null);
    appendAudit({
      actor: "Aditi Rao",
      action: "Removed a user",
      target: `${member.name}, ${member.role.toLowerCase()}, at Kestrel Systems`,
      source: "Portal",
    });
  };

  const resend = (member: TeamMember): void => {
    appendAudit({
      actor: "Aditi Rao",
      action: "Resent an invite",
      target: `${member.name}, at Kestrel Systems`,
      source: "Portal",
    });
    toast(`Invite resent to ${member.email}`);
  };

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Team</h1>
          <span className="h1-sub">
            Everyone at Kestrel Systems with a login. Deals stay with the company when someone leaves.
          </span>
        </div>
      </div>

      <AccessRequests requests={requests} />

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
              {members.length} people, {members.filter((m) => m.status !== "Active").length} invited
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
                  <tr key={m.email}>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className={`av av-r ${m.you ? "av-me" : (AVATARS[i % AVATARS.length] ?? "av-1")}`}>
                          {initialsOf(m.name)}
                        </span>
                        <span className="li-t">
                          <span className="li-n" style={{ fontSize: 13 }}>
                            {m.name}
                            {m.you ? (
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
                      {m.you ? (
                        <Badge tone={ROLE_TONE[m.role]}>{m.role}</Badge>
                      ) : (
                        <Dropdown
                          variant="rsel"
                          id={`role-${rowKey(m.email)}`}
                          ariaLabel={`Role for ${m.name}`}
                          value={m.role}
                          options={ROLES}
                          onChange={(v) => {
                            if (isRole(v) && v !== m.role) changeRole(m, v);
                          }}
                        />
                      )}
                    </td>
                    <td>
                      <Badge tone={m.status === "Active" ? "accepted" : "pending"}>{m.status}</Badge>
                    </td>
                    <td className="t-sec">{m.last}</td>
                    <td className="tnum r">{m.deals}</td>
                    <td className="r">
                      {m.you ? null : confirming === m.email ? (
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
                          {m.status === "Invited" ? (
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
                            onClick={() => setConfirming(m.email)}
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
          <InviteCard />
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
