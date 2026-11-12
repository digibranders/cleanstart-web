"use client";

import { useState } from "react";
import { PasswordCard } from "@/components/people/PasswordCard";
import { TwoStepCard } from "@/components/people/TwoStepCard";
import { accountSlice, type NotificationPrefs } from "@/data/team";

interface ProfileDraft {
  name: string;
  title: string;
  phone: string;
}

const NOTIFICATIONS: ReadonlyArray<readonly [keyof NotificationPrefs, string, string]> = [
  ["decision", "Deal accepted or rejected", "When CleanStart decides on a deal you registered."],
  ["stage", "Deal stage changes", "When a deal moves stage in CleanStart's CRM."],
  ["expiry", "Protection ending", "14 days before a deal's protection ends."],
  ["docs", "New documents", "When CleanStart adds material for your products."],
  ["team", "Team changes", "When a colleague accepts an invite or is removed."],
];

export function Account(): React.JSX.Element {
  const saved = accountSlice.use();
  // Edits live here until saved, as overrides, so a reload that restores the slice never shows stale text.
  const [draft, setDraft] = useState<Partial<ProfileDraft>>({});
  const value: ProfileDraft = {
    name: draft.name ?? saved.name,
    title: draft.title ?? saved.title,
    phone: draft.phone ?? saved.phone,
  };
  const dirty = value.name !== saved.name || value.title !== saved.title || value.phone !== saved.phone;

  const saveProfile = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    accountSlice.set((prev) => ({ ...prev, ...value }));
    setDraft({});
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
                />
              </div>
              <div className="fg">
                <span className="lbl">Work email</span>
                <span
                  className="field"
                  style={{ display: "flex", alignItems: "center", background: "#FAFAFB", color: "#4A4858" }}
                >
                  aditi.rao@kestrelsystems.in
                </span>
                <span className="hint">Your sign-in. Your partner manager can change it.</span>
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
                Role: <b style={{ color: "#2A2838" }}>Partner admin</b>. Another partner admin can change it on
                the Team page.
              </span>
              <button type="submit" className="btn btn-p">
                Save profile
              </button>
            </div>
          </form>

          <PasswordCard />
          <TwoStepCard />
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
                checked={saved.notify[key]}
                onChange={(e) =>
                  accountSlice.set((prev) => ({ ...prev, notify: { ...prev.notify, [key]: e.target.checked } }))
                }
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
