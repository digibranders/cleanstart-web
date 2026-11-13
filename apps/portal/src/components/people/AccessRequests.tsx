"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { fmtShort } from "@/lib/dates";
import { ACCESS_REQUEST_ROLES, type AccessRequestRole, PARTNER_ROLE_LABEL } from "@/lib/domain";
import type { AccessRequestDto } from "@/lib/dto";
import { codeFromLabel, emailDomain, initialsOf } from "@/lib/people";
import { decideAccessRequestAction } from "@/server/actions/team";
import { Seg } from "./Seg";

// The row's `.li .btn` rule shrinks buttons to 18px, so the standard size is set here.
const BUTTON_STYLE = { height: 30, padding: "0 10px", fontSize: 13 } as const;

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
              {rq.name}
            </span>
            <span className="li-s">{rq.email}</span>
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
            <span style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-s"
                style={BUTTON_STYLE}
                aria-label={`Decline, ${rq.name}`}
                onClick={() => void decline(rq)}
              >
                Decline
              </button>
              <button
                type="button"
                className="btn btn-p"
                style={BUTTON_STYLE}
                aria-label={`Approve as ${PARTNER_ROLE_LABEL[roleOf(rq)]}, ${rq.name}`}
                title="Sends a login link"
                onClick={() => void approve(rq)}
              >
                Approve as {PARTNER_ROLE_LABEL[roleOf(rq)]}
              </button>
            </span>
          </span>
        </div>
      ))}
    </section>
  );
}
