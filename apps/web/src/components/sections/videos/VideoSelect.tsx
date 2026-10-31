"use client";

import { Select } from "@base-ui/react/select";

export interface VideoSelectOption<T extends string> {
  readonly value: T;
  readonly label: string;
  /** Shown muted at the right of the row, e.g. how many videos a topic has. */
  readonly count?: number;
}

interface VideoSelectProps<T extends string> {
  /** Accessible name; also shown, muted, before the value in the trigger. */
  readonly label: string;
  readonly value: T;
  readonly options: readonly VideoSelectOption<T>[];
  readonly onChange: (value: T) => void;
  readonly className?: string;
}

/**
 * The site's dropdown for /videos. A button plus a styled listbox, so the open
 * menu matches the page instead of the operating system's. Keyboard, typeahead
 * and screen reader behaviour come from base-ui's Select.
 */
export function VideoSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  className = "",
}: VideoSelectProps<T>): React.ReactElement {
  return (
    <Select.Root
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
      items={options.map((o) => ({ value: o.value, label: o.label }))}
    >
      <Select.Trigger
        aria-label={label}
        className={`inline-flex h-11 min-w-0 cursor-pointer items-center gap-2 rounded-[12px] border border-[rgba(18,16,28,0.18)] bg-white px-3.5 font-sans text-[14px] text-[#12101C] outline-none transition-[border-color,box-shadow] duration-200 hover:border-[#5B2EE0] focus-visible:border-[#5B2EE0] focus-visible:shadow-[0_0_0_4px_rgba(91,46,224,0.14)] data-popup-open:border-[#5B2EE0] motion-reduce:transition-none ${className}`}
      >
        <span className="shrink-0 text-[#6E6A82]">{label}</span>
        <Select.Value className="min-w-0 flex-1 truncate text-left font-medium" />
        <Select.Icon className="shrink-0 text-[#6E6A82]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={8} align="end" alignItemWithTrigger={false} className="z-[60] outline-none">
          <Select.Popup data-lenis-prevent className="max-h-[min(60vh,360px)] min-w-[max(var(--anchor-width),220px)] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-[16px] border border-[rgba(18,16,28,0.1)] bg-white p-1.5 font-sans shadow-[0_18px_48px_rgba(30,18,90,0.18)] outline-none">
            <Select.List className="outline-none">
              {options.map((o) => (
                <Select.Item
                  key={o.value}
                  value={o.value}
                  className="flex min-h-10 cursor-pointer select-none items-center gap-2.5 rounded-[10px] px-3 text-[14px] text-[#12101C] outline-none data-highlighted:bg-[#F1EFF8] data-selected:font-semibold data-selected:text-[#3A1BA8]"
                >
                  <Select.ItemIndicator className="flex size-4 shrink-0 items-center justify-center text-[#5B2EE0]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </Select.ItemIndicator>
                  <Select.ItemText className="flex-1 whitespace-nowrap">{o.label}</Select.ItemText>
                  {o.count !== undefined ? (
                    <span className="text-[12px] tabular-nums text-[#6E6A82]">{o.count}</span>
                  ) : null}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
