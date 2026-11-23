"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { EditMemberDrawer } from "@/components/people/EditMemberDrawer";
import { RowAction } from "@/components/people/RowAction";
import { Avatar } from "@/components/ui/badge";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { Dialog, Drawer } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { isOneOf, PARTNER_ROLE_LABEL, PARTNER_ROLES, type PartnerRole } from "@/lib/domain";
import type { PartnerDetailDto, PartnerPersonDto, TeamMemberDto } from "@/lib/dto";
import { initialsOf, invitedLabel, isValidEmail, lastSeenLabel } from "@/lib/people";
import { resetUserTwoStepAction } from "@/server/actions/staff-user-security";
import { issuesToErrors } from "@/server/actions/result";
import { inviteMemberAction, removeMemberAction, resendInviteAction, revokeInviteAction } from "@/server/actions/team";
import { hasActiveAdmin, inviteOnly, moveTargets } from "./partner-people-model";

const ROLE_OPTIONS: readonly DropdownOption[] = (["sales", "technical", "partner_admin"] as const).map((value) => ({
  value,
  label: PARTNER_ROLE_LABEL[value],
}));

const asMember = (p: PartnerPersonDto): TeamMemberDto => ({ ...p, isYou: false });

/** Invites one person to a company on a partner manager's behalf. `initialRole` is partner_admin from the "No admin yet" notice. */
function InvitePersonDrawer({
  partner,
  initialRole,
  onClose,
}: {
  partner: PartnerDetailDto;
  initialRole: PartnerRole;
  onClose: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PartnerRole>(initialRole);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const address = email.trim().toLowerCase();
  const valid = isValidEmail(address);
  const duplicate = partner.people.some((p) => p.email === address);
  const showError = (tried && (!valid || duplicate)) || serverError !== null;

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setServerError(null);
    if (!valid || duplicate) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await inviteMemberAction({ partnerId: partner.id, email: address, role, ...(name.trim() ? { name: name.trim() } : {}) });
    setBusy(false);
    if (!result.ok) {
      setServerError(issuesToErrors(result.error).email ?? result.error.message);
      return;
    }
    toast(`Invite sent to ${address}`);
    router.refresh();
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={initialRole === "partner_admin" ? "Invite an admin" : "Invite a person"}
      subtitle={partner.name}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy}>
            <Icon name="userplus" />
            Send invite
          </button>
        </>
      }
    >
      <div className="fg">
        <label htmlFor="pi-name" className="lbl">
          Full name (optional)
        </label>
        <input id="pi-name" className="field" type="text" autoComplete="off" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="fg">
        <label htmlFor="pi-email" className="lbl">
          Work email
        </label>
        <input
          id="pi-email"
          className={`field${showError ? " field-err" : ""}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={showError}
          aria-describedby={showError ? "pi-email-err" : undefined}
        />
        {showError ? (
          <span className="err" id="pi-email-err">
            {serverError ?? (duplicate ? "This person is already on the team." : "Enter a valid work email.")}
          </span>
        ) : null}
      </div>
      <div className="fg">
        <label htmlFor="pi-role" className="lbl">
          Role
        </label>
        <Dropdown
          id="pi-role"
          variant="field"
          value={role}
          options={ROLE_OPTIONS}
          onChange={(v) => {
            if (isOneOf(PARTNER_ROLES, v)) setRole(v);
          }}
        />
        {role === "partner_admin" ? <span className="hint">Partner admins can invite and remove people and edit the company profile.</span> : null}
      </div>
    </Drawer>
  );
}

function RemovePersonDialog({
  partner,
  person,
  onClose,
}: {
  partner: PartnerDetailDto;
  person: PartnerPersonDto;
  onClose: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const [moveTo, setMoveTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const withdraw = inviteOnly(person);
  const heirs = moveTargets(partner.people, person);

  const confirm = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    const result =
      withdraw && person.inviteId
        ? await revokeInviteAction({ partnerId: partner.id, inviteId: person.inviteId })
        : await removeMemberAction({ partnerId: partner.id, userId: person.id, ...(moveTo ? { moveDealsTo: moveTo } : {}) });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    toast(withdraw ? `Invite to ${person.name} withdrawn` : `${person.name} was removed from ${partner.name}`);
    router.refresh();
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={withdraw ? `Withdraw the invite to ${person.name}?` : `Remove ${person.name}?`}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Keep {person.name.split(" ")[0]}
          </button>
          <button type="button" className="btn btn-dd" disabled={busy} onClick={() => void confirm()}>
            {withdraw ? "Withdraw invite" : "Remove access"}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, lineHeight: 1.55 }}>
        {withdraw ? "The invite link stops working." : "They lose access at once and are signed out. The company can reactivate them later."}
      </p>
      {!withdraw && person.deals > 0 ? (
        <div className="fg" style={{ marginTop: 14 }}>
          <label htmlFor="pr-move" className="lbl">
            Move their {person.deals} {person.deals === 1 ? "deal" : "deals"} to
          </label>
          <Dropdown
            id="pr-move"
            variant="field"
            value={moveTo}
            options={[{ value: "", label: "Leave with the company" }, ...heirs.map((m) => ({ value: m.id, label: `${m.name}, ${PARTNER_ROLE_LABEL[m.role]}` }))]}
            onChange={setMoveTo}
          />
          <span className="hint">Only who owns the deals changes. Their status stays as it is.</span>
        </div>
      ) : null}
      {error ? (
        <span className="err" role="alert" style={{ display: "block", marginTop: 10 }}>
          {error}
        </span>
      ) : null}
    </Dialog>
  );
}

function ResetTwoStepDialog({
  partner,
  person,
  onClose,
}: {
  partner: PartnerDetailDto;
  person: PartnerPersonDto;
  onClose: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const missing = reason.trim() === "";

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setTried(true);
    if (missing) return;
    setBusy(true);
    setError(null);
    const result = await resetUserTwoStepAction({ userId: person.id, reason: reason.trim() });
    setBusy(false);
    if (!result.ok) {
      setError(issuesToErrors(result.error).reason ?? result.error.message);
      return;
    }
    toast(`Two-step sign-in reset for ${person.name}. They are signed out and have been emailed`);
    router.refresh();
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Reset two-step sign-in for ${person.name}?`}
      subtitle={partner.name}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-dd" disabled={busy}>
            Reset two-step
          </button>
        </>
      }
    >
      <p style={{ margin: 0, lineHeight: 1.55 }}>
        Use this only when they have lost their phone and their backup codes. Their authenticator and backup codes are removed, they are signed out everywhere, and they are emailed. They sign in with a password and set two-step up again.
      </p>
      <div className="fg" style={{ marginTop: 14 }}>
        <label htmlFor="rt-reason" className="lbl">
          Reason
        </label>
        <textarea
          id="rt-reason"
          className={`field${tried && missing ? " field-err" : ""}`}
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          aria-invalid={tried && missing}
        />
        {tried && missing ? <span className="err">Give a reason for the reset.</span> : <span className="hint">Kept in the audit log and sent to them.</span>}
      </div>
      {error ? (
        <span className="err" role="alert">
          {error}
        </span>
      ) : null}
    </Dialog>
  );
}

