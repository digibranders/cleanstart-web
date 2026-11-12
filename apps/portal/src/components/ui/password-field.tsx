"use client";

import { useId, useState } from "react";
import { Icon } from "../icon";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: "current-password" | "new-password";
  error?: string;
  hint?: string;
  id?: string;
}

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete = "new-password",
  error,
  hint,
  id,
}: PasswordFieldProps): React.JSX.Element {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [shown, setShown] = useState(false);
  const noteId = `${fieldId}-note`;

  return (
    <div className="fg">
      <label htmlFor={fieldId} className="lbl">
        {label}
      </label>
      <div className="eye-wrap">
        <input
          id={fieldId}
          className={`field${error ? " field-err" : ""}`}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? noteId : undefined}
        />
        <button
          type="button"
          className="eye-btn"
          aria-label={`${shown ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={shown}
          onClick={() => setShown((s) => !s)}
        >
          <Icon name={shown ? "eyeOff" : "sight"} />
        </button>
      </div>
      {error ? (
        <span id={noteId} className="err">
          {error}
        </span>
      ) : hint ? (
        <span id={noteId} className="hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export interface PasswordRule {
  label: string;
  met: boolean;
}

/** Portal password rule: 8+ characters with a letter, a number and a special character. */
export function passwordRules(value: string): PasswordRule[] {
  return [
    { label: "At least 8 characters", met: value.length >= 8 },
    { label: "A letter", met: /[A-Za-z]/.test(value) },
    { label: "A number", met: /\d/.test(value) },
    { label: "A special character", met: /[^A-Za-z0-9]/.test(value) },
  ];
}

export function PasswordRules({ value }: { value: string }): React.JSX.Element {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
      {passwordRules(value).map((r) => (
        <li
          key={r.label}
          className={r.met ? "t-green" : "t-muted"}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
        >
          <Icon name={r.met ? "check" : "x"} small />
          {r.label}
        </li>
      ))}
    </ul>
  );
}
