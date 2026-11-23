"use client";

import { useEffect, useId, useState } from "react";
import { ALL_REGIONS, type StaffScope } from "@/lib/domain";
import { sameScope, toggleScopeKey } from "@/lib/regions";
import { Icon } from "../icon";
import { Scrim } from "./scrim";

export interface MultiOption {
  key: string;
  label: string;
}

interface MultiDropdownProps {
  value: StaffScope;
  /** The choices after "All regions". */
  options: readonly MultiOption[];
  /** Text on the trigger for the current value. */
  summary: string;
  /** Called when the menu closes with a different choice than it opened with. */
  onCommit: (value: StaffScope) => void;
  variant?: "fsel" | "field" | "rsel";
  ariaLabel?: string;
  id?: string;
}

/**
 * A menu of checkable choices headed by "All regions". Choosing All clears the rest; choosing a region clears All; the last
 * region cannot be unchecked. Edits stay in the menu until it closes, so one change is one save.
 */
export function MultiDropdown({ value, options, summary, onCommit, variant = "fsel", ariaLabel, id }: MultiDropdownProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<StaffScope>(value);
  const autoId = useId();
  const triggerId = id ?? autoId;

  const close = (): void => {
    setOpen(false);
    if (!sameScope(draft, value)) onCommit(draft);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const choices: readonly MultiOption[] = [{ key: ALL_REGIONS, label: "All regions" }, ...options];
  const checked = (key: string): boolean => (draft === ALL_REGIONS ? key === ALL_REGIONS : draft.includes(key));

  return (
    <div className={`dd${variant === "field" ? " dd-full" : ""}`}>
      <button
        type="button"
        id={triggerId}
        className={`dd-btn ${variant}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          if (open) close();
          else {
            setDraft(value);
            setOpen(true);
          }
        }}
      >
        <span>{summary}</span>
        <Icon name="caret" className="ic car" />
      </button>
      {open ? (
        <>
          <Scrim className="dd-scrim" onClose={close} />
          {/* biome-ignore lint/a11y/useFocusableInteractive: the options are buttons and focusable; the list itself is not a tab stop */}
          <div className="dd-menu" role="listbox" aria-multiselectable="true" aria-labelledby={triggerId}>
            {choices.map((o) => (
              <button
                key={o.key}
                type="button"
                role="option"
                aria-selected={checked(o.key)}
                className={`dd-opt${checked(o.key) ? " dd-on" : ""}`}
                onClick={() => setDraft((d) => toggleScopeKey(d, o.key))}
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