type PeopleDialog =
  | { kind: "invite"; role: PartnerRole }
  | { kind: "edit"; person: PartnerPersonDto }
  | { kind: "remove"; person: PartnerPersonDto }
  | { kind: "reset"; person: PartnerPersonDto };

export function PartnerPeople({
  partner: p,
  today,
  canManage,
}: {
  partner: PartnerDetailDto;
  today: string;
  canManage: boolean;
}): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const [dialog, setDialog] = useState<PeopleDialog | null>(null);
  const noAdmin = !hasActiveAdmin(p.people);
  const waitingAdmin = p.people.some((u) => u.role === "partner_admin" && u.status === "invited");

  const resend = (person: PartnerPersonDto): void => {
    if (!person.inviteId) return;
    void (async () => {
      const result = await resendInviteAction({ partnerId: p.id, inviteId: person.inviteId ?? "" });
      toast(result.ok ? `Invite resent to ${person.email}` : result.error.message);
    })();
  };

  return (
    <section aria-labelledby="sel-people" className="card clip">
      <div className="card-h">
        <h2 id="sel-people" className="card-t">
          People
        </h2>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="card-meta tnum">{p.users}</span>
          {canManage ? (
            <button type="button" className="btn btn-s" style={{ height: 26, padding: "0 8px", fontSize: 12 }} onClick={() => setDialog({ kind: "invite", role: "sales" })}>
              <Icon name="userplus" />
              Invite
            </button>
          ) : null}
        </span>
      </div>
      {noAdmin ? (
        <div role="status" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "10px 12px", background: "#FFF8EB", borderBottom: "1px solid #F0EFF4" }}>
          <span style={{ flex: "1 1 200px", fontSize: 12.5, lineHeight: 1.45 }}>
            <strong>No admin yet.</strong>{" "}
            {waitingAdmin
              ? "The admin invite has not been accepted. Resend it, or invite someone else."
              : "Nobody here can invite people or edit the company profile."}
          </span>
          {canManage ? (
            <button type="button" className="btn btn-p" style={{ height: 26, padding: "0 8px", fontSize: 12 }} onClick={() => setDialog({ kind: "invite", role: "partner_admin" })}>
              Invite an admin
            </button>
          ) : null}
        </div>
      ) : null}
      {p.people.map((u) => (
        <div key={u.id} className="li">
          <Avatar initials={initialsOf(u.name)} round />
          <span className="li-t">
            <span className="li-n">{u.name}</span>
            <span className="li-s">
              {PARTNER_ROLE_LABEL[u.role]}
              {u.twoFactorEnabled ? ", two-step on" : ""}
            </span>
          </span>
          <span className="li-s">{u.status === "invited" ? invitedLabel(u.invitedAt) : lastSeenLabel(u.lastActiveAt, today)}</span>
          {canManage ? (
            <span style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-t"
                style={{ height: 22, padding: "0 6px" }}
                aria-label={`Edit ${u.name}`}
                onClick={() => setDialog({ kind: "edit", person: u })}
              >
                Edit
              </button>
              {u.status === "invited" ? (
                <RowAction label={`Resend invite to ${u.name}`} tip="Resend invite" icon="send" onClick={() => resend(u)} />
              ) : null}
              {u.twoFactorEnabled ? (
                <RowAction label={`Reset two-step for ${u.name}`} tip="Reset two-step" icon="lock" onClick={() => setDialog({ kind: "reset", person: u })} />
              ) : null}
              <RowAction
                label={inviteOnly(u) ? `Withdraw invite to ${u.name}` : `Remove ${u.name}`}
                tip={inviteOnly(u) ? "Withdraw invite" : "Remove access"}
                icon="trash"
                tone="no"
                onClick={() => setDialog({ kind: "remove", person: u })}
              />
            </span>
          ) : null}
        </div>
      ))}
      {p.people.length === 0 ? <p style={{ margin: 0, padding: 12, fontSize: 12.5, color: "#6B687D" }}>Nobody has been invited yet.</p> : null}

      {dialog?.kind === "invite" ? <InvitePersonDrawer key={dialog.role} partner={p} initialRole={dialog.role} onClose={() => setDialog(null)} /> : null}
      {dialog?.kind === "edit" ? (
        <EditMemberDrawer key={dialog.person.id} member={asMember(dialog.person)} partnerId={p.id} onSaved={() => router.refresh()} onClose={() => setDialog(null)} />
      ) : null}
      {dialog?.kind === "remove" ? <RemovePersonDialog key={dialog.person.id} partner={p} person={dialog.person} onClose={() => setDialog(null)} /> : null}
      {dialog?.kind === "reset" ? <ResetTwoStepDialog key={dialog.person.id} partner={p} person={dialog.person} onClose={() => setDialog(null)} /> : null}
    </section>
  );
}
