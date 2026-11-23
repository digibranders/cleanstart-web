"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { PasswordField, passwordRules } from "@/components/ui/password-field";
import { fmtLong } from "@/lib/dates";
import { changePasswordAction } from "@/server/actions/account";
import { issuesToErrors } from "@/server/actions/result";

const CIRCLE =
  "M128,26A102,102,0,1,0,230,128,102.12,102.12,0,0,0,128,26Zm0,192a90,90,0,1,1,90-90A90.1,90.1,0,0,1,128,218Z";

export function PasswordCard({ passwordChangedAt }: { passwordChangedAt: string | null }): React.JSX.Element {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);
  const [changedAt, setChangedAt] = useState<string | null>(passwordChangedAt);
  const [busy, setBusy] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const rules = passwordRules(next);
  const weak = rules.some((r) => !r.met);
  const mismatch = !weak && next !== confirm;
  const missingCurrent = current === "";

  const edit = (set: (value: string) => void) => (value: string) => {
    set(value);
    setDone(false);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    if (missingCurrent || weak || mismatch) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await changePasswordAction({ currentPassword: current, newPassword: next, confirmPassword: confirm });
    setBusy(false);
    if (!result.ok) {
      setServerErrors(issuesToErrors(result.error));
      setFormError(result.error.issues?.length ? null : result.error.message);
      return;
    }
    setServerErrors({});
    setChangedAt(result.data.changedAt);
    setCurrent("");
    setNext("");
    setConfirm("");
    setTried(false);
    setDone(true);
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby="pwh"
      className="card clip"
    >
      <div className="card-h">
        <h2 id="pwh" className="card-t">
          Password
        </h2>
        <span className="card-meta">
          {changedAt ? `Last changed ${fmtLong(changedAt.slice(0, 10))}` : "Not changed yet"}
        </span>
      </div>
      {done ? (
        <div className="card-b" style={{ paddingBottom: 0 }}>
          <div className="note note-violet" role="status">
            <Icon name="check" />
            <span>Password updated. Every other device was signed out.</span>
          </div>
        </div>
      ) : null}
      <div className="card-b grid3">
        <PasswordField
          label="Current password"
          autoComplete="current-password"
          value={current}
          onChange={edit(setCurrent)}
          {...(tried && missingCurrent
            ? { error: "Enter your current password." }
            : serverErrors.currentPassword
              ? { error: serverErrors.currentPassword }
              : {})}
        />
        <div>
          <PasswordField
            label="New password"
            value={next}
            onChange={edit(setNext)}
            {...(tried && weak
              ? { error: "Meet all four rules below." }
              : serverErrors.newPassword
                ? { error: serverErrors.newPassword }
                : {})}
          />
          <ul
            aria-label="Password rules"
            style={{ margin: "7px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 3 }}
          >
            {rules.map((rule) => (
              <li
                key={rule.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: rule.met ? "#17663A" : tried ? "#A01C1C" : "#6B687D",
                }}
              >
                {rule.met ? (
                  <Icon name="check" small />
                ) : tried ? (
                  <Icon name="x" small />
                ) : (
                  <Icon d={CIRCLE} small />
                )}
                {rule.label}
                <span className="sr">{rule.met ? ", done" : ", still needed"}</span>
              </li>
            ))}
          </ul>
        </div>
        <PasswordField
          label="Confirm new password"
          value={confirm}
          onChange={edit(setConfirm)}
          {...(tried && mismatch ? { error: "The passwords do not match." } : {})}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "10px 12px",
          borderTop: "1px solid #F0EFF4",
          background: "#FCFCFD",
        }}
      >
        {formError ? (
          <span className="err" role="alert" style={{ marginRight: "auto" }}>
            {formError}
          </span>
        ) : null}
        <button type="submit" className="btn btn-s" disabled={busy}>
          Update password
        </button>
      </div>
    </form>
  );
}
