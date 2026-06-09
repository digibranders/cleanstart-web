"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { EventCountry } from "@/lib/events";
import {
  COUNTRY_LABEL,
  FILTERABLE_COUNTRIES,
  FILTERABLE_YEARS,
} from "@/lib/events-utils";

interface EventFiltersProps {
  activeCountry?: EventCountry | undefined;
  activeYear?: number | undefined;
}

export function EventFilters({
  activeCountry,
  activeYear,
}: EventFiltersProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void): void => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      next.delete("page");
      const qs = next.toString();
      router.push(qs ? `/events?${qs}` : "/events", { scroll: false });
    },
    [router, searchParams],
  );

  const setCountry = useCallback(
    (value: EventCountry | null): void => {
      pushParams((p) => {
        if (value) p.set("country", value);
        else p.delete("country");
      });
    },
    [pushParams],
  );

  const setYear = useCallback(
    (value: number | null): void => {
      pushParams((p) => {
        if (value) p.set("year", String(value));
        else p.delete("year");
      });
    },
    [pushParams],
  );

  const countryRows = useMemo(
    () => [
      {
        key: "all-countries" as const,
        label: "All Countries",
        icon: <GlobeIcon />,
        selected: activeCountry === undefined,
        onClick: () => setCountry(null),
      },
      ...FILTERABLE_COUNTRIES.map((c) => ({
        key: c,
        label: COUNTRY_LABEL[c],
        icon: <PinIcon />,
        selected: activeCountry === c,
        onClick: () => setCountry(c),
      })),
    ],
    [activeCountry, setCountry],
  );

  const yearRows = useMemo(
    () => [
      {
        key: "all-years" as const,
        label: "All Years",
        icon: <CalendarIcon />,
        selected: activeYear === undefined,
        onClick: () => setYear(null),
      },
      ...FILTERABLE_YEARS.map((y) => ({
        key: String(y),
        label: String(y),
        icon: <CalendarIcon />,
        selected: activeYear === y,
        onClick: () => setYear(y),
      })),
    ],
    [activeYear, setYear],
  );

  return (
    <aside
      aria-label="Filter events"
      className="w-full lg:w-[299px] lg:rounded-[24px] lg:bg-white lg:p-6 lg:border lg:border-[#E5E7EB] lg:shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      {/* Mobile: full-bleed horizontal chip strips at the top (career-page style). */}
      <div className="lg:hidden flex flex-col" style={{ gap: "16px" }}>
        <MobileChipStrip label="Country" rows={countryRows} />
        <MobileChipStrip label="Year" rows={yearRows} />
      </div>

      <div className="hidden lg:block">
        <div className="flex items-center gap-2" style={{ marginBottom: "24px" }}>
          <FilterIcon />
          <span
            className="font-display font-semibold text-body-lg"
            style={{ color: "#0F172A", letterSpacing: "-0.01em" }}
          >
            Filter BY
          </span>
        </div>

        <FilterSectionLabel>COUNTRY</FilterSectionLabel>
        <div className="flex flex-col" style={{ gap: "10px" }}>
          {countryRows.map(({ key, ...row }) => (
            <FilterRow key={key} {...row} />
          ))}
        </div>

        <div style={{ height: "1px", background: "#E5E7EB", margin: "20px 0" }} />

        <FilterSectionLabel>YEAR</FilterSectionLabel>
        <div className="flex flex-col" style={{ gap: "10px" }}>
          {yearRows.map(({ key, ...row }) => (
            <FilterRow key={key} {...row} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function FilterSectionLabel({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <p
      className="font-sans uppercase text-body-xs"
      style={{
        letterSpacing: "0.08em",
        color: "#1A1A1A",
        marginBottom: "12px",
        fontWeight: 500,
      }}
    >
      {children}
    </p>
  );
}

interface FilterRowProps {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}

function FilterRow({
  label,
  icon,
  selected,
  onClick,
}: FilterRowProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex items-center justify-between transition-colors w-full cursor-pointer"
      style={{
        height: "44px",
        padding: "0 12px",
        borderRadius: "10px",
        background: selected ? "#EDE9FE" : "#FFFFFF",
        border: `1px solid ${selected ? "#C4B5FD" : "#E5E7EB"}`,
        color: selected ? "#5B33F3" : "#0F172A",
      }}
    >
      <span className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex items-center justify-center"
          style={{
            width: "20px",
            height: "20px",
            color: selected ? "#5B33F3" : "#0F172A",
          }}
        >
          {icon}
        </span>
        <span
          className="font-sans text-body-sm"
          style={{ fontWeight: 500, lineHeight: 1 }}
        >
          {label}
        </span>
      </span>
      <Checkbox checked={selected} />
    </button>
  );
}

interface ChipRow {
  key: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

function MobileChipStrip({
  label,
  rows,
}: {
  label: string;
  rows: ChipRow[];
}): React.ReactElement {
  return (
    <div>
      <p
        className="font-sans uppercase px-1"
        style={{
          fontSize: "11px",
          letterSpacing: "0.08em",
          color: "rgba(17,17,17,0.6)",
          fontWeight: 500,
          marginBottom: "8px",
        }}
      >
        {label}
      </p>
      {/* Full-bleed to the container's mobile gutter, scrollbar hidden. */}
      <div className="-mx-6 px-6 sm:-mx-10 sm:px-10 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-2 min-w-max">
          {rows.map((row) => (
            <button
              key={row.key}
              type="button"
              onClick={row.onClick}
              aria-pressed={row.selected}
              className="block whitespace-nowrap font-sans shrink-0 cursor-pointer transition-colors"
              style={{
                fontSize: "var(--fs-body-sm)",
                fontWeight: 500,
                padding: "8px 14px",
                borderRadius: "999px",
                border: `1px solid ${row.selected ? "#4a3bf1" : "rgba(17,17,17,0.12)"}`,
                color: row.selected ? "#4a3bf1" : "rgba(17,17,17,0.78)",
                background: row.selected ? "rgba(74,59,241,0.08)" : "white",
              }}
            >
              {row.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }): React.ReactElement {
  return (
    <span
      aria-hidden
      className="flex items-center justify-center"
      style={{
        width: "20px",
        height: "20px",
        borderRadius: "4px",
        background: checked ? "#5B33F3" : "transparent",
        border: `1.5px solid ${checked ? "#5B33F3" : "#C7B8FE"}`,
        transition: "background 120ms",
      }}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M2.5 6.5l2.4 2.4 5-5"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

function FilterIcon(): React.ReactElement {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 5h18l-7 8.5V20l-4-2v-4.5L3 5z"
        stroke="#0F172A"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
function CalendarIcon(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect
        x="2.5"
        y="3.5"
        width="13"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M2.5 7.5h13" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M6 1.5v3M12 1.5v3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
function GlobeIcon(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M9 2.5c2 2.5 2 10.5 0 13M9 2.5c-2 2.5-2 10.5 0 13M2.5 9h13"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
function PinIcon(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M9 16s5-4.5 5-9a5 5 0 10-10 0c0 4.5 5 9 5 9z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="9" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
