"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { WebinarRegion, WebinarType } from "@/lib/webinars";
import {
  FILTERABLE_REGIONS,
  FILTERABLE_TYPES,
  REGION_LABEL,
  WEBINAR_TYPE_LABEL,
} from "@/lib/webinars-utils";

interface WebinarFiltersProps {
  activeType?: WebinarType | undefined;
  activeRegion?: WebinarRegion | undefined;
}

export function WebinarFilters({
  activeType,
  activeRegion,
}: WebinarFiltersProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void): void => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      next.delete("page");
      const qs = next.toString();
      router.push(qs ? `/webinars?${qs}` : "/webinars", { scroll: false });
    },
    [router, searchParams],
  );

  const setType = useCallback(
    (value: WebinarType | null): void => {
      pushParams((p) => {
        if (value) p.set("type", value);
        else p.delete("type");
      });
    },
    [pushParams],
  );

  const setRegion = useCallback(
    (value: WebinarRegion | null): void => {
      pushParams((p) => {
        if (value) p.set("region", value);
        else p.delete("region");
      });
    },
    [pushParams],
  );

  const typeRows = useMemo(
    () => [
      {
        key: "all-types" as const,
        label: "All Webinars",
        icon: <CalendarIcon />,
        selected: activeType === undefined,
        onClick: () => setType(null),
      },
      ...FILTERABLE_TYPES.map((t) => ({
        key: t,
        label: WEBINAR_TYPE_LABEL[t],
        icon: t === "live" ? <BroadcastIcon /> : <OnDemandIcon />,
        selected: activeType === t,
        onClick: () => setType(t),
      })),
    ],
    [activeType, setType],
  );

  const regionRows = useMemo(
    () => [
      {
        key: "all-regions" as const,
        label: "All Regions",
        icon: <GlobeIcon />,
        selected: activeRegion === undefined,
        onClick: () => setRegion(null),
      },
      ...FILTERABLE_REGIONS.map((r) => ({
        key: r,
        label: REGION_LABEL[r],
        icon: <PinIcon />,
        selected: activeRegion === r,
        onClick: () => setRegion(r),
      })),
    ],
    [activeRegion, setRegion],
  );

  const activeCount =
    (activeType !== undefined ? 1 : 0) + (activeRegion !== undefined ? 1 : 0);

  return (
    <aside
      aria-label="Filter webinars"
      // Mobile: full-width <details> disclosure; collapses by default so the
      // listing isn't crushed by the 299px sidebar. lg+: sticky white-card
      // sidebar as before.
      className="w-full lg:w-[299px] rounded-2xl bg-white lg:p-6 lg:border lg:border-[#E5E7EB] lg:shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      {/* MOBILE (< lg) — native <details> disclosure */}
      <details className="lg:hidden group rounded-2xl border border-[#E5E7EB] bg-white">
        <summary
          className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden"
        >
          <span className="flex items-center gap-2">
            <FilterIcon />
            <span
              className="font-display font-semibold"
              style={{ fontSize: "16px", color: "#0F172A", letterSpacing: "-0.01em" }}
            >
              Filter
            </span>
            {activeCount > 0 && (
              <span
                aria-label={`${activeCount} active filter${activeCount === 1 ? "" : "s"}`}
                className="flex items-center justify-center rounded-full bg-[#5B33F3] text-white"
                style={{ width: "20px", height: "20px", fontSize: "12px", fontWeight: 600 }}
              >
                {activeCount}
              </span>
            )}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className="transition-transform group-open:rotate-180"
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="#0F172A"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>

        <div className="px-4 pb-4 pt-2">
          <FilterSectionLabel>CATEGORIES</FilterSectionLabel>
          <div className="flex flex-col" style={{ gap: "10px" }}>
            {typeRows.map(({ key, ...row }) => (
              <FilterRow key={key} {...row} />
            ))}
          </div>

          <div style={{ height: "1px", background: "#E5E7EB", margin: "20px 0" }} />

          <FilterSectionLabel>REGION</FilterSectionLabel>
          <div className="flex flex-col" style={{ gap: "10px" }}>
            {regionRows.map(({ key, ...row }) => (
              <FilterRow key={key} {...row} />
            ))}
          </div>
        </div>
      </details>

      {/* DESKTOP (lg+) — existing sticky sidebar layout */}
      <div className="hidden lg:block">
        <div className="flex items-center gap-2" style={{ marginBottom: "24px" }}>
          <FilterIcon />
          <span
            className="font-display font-semibold"
            style={{ fontSize: "18px", color: "#0F172A", letterSpacing: "-0.01em" }}
          >
            Filter BY
          </span>
        </div>

        <FilterSectionLabel>CATEGORIES</FilterSectionLabel>
        <div className="flex flex-col" style={{ gap: "10px" }}>
          {typeRows.map(({ key, ...row }) => (
            <FilterRow key={key} {...row} />
          ))}
        </div>

        <div style={{ height: "1px", background: "#E5E7EB", margin: "20px 0" }} />

        <FilterSectionLabel>REGION</FilterSectionLabel>
        <div className="flex flex-col" style={{ gap: "10px" }}>
          {regionRows.map(({ key, ...row }) => (
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
        fontSize: "12px",
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
          className="font-sans"
          style={{ fontSize: "14px", fontWeight: 500, lineHeight: 1 }}
        >
          {label}
        </span>
      </span>
      <Checkbox checked={selected} />
    </button>
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

/* ---------- Icons (currentColor, inherited from row state) ---------- */

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
function BroadcastIcon(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="2" fill="currentColor" />
      <path
        d="M5.5 12.5a5 5 0 010-7M12.5 5.5a5 5 0 010 7M3 15a9 9 0 010-12M15 3a9 9 0 010 12"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
function OnDemandIcon(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect
        x="2"
        y="6"
        width="14"
        height="10"
        rx="1.6"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6 6L9 2.5 12 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
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
