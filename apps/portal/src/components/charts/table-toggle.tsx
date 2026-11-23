"use client";

import { useId, useState } from "react";
import { Icon } from "../icon";

/** The "View as table" disclosure under a chart: a button that shows or hides the same data as a table. */
export function TableToggle({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const panel = useId();
  return (
    <div className="ch-table">
      <button type="button" className="ch-toggle" aria-expanded={open} aria-controls={panel} onClick={() => setOpen((o) => !o)}>
        {open ? "Hide table" : "View as table"}
        <Icon name="caret" />
      </button>
      <div id={panel} hidden={!open}>
        {children}
      </div>
    </div>
  );
}
