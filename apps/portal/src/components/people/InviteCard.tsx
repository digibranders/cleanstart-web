"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { isOneOf, PARTNER_ROLE_LABEL, PARTNER_ROLES, type PartnerRole } from "@/lib/domain";
import { emailDomain, isValidEmail } from "@/lib/people";
import { inviteMemberAction } from "@/server/actions/team";
import { issuesToErrors } from "@/server/actions/result";

const ROLE_ORDER: readonly PartnerRole[] = ["sales", "technical", "partner_admin"];
const ROLE_OPTIONS: readonly DropdownOption[] = ROLE_ORDER.map((value) => ({ value, label: PARTNER_ROLE_LABEL[value] }));

export function InviteCard({
  existingEmails,
  partnerDomain,
}: {
  existingEmails: readonly string[];
  /** The company's own email domain; an invite to any other address gets a one-line note. */
  partnerDomain: string;
}): React.JSX.Element {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PartnerRole>("sales");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const address = email.trim().toLowerCase();
  const valid = isValidEmail(address);
  const duplicate = existingEmails.includes(address);
  const showError = (tried && (!valid || duplicate)) || serverError !== null;
  const otherDomain = valid && partnerDomain !== "" && emailDomain(address) !== partnerDomain;

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setServerError(null);
    if (!valid || duplicate) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await inviteMemberAction({ email: address, role, ...(name.trim() ? { name: name.trim() } : {}) });
    setBusy(false);
    if (!result.ok) {
      setServerError(issuesToErrors(result.error).email ?? result.error.message);
      return;
    }
    setName("");
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
          <label htmlFor="in" className="lbl">
            Full name (optional)
          </label>
          <input
            id="in"
            className="field"
            type="text"
            autoComplete="off"
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
            aria-describedby={showError ? "ie-err" : otherDomain ? "ie-note" : undefined}
          />
          {showError ? (
            <span className="err" id="ie-err">
              {serverError ?? (duplicate ? "This person already has a login." : "Enter a valid work email.")}
            </span>
          ) : otherDomain ? (
            <span className="hint" id="ie-note">
              This address is not at {partnerDomain}.
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
            options={ROLE_OPTIONS}
            onChange={(v) => {
              if (isOneOf(PARTNER_ROLES, v)) setRole(v);
            }}
          />
        </div>
        <button type="submit" className="btn btn-p" style={{ alignSelf: "flex-start" }} disabled={busy}>
          <Icon name="userplus" />
          Send invite
        </button>
      </div>
    </form>
  );
}
