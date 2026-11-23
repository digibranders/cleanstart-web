"use client";

import { useEffect, useId, useState } from "react";
import { Icon } from "../icon";
import { Scrim } from "./scrim";

export interface ActionMenuItem {
  label: string;
  onSelect: () => void;
}

interface ActionMenuProps {
  /** Text on the trigger, for example "Actions". */
  label: string;
  /** Names the row for screen readers, for example "Actions for Partner sales playbook 2026". */
  ariaLabel: string;
  items: readonly ActionMenuItem[];
}

/**
 * A small action menu for a table row. It reuses the dropdown's trigger, menu and click-away layer, so it looks and
 * closes the same way (outside click or Escape), but its items run an action instead of picking a value.
 */
export function ActionMenu({ label, ariaLabel, items }: ActionMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const triggerId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="dd">
      <button
        type="button"
        id={triggerId}
        className="dd-btn rsel"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{label}</span>
        <Icon name="caret" className="ic car" />
      </button>
      {open ? (
        <>
          <Scrim className="dd-scrim" onClose={() => setOpen(false)} />
          <div className="dd-menu" role="menu" aria-labelledby={triggerId} style={{ left: "auto", right: 0 }}>
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className="dd-opt"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
