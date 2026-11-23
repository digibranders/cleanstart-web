"use client";

import { useId, useState } from "react";
import { PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL, type PartnerCategory, type PartnerRegion } from "@/lib/domain";

export interface PartnerChoice {
  id: string;
  name: string;
  region: PartnerRegion;
  category: PartnerCategory;
}

interface Props {
  partners: readonly PartnerChoice[];
  value: string;
  onChange: (id: string) => void;
  error?: string | undefined;
}

const SHOWN = 5;
const OPTION_STYLE = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 8,
  width: "100%",
  padding: "6px 10px",
  textAlign: "left",
  cursor: "pointer",
  background: "#fff",
  border: "1px solid #F0EFF4",
  borderRadius: 7,
  font: "inherit",
  fontSize: 13,
} as const;

/** A searchable list of the partners the signed-in staff member can act for. Matches the name, newest list order kept. */
export function PartnerPicker({ partners, value, onChange, error }: Props): React.JSX.Element {
  const [q, setQ] = useState("");
  const listId = useId();
  const chosen = partners.find((p) => p.id === value);
  const needle = q.trim().toLowerCase();
  const matches = partners.filter((p) => !needle || p.name.toLowerCase().includes(needle)).slice(0, SHOWN);

  if (chosen) {
    return (
      <div className="fg">
        <span className="lbl">Partner</span>
        <span style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600 }}>{chosen.name}</span>
          <span className="t-muted" style={{ fontSize: 12.5 }}>
            {PARTNER_CATEGORY_LABEL[chosen.category]}, {PARTNER_REGION_LABEL[chosen.region]}
          </span>
          <button
            type="button"
            className="linkbtn"
            onClick={() => {
              onChange("");
              setQ("");
            }}
          >
            Change partner
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="fg">
      <label htmlFor={`${listId}-q`} className="lbl">
        Partner
      </label>
      <input
        id={`${listId}-q`}
        className={`field${error ? " field-err" : ""}`}
        type="search"
        autoComplete="off"
        placeholder="Search partners by name"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${listId}-err` : undefined}
        aria-controls={listId}
      />
      {error ? (
        <span className="err" id={`${listId}-err`}>
          {error}
        </span>
      ) : null}
      <ul id={listId} aria-label="Matching partners" style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
        {matches.map((p) => (
          <li key={p.id}>
            <button type="button" style={OPTION_STYLE} onClick={() => onChange(p.id)}>
              <span style={{ fontWeight: 600 }}>{p.name}</span>
              <span className="t-muted" style={{ fontSize: 12 }}>
                {PARTNER_CATEGORY_LABEL[p.category]}, {PARTNER_REGION_LABEL[p.region]}
              </span>
            </button>
          </li>
        ))}
        {matches.length === 0 ? <li className="hint">No partner matches.</li> : null}
      </ul>
    </div>
  );
}
