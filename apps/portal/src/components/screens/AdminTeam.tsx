"use client";

import { useCallback, useState } from "react";
import { Icon } from "@/components/icon";
import { RowAction } from "@/components/people/RowAction";
import { StaffInviteDrawer } from "@/components/people/StaffInviteDrawer";
import { Badge } from "@/components/ui/badge";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { appendAudit } from "@/data/audit";
import { initialsOf, rowKey, type StaffMember, type StaffRole, staffSlice } from "@/data/team";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";

const ROLES: readonly StaffRole[] = ["Partner manager", "Sales", "Marketing"];

// [action, partner manager, sales, marketing]
const PERMISSIONS: ReadonlyArray<readonly [string, string, string, string]> = [
  ["Approve or reject a deal", "Yes", "Own region", "No"],
  ["See deals", "All partners", "Own region", "No"],
  ["Register a deal for a partner", "Yes", "No", "No"],
  ["Approve applications and set tier", "Yes", "No", "No"],
  ["Invite or remove partner users", "Any partner", "No", "No"],
  ["Publish documents", "Yes", "No", "Yes"],
  ["Download documents", "Yes", "Yes", "Yes"],
];

function isStaffRole(value: string): value is StaffRole {
  return (ROLES as readonly string[]).includes(value);
}

function roleToast(name: string, role: StaffRole): string {
  const phrase = role === "Sales" ? "in sales" : role === "Marketing" ? "in marketing" : "a partner manager";
  return `${name} is now ${phrase}`;
}

export function AdminTeam(): React.JSX.Element {
  const toast = useToast();
  const people = staffSlice.use();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [warnFor, setWarnFor] = useState<string | null>(null);
  const closeInvite = useCallback((): void => setInviteOpen(false), []);

  const changeRole = (person: StaffMember, role: StaffRole): void => {
    staffSlice.set((prev) => prev.map((p) => (p.email === person.email ? { ...p, role } : p)));
    setWarnFor(person.partners.length > 0 && role !== "Partner manager" ? person.name : null);
    appendAudit({
      actor: "Farhan Qureshi",
      action: "Changed a role",
      target: `${person.name}, CleanStart team`,
      detail: `${person.role} to ${role}.`,
      source: "Portal",
    });
    toast(roleToast(person.name, role));
  };

  const remove = (person: StaffMember): void => {
    staffSlice.set((prev) => prev.filter((p) => p.email !== person.email));
    setConfirming(null);
    appendAudit({
      actor: "Farhan Qureshi",
      action: "Removed a teammate",
      target: `${person.name}, ${person.role.toLowerCase()}, ${person.region}`,
      source: "Portal",
    });
    toast(`Removed access for ${person.name}`);
  };

  const warned = people.find((p) => p.name === warnFor && p.role !== "Partner manager");

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">CleanStart team</h1>
          <span className="h1-sub">
            People at CleanStart who use this admin. A role decides what each person can see and do.
          </span>
        </div>
        <button type="button" className="btn btn-p" onClick={() => setInviteOpen(true)} data-tour="staff-add">
          <Icon name="userplus" />
          Invite teammate
        </button>
      </div>

      <section aria-labelledby="ppl" className="card clip" data-tour="staff-table">
        <div className="card-h">
          <h2 id="ppl" className="card-t">
            People
          </h2>
          <span className="card-meta tnum">
            {people.length} people, {people.filter((p) => p.status === "Invited").length} invited
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Role</th>
                <th scope="col">Region</th>
                <th scope="col">Partners managed</th>
                <th scope="col">Last active</th>
                <th scope="col">Status</th>
                <th scope="col" className="r">
                  <span className="sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.email}>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="av av-1 av-r">{initialsOf(p.name)}</span>
                      <span className="li-t">
                        <span className="li-n" style={{ fontSize: 13 }}>
                          {p.name}
                          {p.you ? (
                            <>
                              {" "}
                              <span className="t-muted" style={{ fontWeight: 500 }}>
                                (you)
                              </span>
                            </>
                          ) : null}
                        </span>
                        <span className="li-s">{p.email}</span>
                      </span>
                    </span>
                  </td>
                  <td>
                    {p.you ? (
                      <Badge tone="neutral">{p.role}</Badge>
                    ) : (
                      <Dropdown
                        variant="rsel"
                        id={`trole-${rowKey(p.email)}`}
                        ariaLabel={`Role for ${p.name}`}
                        value={p.role}
                        options={ROLES}
                        onChange={(v) => {
                          if (isStaffRole(v) && v !== p.role) changeRole(p, v);
                        }}
                      />
                    )}
                  </td>
                  <td className="t-sec">{p.region}</td>
                  <td className="t-sec" title={p.partners.join(", ")}>
                    {p.partners.length ? `${p.partners.length} partners` : "None"}
                  </td>
                  <td className="t-sec">{p.last}</td>
                  <td>
                    <Badge tone={p.status === "Active" ? "accepted" : "pending"}>{p.status}</Badge>
                  </td>
                  <td className="r">
                    {p.you ? null : confirming === p.email ? (
                      <span className="acts">
                        <button
                          type="button"
                          className="btn btn-dd"
                          onClick={() => remove(p)}
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
                      <RowAction
                        label={`Remove access for ${p.name}`}
                        tip="Remove access"
                        icon="trash"
                        tone="no"
                        onClick={() => setConfirming(p.email)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {warned ? (
          <div className="card-b" style={{ borderTop: "1px solid #F0EFF4" }}>
            <div className="note note-amber" role="status">
              <Icon name="warn" />
              <span>
                {warned.name} still manages {warned.partners.length} partners in {warned.region}. Those partners
                need a new partner manager.{" "}
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

      <StaffInviteDrawer open={inviteOpen} onClose={closeInvite} />
    </div>
  );
}
