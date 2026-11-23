"use client";

import { useState } from "react";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { Drawer } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { isOneOf, PARTNER_ROLE_LABEL, PARTNER_ROLES, type PartnerRole } from "@/lib/domain";
import type { TeamMemberDto } from "@/lib/dto";
import { isValidEmail } from "@/lib/people";
import { issuesToErrors } from "@/server/actions/result";
import { requestMemberEmailChangeAction, updateMemberDetailsAction } from "@/server/actions/member-edit";
import { changeMemberRoleAction } from "@/server/actions/team";

const ROLE_ORDER: readonly PartnerRole[] = ["sales", "technical", "partner_admin"];
const ROLE_OPTIONS: readonly DropdownOption[] = ROLE_ORDER.map((value) => ({ value, label: PARTNER_ROLE_LABEL[value] }));

/** One drawer for a colleague's name, title, phone, role and sign-in email. Render it with key={member.id} so it starts fresh for each person. */
export function EditMemberDrawer({
  member,
  partnerId,
  onClose,
  onSaved,
}: {
  member: TeamMemberDto;
  /** Staff only: the company the person belongs to. Partner admins act on their own company. */
  partnerId?: string;
  onClose: () => void;
  onSaved?: () => void;
}): React.JSX.Element {
  const scope = partnerId ? { partnerId } : {};
  const toast = useToast();
  const [name, setName] = useState(member.name);
  const [title, setTitle] = useState(member.title ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [role, setRole] = useState<PartnerRole>(member.role);
  const [email, setEmail] = useState(member.email);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const address = email.trim().toLowerCase();
  const detailsChanged = name.trim() !== member.name || title.trim() !== (member.title ?? "") || phone.trim() !== (member.phone ?? "");
  const emailChanged = address !== member.email;
  const nameBad = name.trim() === "";
  const emailBad = emailChanged && !isValidEmail(address);
  const nothing = !detailsChanged && !emailChanged && role === member.role;

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setTried(true);
    setErrors({});
    if (nameBad || emailBad || nothing) return;
    setBusy(true);
    const done: string[] = [];
    const fail = (result: { error: Parameters<typeof issuesToErrors>[0] }): void => {
      setErrors({ ...issuesToErrors(result.error), form: result.error.message });
      setBusy(false);
    };
    if (detailsChanged) {
      const result = await updateMemberDetailsAction({ ...scope, userId: member.id, name: name.trim(), title: title.trim(), phone: phone.trim() });
      if (!result.ok) return fail(result);
      done.push("details saved");
    }
    if (role !== member.role) {
      const result = await changeMemberRoleAction({ ...scope, userId: member.id, role });
      if (!result.ok) return fail(result);
      done.push(`now ${PARTNER_ROLE_LABEL[role].toLowerCase()}`);
    }
    if (emailChanged) {
      const result = await requestMemberEmailChangeAction({ ...scope, userId: member.id, email: address });
      if (!result.ok) return fail(result);
      done.push(`confirmation link sent to ${address}`);
    }
    setBusy(false);
    onSaved?.();
    onClose();
    toast(`${member.name}: ${done.join(", ")}`);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title="Edit member"
      subtitle={member.email}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy || nothing}>
            Save changes
          </button>
        </>
      }
    >
      <div className="fg">
        <label htmlFor="em-name" className="lbl">
          Full name
        </label>
        <input
          id="em-name"
          className={`field${(tried && nameBad) || errors.name ? " field-err" : ""}`}
          type="text"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={(tried && nameBad) || Boolean(errors.name)}
        />
        {(tried && nameBad) || errors.name ? <span className="err">{errors.name ?? "Enter their name."}</span> : null}
      </div>
      <div className="fg">
        <label htmlFor="em-title" className="lbl">
          Job title
        </label>
        <input id="em-title" className="field" type="text" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="fg">
        <label htmlFor="em-phone" className="lbl">
          Phone
        </label>
        <input id="em-phone" className="field" type="tel" autoComplete="off" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="fg">
        <label htmlFor="em-role" className="lbl">
          Role
        </label>
        <Dropdown
          id="em-role"
          variant="field"
          value={role}
          options={ROLE_OPTIONS}
          onChange={(v) => {
            if (isOneOf(PARTNER_ROLES, v)) setRole(v);
          }}
        />
        {role !== member.role && (role === "partner_admin" || member.role === "partner_admin") ? (
          <span className="hint">Partner admins can invite and remove people and edit the company profile.</span>
        ) : null}
      </div>
      {member.status === "active" ? (
      <div className="fg">
        <label htmlFor="em-email" className="lbl">
          Sign-in email
        </label>
        <input
          id="em-email"
          className={`field${(tried && emailBad) || errors.email ? " field-err" : ""}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={(tried && emailBad) || Boolean(errors.email)}
        />
        {(tried && emailBad) || errors.email ? (
          <span className="err">{errors.email ?? "Enter a valid work email."}</span>
        ) : emailChanged ? (
          <span className="hint">We send a link to the new address. The email changes only after they open it, and they are signed out everywhere.</span>
        ) : null}
      </div>
      ) : (
        <span className="hint">Their email can change once they have accepted the invite.</span>
      )}
      {errors.form && !errors.name && !errors.email ? (
        <span className="err" role="alert">
          {errors.form}
        </span>
      ) : null}
    </Drawer>
  );
}
