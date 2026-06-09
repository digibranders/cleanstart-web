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
      className="w-full lg:w-[295px] lg:rounded-[16px] lg:bg-white lg:px-4 lg:py-[18px] lg:shadow-[0px_3px_7px_0px_rgba(0,0,0,0.02),0px_13px_13px_0px_rgba(0,0,0,0.01),0px_29px_17px_0px_rgba(0,0,0,0.01)]"
    >
      {/* Mobile: full-bleed horizontal chip strips at the top (career-page style). */}
      <div className="lg:hidden flex flex-col" style={{ gap: "16px" }}>
        <MobileChipStrip label="Country" rows={countryRows} />
        <MobileChipStrip label="Year" rows={yearRows} />
      </div>

      <div className="hidden lg:block">
        <FilterSectionLabel>COUNTRY</FilterSectionLabel>
        <div className="flex flex-col" style={{ gap: "6px" }}>
          {countryRows.map(({ key, ...row }) => (
            <FilterRow key={key} {...row} />
          ))}
        </div>

        <div style={{ height: "1px", background: "rgba(17,17,17,0.12)", margin: "14px 0" }} />

        <FilterSectionLabel>YEAR</FilterSectionLabel>
        <div className="flex flex-col" style={{ gap: "6px" }}>
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
      className="font-sans uppercase"
      style={{
        fontSize: "var(--fs-badge)",
        letterSpacing: "0.08em",
        color: "rgba(17,17,17,0.6)",
        marginBottom: "8px",
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
      className="flex items-center gap-2 w-full cursor-pointer transition-colors"
      style={{
        height: "34px",
        padding: "0 12px",
        borderRadius: "10px",
        background: selected ? "rgba(74,59,241,0.08)" : "#ffffff",
        border: `1px solid ${selected ? "rgba(74,59,241,0.35)" : "rgba(17,17,17,0.08)"}`,
        color: selected ? "#4a3bf1" : "#111",
        fontWeight: 500,
      }}
    >
      <span
        aria-hidden
        className="flex items-center justify-center shrink-0"
        style={{
          width: "18px",
          height: "18px",
          color: selected ? "#4a3bf1" : "rgba(17,17,17,0.55)",
        }}
      >
        {icon}
      </span>
      <span
        className="font-sans"
        style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.2 }}
      >
        {label}
      </span>
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
                padding: "5px 12px",
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
