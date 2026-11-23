"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { Icon } from "../icon";

// Phosphor sliders-horizontal, 256 viewbox.
const SLIDERS =
  "M40,88H73a32,32,0,0,0,62,0h81a8,8,0,0,0,0-16H135a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16Zm64-24A16,16,0,1,1,88,80,16,16,0,0,1,104,64ZM216,168H199a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16h97a32,32,0,0,0,62,0h17a8,8,0,0,0,0-16Zm-48,24a16,16,0,1,1,16-16A16,16,0,0,1,168,192Z";

interface CustomizeState {
  editing: boolean;
  setEditing: (editing: boolean) => void;
}

const CustomizeContext = createContext<CustomizeState>({ editing: false, setEditing: () => undefined });

/** Lets the Customize button in a page header and the card grid below it share one edit switch. */
export function CustomizeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [editing, setEditing] = useState(false);
  const value = useMemo(() => ({ editing, setEditing }), [editing]);
  return <CustomizeContext.Provider value={value}>{children}</CustomizeContext.Provider>;
}

export const useCustomize = (): CustomizeState => useContext(CustomizeContext);

/** The header button that turns card editing on and off. Hidden on phones, where the grid is one column and cannot be arranged. */
export function CustomizeButton(): React.JSX.Element {
  const { editing, setEditing } = useCustomize();
  return (
    <button type="button" className={`btn ${editing ? "btn-p" : "btn-s"} dc-open`} aria-pressed={editing} onClick={() => setEditing(!editing)}>
      <Icon d={SLIDERS} />
      {editing ? "Done customizing" : "Customize"}
    </button>
  );
}
