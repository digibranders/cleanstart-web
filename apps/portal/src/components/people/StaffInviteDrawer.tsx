"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import {
  STAFF_REGION_LABEL,
  STAFF_REGIONS,
  STAFF_ROLE_LABEL,
  STAFF_ROLES,
  type StaffRegion,
  type StaffRole,
} from "@/lib/domain";
import { codeFromLabel, isValidEmail } from "@/lib/people";
import { inviteStaffAction } from "@/server/actions/staff";
import { issuesToErrors } from "@/server/actions/result";
import { Seg } from "./Seg";

const ROLES: readonly string[] = STAFF_ROLES.map((r) => STAFF_ROLE_LABEL[r]);
const REGIONS: readonly string[] = STAFF_REGIONS.map((r) => STAFF_REGION_LABEL[r]);
const ROLE_HINT: Record<StaffRole, string> = {
  partner_manager: "Approves deals and applications, and manages partners.",
  sales: "Sees and approves deals in their own region.",
  marketing: "Publishes documents for partners.",
};

export function StaffInviteDrawer({
  open,
  onClose,
  existingEmails,
}: {
  open: boolean;
  onClose: () => void;
  existingEmails: readonly string[];
}): React.JSX.Element | null {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleLabel, setRoleLabel] = useState<string>(STAFF_ROLE_LABEL.sales);
  const [regionLabel, setRegionLabel] = useState<string>(STAFF_REGION_LABEL.india);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const address = email.trim().toLowerCase();
  const emailOk = isValidEmail(address);
  const duplicate = existingEmails.includes(address);
  const nameErr = tried && name.trim() === "";
  const emailErr = (tried && (!emailOk || duplicate)) || serverError !== null;
  const role: StaffRole = codeFromLabel(STAFF_ROLE_LABEL, roleLabel) ?? "sales";
  const region: StaffRegion = codeFromLabel(STAFF_REGION_LABEL, regionLabel) ?? "india";

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setServerError(null);
    if (name.trim() === "" || !emailOk || duplicate) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await inviteStaffAction({ name, email: address, role, region });
    setBusy(false);
    if (!result.ok) {
      setServerError(issuesToErrors(result.error).email ?? result.error.message);
      return;
    }
    setName("");
    setEmail("");
    setRoleLabel(STAFF_ROLE_LABEL.sales);
    setRegionLabel(STAFF_REGION_LABEL.india);
    setTried(false);
    onClose();
    toast(`Invite sent to ${address}`);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Invite a teammate"
      subtitle="They get an email to set a password for the CleanStart admin."
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy}>
            Send invite
          </button>
        </>
      }
    >
      <div className="fg">
        <label htmlFor="inv-name" className="lbl">
          Full name
        </label>
        <input
          id="inv-name"
          className={`field${nameErr ? " field-err" : ""}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={nameErr}
          aria-describedby={nameErr ? "inv-name-err" : undefined}
        />
        {nameErr ? (
          <span className="err" id="inv-name-err">
            Enter their name.
          </span>
        ) : null}
      </div>
      <div className="fg">
        <label htmlFor="inv-email" className="lbl">
          Work email
        </label>
        <input
          id="inv-email"
          className={`field${emailErr ? " field-err" : ""}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={emailErr}
          aria-describedby={emailErr ? "inv-email-err" : undefined}
        />
        {emailErr ? (
          <span className="err" id="inv-email-err">
            {serverError ?? (duplicate ? "This person is already on the team." : "Enter a valid work email.")}
          </span>
        ) : null}
      </div>
      <div className="fg">
        <span id="inv-role" className="lbl">
          Role
        </span>
        <div style={{ alignSelf: "flex-start" }}>
          <Seg options={ROLES} value={roleLabel} onChange={setRoleLabel} labelledBy="inv-role" />
        </div>
        <span className="hint">{ROLE_HINT[role]}</span>
      </div>
      <div className="fg">
        <span id="inv-reg" className="lbl">
          Region
        </span>
        <div style={{ alignSelf: "flex-start" }}>
          <Seg options={REGIONS} value={regionLabel} onChange={setRegionLabel} labelledBy="inv-reg" />
        </div>
      </div>
    </Drawer>
  );
}
