"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { appendAudit } from "@/data/audit";
import { isEmail, type StaffRegion, type StaffRole, staffSlice } from "@/data/team";
import { Seg } from "./Seg";

const ROLES: readonly StaffRole[] = ["Partner manager", "Sales", "Marketing"];
const REGIONS: readonly StaffRegion[] = ["India", "Middle East", "All regions"];
const ROLE_HINT: Record<StaffRole, string> = {
  "Partner manager": "Approves deals and applications, and manages partners.",
  Sales: "Sees and approves deals in their own region.",
  Marketing: "Publishes documents for partners.",
};

export function StaffInviteDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): React.JSX.Element | null {
  const toast = useToast();
  const people = staffSlice.use();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("Sales");
  const [region, setRegion] = useState<StaffRegion>("India");
  const [tried, setTried] = useState(false);

  const address = email.trim().toLowerCase();
  const emailOk = isEmail(address);
  const duplicate = people.some((p) => p.email === address);
  const nameErr = tried && name.trim() === "";
  const emailErr = tried && (!emailOk || duplicate);

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (name.trim() === "" || !emailOk || duplicate) {
      setTried(true);
      return;
    }
    const person = name.trim();
    staffSlice.set((prev) => [
      ...prev,
      { name: person, email: address, role, region, partners: [], last: "Invited today", status: "Invited" },
    ]);
    appendAudit({
      actor: "Farhan Qureshi",
      action: "Invited a teammate",
      target: `${person}, ${role.toLowerCase()}, ${region}`,
      source: "Portal",
    });
    setName("");
    setEmail("");
    setRole("Sales");
    setRegion("India");
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
          <button type="submit" className="btn btn-p">
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
            {duplicate ? "This person is already on the team." : "Enter a valid work email."}
          </span>
        ) : null}
      </div>
      <div className="fg">
        <span id="inv-role" className="lbl">
          Role
        </span>
        <div style={{ alignSelf: "flex-start" }}>
          <Seg options={ROLES} value={role} onChange={setRole} labelledBy="inv-role" />
        </div>
        <span className="hint">{ROLE_HINT[role]}</span>
      </div>
      <div className="fg">
        <span id="inv-reg" className="lbl">
          Region
        </span>
        <div style={{ alignSelf: "flex-start" }}>
          <Seg options={REGIONS} value={region} onChange={setRegion} labelledBy="inv-reg" />
        </div>
      </div>
    </Drawer>
  );
}
