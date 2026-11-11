"use client";

import { useEffect, useId, useState } from "react";
import { Icon } from "../icon";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  options: readonly (string | DropdownOption)[];
  onChange: (value: string) => void;
  /** Trigger style: fsel (toolbar filter), field (form input), rsel (inline in a table row). */
  variant?: "fsel" | "field" | "rsel";
  ariaLabel?: string;
  id?: string;
  invalid?: boolean;
}

const normalise = (o: string | DropdownOption): DropdownOption =>
  typeof o === "string" ? { value: o, label: o } : o;

export function Dropdown({
  value,
  options,
  onChange,
  variant = "fsel",
  ariaLabel,
  id,
  invalid,
}: DropdownProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const autoId = useId();
  const triggerId = id ?? autoId;
  const items = options.map(normalise);
  const current = items.find((o) => o.value === value)?.label ?? value;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className={`dd${variant === "field" ? " dd-full" : ""}`}>
      <button
        type="button"
        id={triggerId}
        className={`dd-btn ${variant}${invalid ? " field-err" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{current}</span>
        <Icon name="caret" className="ic car" />
      </button>
      {open ? (
        <>
          <div className="dd-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="dd-menu" role="listbox" aria-labelledby={triggerId}>
            {items.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={`dd-opt${o.value === value ? " dd-on" : ""}`}
                onClick={() => {
                  setOpen(false);
                  onChange(o.value);
                }}
              >
                {o.label}
                <Icon name="check" />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
