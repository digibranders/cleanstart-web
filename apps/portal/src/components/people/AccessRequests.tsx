"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { fmtShort } from "@/lib/dates";
import { ACCESS_REQUEST_ROLES, type AccessRequestRole, PARTNER_ROLE_LABEL } from "@/lib/domain";
import type { AccessRequestDto } from "@/lib/dto";
import { codeFromLabel, emailDomain, initialsOf } from "@/lib/people";
import { decideAccessRequestAction } from "@/server/actions/team";
import { RowAction } from "./RowAction";
import { Seg } from "./Seg";

const REQUEST_ROLES: readonly string[] = ACCESS_REQUEST_ROLES.map((role) => PARTNER_ROLE_LABEL[role]);

export function AccessRequests({
  requests,
  today,
}: {
  requests: AccessRequestDto[];
  today: string;
}): React.JSX.Element | null {
  const toast = useToast();
  // The role the admin picked per request; until then the role the person asked for.
  const [picked, setPicked] = useState<Record<string, AccessRequestRole>>({});
  if (requests.length === 0) return null;

  const roleOf = (rq: AccessRequestDto): AccessRequestRole => picked[rq.id] ?? rq.role;

  const approve = async (rq: AccessRequestDto): Promise<void> => {
    const result = await decideAccessRequestAction({ id: rq.id, decision: "approve", role: roleOf(rq) });
    toast(result.ok ? `${rq.name} can now set a password and sign in` : result.error.message);
  };

  const decline = async (rq: AccessRequestDto): Promise<void> => {
    const result = await decideAccessRequestAction({ id: rq.id, decision: "decline" });
    toast(result.ok ? `Request declined. ${rq.name} gets an email.` : result.error.message);
  };

  const asked = (rq: AccessRequestDto): string =>
    rq.requestedAt.slice(0, 10) === today ? "Asked today" : `Asked ${fmtShort(rq.requestedAt.slice(0, 10))}`;

  return (
    <section
      aria-labelledby="reqs"
      className="card clip"
      style={{ borderColor: "#E3DDFA" }}
    >
      <div className="card-h" style={{ background: "#FAF8FF" }}>
        <h2 id="reqs" className="card-t">
          Access requests
        </h2>
        <span className="card-meta">
          People at {emailDomain(requests[0]?.email ?? "")} who asked for a login
        </span>
      </div>
      {requests.map((rq) => (
        <div
          key={rq.id}
          className="li"
          style={{ padding: "10px 12px", alignItems: "flex-start", flexWrap: "wrap", gap: "10px 12px" }}
        >
          <span className="av av-1 av-r">{initialsOf(rq.name)}</span>
          <span className="li-t" style={{ flex: "1 1 260px" }}>
            <span className="li-n" style={{ fontSize: 13 }}>
              {rq.name} <span className="t-muted" style={{ fontWeight: 500 }}>{rq.email}</span>
            </span>
            <span className="li-s" style={{ whiteSpace: "normal" }}>
              {asked(rq)}.{rq.note ? ` "${rq.note}"` : ""}
            </span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <Seg
              options={REQUEST_ROLES}
              value={PARTNER_ROLE_LABEL[roleOf(rq)]}
              onChange={(label) => {
                const code = codeFromLabel(PARTNER_ROLE_LABEL, label);
                if (code === "sales" || code === "technical") setPicked((prev) => ({ ...prev, [rq.id]: code }));
              }}
              ariaLabel={`Role for ${rq.name}`}
              compact
            />
            <span className="acts">
              <RowAction label={`Decline ${rq.name}`} tip="Decline" icon="x" tone="no" onClick={() => void decline(rq)} />
              <RowAction
                label={`Approve ${rq.name}`}
                tip="Approve and send a login link"
                icon="check"
                tone="ok"
                onClick={() => void approve(rq)}
              />
            </span>
          </span>
        </div>
      ))}
    </section>
  );
}
