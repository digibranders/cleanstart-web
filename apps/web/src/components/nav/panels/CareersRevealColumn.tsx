"use client";

import { useRef, useState } from "react";
import { PanelRow } from "@/components/nav/pieces/PanelRow";
import { SpotlightRenderer } from "@/components/nav/pieces/SpotlightRenderer";
import { OpenRolesCard } from "@/components/nav/pieces/OpenRolesCard";
import type { NavLeaf } from "@/lib/nav-config";
import type { SpotlightCard } from "@/components/nav/data/spotlights";
import type { OpenRole } from "@/components/nav/data/open-roles";

type Props = { rows: NavLeaf[]; spotlight: SpotlightCard; openRoles: OpenRole[] };

const REVERT_MS = 120;

/**
 * Company panel body. The right slot shows the brand spotlight by default and
 * swaps to the open-roles roster when the "Careers" row is hovered or focused.
 * A short revert delay + the card sharing the hover handlers keeps the roster
 * up while the cursor travels from the row into the card.
 */
export function CareersRevealColumn({ rows, spotlight, openRoles }: Props) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRoles = openRoles.length > 0;

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    if (hasRoles) setRevealed(true);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setRevealed(false), REVERT_MS);
  };

  return (
    <div className="grid grid-cols-[1.3fr_1fr] gap-3.5">
      <div className="flex flex-col gap-0.5">
        {rows.map((r) => {
          const isCareers = r.href === "/careers";
          const row = (
            <PanelRow
              href={r.href}
              label={r.label}
              {...(r.description ? { description: r.description } : {})}
              icon={r.icon ?? "info"}
              built={r.built !== false}
              {...(isCareers && hasRoles ? { badge: `${openRoles.length} open` } : {})}
            />
          );
          if (!isCareers) return <div key={r.label}>{row}</div>;
          return (
            <div
              key={r.label}
              onPointerEnter={show}
              onPointerLeave={hide}
              onFocus={show}
              onBlur={hide}
            >
              {row}
            </div>
          );
        })}
      </div>
      <div onPointerEnter={show} onPointerLeave={hide}>
        {revealed ? (
          <OpenRolesCard roles={openRoles} />
        ) : (
          <SpotlightRenderer spotlight={spotlight} hero />
        )}
      </div>
    </div>
  );
}
