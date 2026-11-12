"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { appendAudit } from "@/data/audit";
import { isEmail, nameFromEmail, type PartnerRole, teamSlice } from "@/data/team";

const ROLES: readonly PartnerRole[] = ["Sales", "Technical", "Partner admin"];

function isRole(value: string): value is PartnerRole {
  return (ROLES as readonly string[]).includes(value);
}

export function InviteCard(): React.JSX.Element {
  const toast = useToast();
  const members = teamSlice.use().members;
  const [email, setEmail] = useState("meera.pillai@kestrelsystems.in");
  const [role, setRole] = useState<PartnerRole>("Sales");
  const [tried, setTried] = useState(false);

  const address = email.trim().toLowerCase();
  const valid = isEmail(address);
  const duplicate = members.some((m) => m.email === address);
  const showError = tried && (!valid || duplicate);

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!valid || duplicate) {
      setTried(true);
      return;
    }
    const name = nameFromEmail(address);
    teamSlice.set((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        { name, email: address, role, status: "Invited", last: "Invited today", deals: 0 },
      ],
    }));
    appendAudit({
      actor: "Aditi Rao",
      action: "Invited a user",
      target: `${name}, ${role.toLowerCase()}, at Kestrel Systems`,
      source: "Portal",
    });
    setEmail("");
    setTried(false);
    toast(`Invite sent to ${address}`);
  };

  return (
    <form onSubmit={submit} noValidate aria-labelledby="inv" className="card clip">
      <div className="card-h">
        <h2 id="inv" className="card-t">
          Invite a colleague
        </h2>
      </div>
      <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="fg">
          <label htmlFor="ie" className="lbl">
            Work email
          </label>
          <input
            id="ie"
            className={`field${showError ? " field-err" : ""}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={showError}
            aria-describedby={showError ? "ie-err" : undefined}
          />
          {showError ? (
            <span className="err" id="ie-err">
              {duplicate ? "This person already has a login." : "Enter a valid work email."}
            </span>
          ) : null}
        </div>
        <div className="fg">
          <label htmlFor="ir" className="lbl">
            Role
          </label>
          <Dropdown
            id="ir"
            variant="field"
            value={role}
            options={ROLES}
            onChange={(v) => {
              if (isRole(v)) setRole(v);
            }}
          />
        </div>
        <button type="submit" className="btn btn-p" style={{ alignSelf: "flex-start" }} data-tour="team-invite">
          <Icon name="userplus" />
          Send invite
        </button>
      </div>
    </form>
  );
}
