"use client";

import { useState } from "react";
import { PasswordCard } from "@/components/people/PasswordCard";
import { SessionsCard } from "@/components/people/SessionsCard";
import { TwoStepCard } from "@/components/people/TwoStepCard";
import { useToast } from "@/components/ui/toast";
import { type NotificationCategory, PARTNER_ROLE_LABEL, STAFF_ROLE_LABEL } from "@/lib/domain";
import type { ProfileDto, SessionDto } from "@/lib/dto";
import { setNotificationPrefsAction, updateProfileAction } from "@/server/actions/account";
import { issuesToErrors } from "@/server/actions/result";

interface ProfileDraft {
  name: string;
  title: string;
  phone: string;
}

interface AccountProps {
  profile: ProfileDto;
  sessions: SessionDto[];
  /** Server date, so "Today" labels are stable across hydration. */
  today: string;
}

const NOTIFICATIONS: ReadonlyArray<readonly [NotificationCategory, string, string]> = [
  ["decision", "Deal accepted or rejected", "When CleanStart decides on a deal you registered."],
  ["stage", "Deal stage changes", "When a deal moves stage in CleanStart's CRM."],
  ["expiry", "Protection ending", "Reminders 14 days and 3 days before a deal's protection ends."],
  ["docs", "New documents", "When CleanStart adds material for your products."],
  ["team", "Team changes", "When a colleague accepts an invite, is removed or has a role change."],
  ["messages", "Unread messages", "A short email when a chat message sits unread for a while."],
];

export function Account({ profile, sessions, today }: AccountProps): React.JSX.Element {
  const toast = useToast();
  const [saved, setSaved] = useState<ProfileDraft>({
    name: profile.name,
    title: profile.title ?? "",
    phone: profile.phone ?? "",
  });
  const [notify, setNotify] = useState<Record<NotificationCategory, boolean>>(profile.notifications);
  const [nameError, setNameError] = useState<string | null>(null);
  // Edits live here until saved, as overrides.
  const [draft, setDraft] = useState<Partial<ProfileDraft>>({});
  const value: ProfileDraft = {
    name: draft.name ?? saved.name,
    title: draft.title ?? saved.title,
    phone: draft.phone ?? saved.phone,
  };
  const dirty = value.name !== saved.name || value.title !== saved.title || value.phone !== saved.phone;
  const roleLabel =
    profile.kind === "staff"
      ? STAFF_ROLE_LABEL[profile.role as keyof typeof STAFF_ROLE_LABEL]
      : PARTNER_ROLE_LABEL[profile.role as keyof typeof PARTNER_ROLE_LABEL];

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setNameError(null);
    const result = await updateProfileAction(value);
    if (!result.ok) {
      setNameError(issuesToErrors(result.error).name ?? result.error.message);
      return;
    }
    setSaved({ name: result.data.name, title: result.data.title ?? "", phone: result.data.phone ?? "" });
    setDraft({});
    toast("Profile saved");
  };

  // Saved as you change them: the switch flips at once and flips back with a message if the save fails.
  const toggle = async (key: NotificationCategory, checked: boolean): Promise<void> => {
    const previous = notify;
    setNotify({ ...notify, [key]: checked });
    const result = await setNotificationPrefsAction({ ...notify, [key]: checked });
    if (!result.ok) {
      setNotify(previous);
      toast(result.error.message);
    }
  };

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Your account</h1>
          <span className="h1-sub">Only you can see and change these settings.</span>
        </div>
      </div>

      <div className="row">
        <div style={{ flex: "1 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <form onSubmit={saveProfile} noValidate aria-labelledby="me" className="card clip">
            <div className="card-h">
              <h2 id="me" className="card-t">
                Profile
              </h2>
              {dirty ? (
                <span className="card-meta t-amber">Unsaved changes</span>
              ) : (
                <span className="card-meta">All changes saved</span>
              )}
            </div>
            <div className="card-b grid2" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <div className="fg">
                <label htmlFor="an" className="lbl">
                  Full name
                </label>
                <input
                  id="an"
                  className="field"
                  type="text"
                  autoComplete="name"
                  value={value.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  aria-invalid={nameError ? true : undefined}
                />
                {nameError ? <span className="err">{nameError}</span> : null}
              </div>
              <div className="fg">
                <span className="lbl">Work email</span>
                <span
                  className="field"
                  style={{ display: "flex", alignItems: "center", background: "#FAFAFB", color: "#4A4858" }}
                >
                  {profile.email}
                </span>
                <span className="hint">Your sign-in. Ask your partner admin to change it.</span>
              </div>
              <div className="fg">
                <label htmlFor="at" className="lbl">
                  Job title
                </label>
                <input
                  id="at"
                  className="field"
                  type="text"
                  autoComplete="organization-title"
                  value={value.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                />
              </div>
              <div className="fg">
                <label htmlFor="ap" className="lbl">
                  Phone
                </label>
                <input
                  id="ap"
                  className="field"
                  type="tel"
                  autoComplete="tel"
                  value={value.phone}
                  onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "10px 12px",
                borderTop: "1px solid #F0EFF4",
                background: "#FCFCFD",
              }}
            >
              <span className="hint">
                Role: <b style={{ color: "#2A2838" }}>{roleLabel}</b>.{" "}
                {profile.role === "partner_admin"
                  ? "A partner admin can change roles on the Team page; if you are the only admin, ask your partner manager."
                  : "A partner admin can change it on the Team page."}
              </span>
              <button type="submit" className="btn btn-p" disabled={!dirty}>
                Save profile
              </button>
            </div>
          </form>

          <PasswordCard passwordChangedAt={profile.passwordChangedAt} email={profile.email} />
          <TwoStepCard enabled={profile.twoFactorEnabled} />
          <SessionsCard sessions={sessions} today={today} />
        </div>

        <section aria-labelledby="nt" className="card clip" style={{ flex: "0 1 400px", minWidth: 300 }}>
          <div className="card-h">
            <h2 id="nt" className="card-t">
              Email notifications
            </h2>
            <span className="card-meta">Saved as you change them</span>
          </div>
          {NOTIFICATIONS.map(([key, title, text]) => (
            <label key={key} className="li" style={{ cursor: "pointer", alignItems: "flex-start" }}>
              <span className="li-t">
                <span className="li-n">{title}</span>
                <span className="li-s" style={{ whiteSpace: "normal" }}>
                  {text}
                </span>
              </span>
              <input
                type="checkbox"
                checked={notify[key]}
                onChange={(e) => void toggle(key, e.target.checked)}
                style={{ width: 15, height: 15, margin: "2px 0 0 auto", flex: "none", accentColor: "#4B23C8" }}
              />
            </label>
          ))}
          <div className="card-b" style={{ borderTop: "1px solid #F0EFF4", background: "#FCFCFD" }}>
            <span className="hint">
              Emails about your own deals go to you. Partner admins also get team changes.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
