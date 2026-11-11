"use client";

import { useToast } from "@/components/ui/toast";
import { appendAudit } from "@/data/audit";
import { type AccessRequest, initialsOf, teamSlice } from "@/data/team";
import { RowAction } from "./RowAction";
import { Seg } from "./Seg";

const REQUEST_ROLES = ["Sales", "Technical"] as const;

export function AccessRequests({ requests }: { requests: AccessRequest[] }): React.JSX.Element | null {
  const toast = useToast();
  if (requests.length === 0) return null;

  const setRole = (email: string, role: AccessRequest["role"]): void =>
    teamSlice.set((prev) => ({
      ...prev,
      requests: prev.requests.map((r) => (r.email === email ? { ...r, role } : r)),
    }));

  const approve = (rq: AccessRequest): void => {
    teamSlice.set((prev) => ({
      requests: prev.requests.filter((r) => r.email !== rq.email),
      members: [
        ...prev.members,
        { name: rq.name, email: rq.email, role: rq.role, status: "Invited", last: "Approved today", deals: 0 },
      ],
    }));
    appendAudit({
      actor: "Aditi Rao",
      action: "Approved an access request",
      target: `${rq.name}, ${rq.role.toLowerCase()}, at Kestrel Systems`,
      source: "Portal",
    });
    toast(`${rq.name} can now set a password and sign in`);
  };

  const decline = (rq: AccessRequest): void => {
    teamSlice.set((prev) => ({ ...prev, requests: prev.requests.filter((r) => r.email !== rq.email) }));
    appendAudit({
      actor: "Aditi Rao",
      action: "Declined an access request",
      target: `${rq.name}, at Kestrel Systems`,
      source: "Portal",
    });
    toast(`Request declined. ${rq.name} gets an email.`);
  };

  return (
    <section
      aria-labelledby="reqs"
      className="card clip"
      style={{ borderColor: "#E3DDFA" }}
      data-tour="team-requests"
    >
      <div className="card-h" style={{ background: "#FAF8FF" }}>
        <h2 id="reqs" className="card-t">
          Access requests
        </h2>
        <span className="card-meta">People at kestrelsystems.in who asked for a login</span>
      </div>
      {requests.map((rq) => (
        <div
          key={rq.email}
          className="li"
          style={{ padding: "10px 12px", alignItems: "flex-start", flexWrap: "wrap", gap: "10px 12px" }}
        >
          <span className="av av-1 av-r">{initialsOf(rq.name)}</span>
          <span className="li-t" style={{ flex: "1 1 260px" }}>
            <span className="li-n" style={{ fontSize: 13 }}>
              {rq.name} <span className="t-muted" style={{ fontWeight: 500 }}>{rq.email}</span>
            </span>
            <span className="li-s" style={{ whiteSpace: "normal" }}>
              {rq.when}. "{rq.note}"
            </span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <Seg
              options={REQUEST_ROLES}
              value={rq.role}
              onChange={(role) => setRole(rq.email, role)}
              ariaLabel={`Role for ${rq.name}`}
              compact
            />
            <span className="acts">
              <RowAction label={`Decline ${rq.name}`} tip="Decline" icon="x" tone="no" onClick={() => decline(rq)} />
              <RowAction
                label={`Approve ${rq.name}`}
                tip="Approve and send a login link"
                icon="check"
                tone="ok"
                onClick={() => approve(rq)}
              />
            </span>
          </span>
        </div>
      ))}
    </section>
  );
}
