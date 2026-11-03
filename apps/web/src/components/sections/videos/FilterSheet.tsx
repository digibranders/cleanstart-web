"use client";

import { useEffect, useRef } from "react";
import { VIDEO_FORMATS } from "@/lib/videos-catalog";
import type { VideoFilters, VideoSort } from "@/lib/videos-utils";

export interface SheetOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly count?: number;
}

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: VideoFilters;
  onChange: (patch: Partial<VideoFilters>) => void;
  onClear: () => void;
  formatCounts: Record<string, number>;
  topics: readonly SheetOption<string>[];
  sorts: readonly SheetOption<VideoSort>[];
  /** How many videos the current choices show. */
  resultCount: number;
}

const pill = (on: boolean): string =>
  `inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 font-sans text-[15px] font-medium transition-colors duration-200 motion-reduce:transition-none ${
    on
      ? "border-[#151021] bg-[#151021] text-white"
      : "border-[rgba(18,16,28,0.18)] bg-white text-[#3D3A4F]"
  }`;

function Group<T extends string>({
  title,
  value,
  options,
  onPick,
}: {
  title: string;
  value: T;
  options: readonly SheetOption<T>[];
  onPick: (value: T) => void;
}): React.ReactElement {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-3 font-sans text-[13px] font-semibold text-[#5B5870]">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onPick(o.value)} className={pill(o.value === value)}>
            {o.label}
            {o.count !== undefined ? <span className="text-[12px] tabular-nums opacity-70">{o.count}</span> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Phone filter panel: category, topic and sort in one bottom sheet. A native
 * `<dialog>`, so focus is trapped and Escape closes it without extra code.
 * Choices apply as they are made; the footer button just closes the sheet.
 */
export function FilterSheet({
  open,
  onClose,
  filters,
  onChange,
  onClear,
  formatCounts,
  topics,
  sorts,
  resultCount,
}: FilterSheetProps): React.ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    if (!open) return;
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = before;
    };
  }, [open]);

  const formats: SheetOption<string>[] = [
    { value: "all", label: "All", count: formatCounts.all ?? 0 },
    ...VIDEO_FORMATS.map((f) => ({ value: f.id, label: f.label, count: formatCounts[f.id] ?? 0 })),
  ];

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the click only adds backdrop-dismiss; Escape is the dialog's native keyboard close
    <dialog
      ref={dialog}
      aria-label="Filter videos"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-0 mt-auto max-h-[88dvh] w-full max-w-none translate-y-0 rounded-t-[24px] border-0 bg-white p-0 transition-transform duration-300 backdrop:bg-[rgba(10,8,24,0.5)] starting:open:translate-y-full motion-reduce:transition-none md:hidden"
    >
      <div className="flex max-h-[88dvh] flex-col">
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h2 className="font-display text-[20px] font-semibold text-[#12101C]">Filter videos</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex size-10 cursor-pointer items-center justify-center rounded-full text-[#3D3A4F] hover:bg-[#F1EFF8]"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-7 overflow-y-auto px-5 pb-6 pt-3">
          <Group
            title="Category"
            value={filters.format ?? "all"}
            options={formats}
            onPick={(v) => onChange({ format: v === "all" ? undefined : (v as VideoFilters["format"]) })}
          />
          <Group
            title="Topic"
            value={filters.topic ?? "all"}
            options={[{ value: "all", label: "All topics" }, ...topics]}
            onPick={(v) => onChange({ topic: v === "all" ? undefined : v })}
          />
          <Group title="Sort" value={filters.sort} options={sorts} onPick={(v) => onChange({ sort: v })} />
        </div>

        <div className="flex items-center gap-3 border-t border-[rgba(18,16,28,0.08)] px-5 py-4">
          <button
            type="button"
            onClick={onClear}
            className="h-12 cursor-pointer px-2 font-sans text-[15px] font-medium text-[#5B2EE0] underline underline-offset-4"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 cursor-pointer rounded-full bg-[#151021] font-sans text-[15px] font-medium text-white active:translate-y-px"
          >
            Show {resultCount} {resultCount === 1 ? "video" : "videos"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
