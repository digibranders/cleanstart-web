"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { PasswordField, passwordRules } from "@/components/ui/password-field";

const CIRCLE =
  "M128,26A102,102,0,1,0,230,128,102.12,102.12,0,0,0,128,26Zm0,192a90,90,0,1,1,90-90A90.1,90.1,0,0,1,128,218Z";

export function PasswordCard(): React.JSX.Element {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);

  const rules = passwordRules(next);
  const weak = rules.some((r) => !r.met);
  const mismatch = !weak && next !== confirm;
  const missingCurrent = current === "";

  const edit = (set: (value: string) => void) => (value: string) => {
    set(value);
    setDone(false);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (missingCurrent || weak || mismatch) {
      setTried(true);
      return;
    }
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
      data-tour="account-password"
    >
      <div className="card-h">
        <h2 id="pwh" className="card-t">
          Password
        </h2>
        <span className="card-meta">Last changed 12 Mar 2026</span>
      </div>
      {done ? (
        <div className="card-b" style={{ paddingBottom: 0 }}>
          <div className="note note-violet" role="status">
            <Icon name="check" />
            <span>Password updated.</span>
          </div>
        </div>
      ) : null}
      <div className="card-b grid3">
        <PasswordField
          label="Current password"
          autoComplete="current-password"
          value={current}
          onChange={edit(setCurrent)}
          {...(tried && missingCurrent ? { error: "Enter your current password." } : {})}
        />
        <div>
          <PasswordField
            label="New password"
            value={next}
            onChange={edit(setNext)}
            {...(tried && weak ? { error: "Meet all four rules below." } : {})}
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
        <button type="submit" className="btn btn-s">
          Update password
        </button>
      </div>
    </form>
  );
}
