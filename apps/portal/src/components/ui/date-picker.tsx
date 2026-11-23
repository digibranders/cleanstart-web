"use client";

import { useEffect, useId, useRef, useState } from "react";
import { addDays, fmtLong, isRealDay } from "@/lib/dates";
import { Icon } from "../icon";
import { Scrim } from "./scrim";

interface DatePickerProps {
  /** A YYYY-MM-DD day, or "" for none. */
  value: string;
  onChange: (value: string) => void;
  /** First and last day that can be chosen, as YYYY-MM-DD. */
  min?: string | undefined;
  max?: string | undefined;
  id?: string | undefined;
  /** Trigger style: field (form input) or fsel (toolbar filter). */
  variant?: "field" | "fsel";
  ariaLabel?: string | undefined;
  ariaDescribedBy?: string | undefined;
  invalid?: boolean | undefined;
  disabled?: boolean | undefined;
  placeholder?: string | undefined;
  /** Shows a Clear button; leave off when the field is required. */
  clearable?: boolean | undefined;
}

/** Phosphor calendar-blank, 256 viewbox. */
const CALENDAR =
  "M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const todayIso = (): string => new Date().toISOString().slice(0, 10);
const monthStart = (iso: string): string => `${iso.slice(0, 7)}-01`;
const shiftMonth = (iso: string, by: number): string => {
  const [year = 1970, month = 1] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + by, 1)).toISOString().slice(0, 10);
};
/** Monday-first weekday index of the first of the month. */
const leadingBlanks = (first: string): number => (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
const daysInMonth = (first: string): number => {
  const [year = 1970, month = 1] = first.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
};

/**
 * A date field with its own calendar popover, in place of the browser's date input. The value is a plain YYYY-MM-DD string,
 * the same shape the native input gave, so callers keep their state and validation. Arrow keys move between days,
 * Enter picks, Escape closes.
 */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  id,
  variant = "field",
  ariaLabel,
  ariaDescribedBy,
  invalid,
  disabled,
  placeholder = "Pick a date",
  clearable,
}: DatePickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const autoId = useId();
  const triggerId = id ?? autoId;
  const selected = isRealDay(value) ? value : "";
  const [cursor, setCursor] = useState<string>(selected || todayIso());
  const [view, setView] = useState<string>(monthStart(selected || todayIso()));
  const grid = useRef<HTMLDivElement>(null);
  const focusOnRender = useRef(false);

  const allowed = (iso: string): boolean => (min === undefined || iso >= min) && (max === undefined || iso <= max);

  const openMenu = (): void => {
    const start = selected || todayIso();
    setCursor(start);
    setView(monthStart(start));
    focusOnRender.current = true;
    setOpen(true);
  };

  const close = (): void => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open || !focusOnRender.current) return;
    grid.current?.querySelector<HTMLButtonElement>(`button[data-iso="${cursor}"]`)?.focus();
    focusOnRender.current = false;
  });

  const pick = (iso: string): void => {
    if (!allowed(iso)) return;
    onChange(iso);
    close();
  };

  const move = (iso: string): void => {
    setCursor(iso);
    setView(monthStart(iso));
    focusOnRender.current = true;
  };

  const onGridKey = (event: React.KeyboardEvent): void => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const by = step[event.key];
    if (by !== undefined) {
      event.preventDefault();
      move(addDays(cursor, by));
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      move(shiftMonth(cursor, event.key === "PageUp" ? -1 : 1));
    }
  };

  const first = view;
  const blanks = leadingBlanks(first);
  const total = daysInMonth(first);
  const today = todayIso();
  const [viewYear = 1970, viewMonth = 1] = view.split("-").map(Number);
  const prevBlocked = min !== undefined && view.slice(0, 7) <= min.slice(0, 7);
  const nextBlocked = max !== undefined && view.slice(0, 7) >= max.slice(0, 7);

  return (
    <div className={`dd${variant === "field" ? " dd-full" : ""}`}>
      <button
        type="button"
        id={triggerId}
        className={`dd-btn ${variant}${invalid ? " field-err" : ""}${selected ? "" : " dp-empty"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
      >
        <span>{selected ? fmtLong(selected) : placeholder}</span>
        <Icon d={CALENDAR} className="dp-ic" />
      </button>
      {open ? (
        <>
          <Scrim className="dd-scrim" onClose={close} />
          <div className="dd-menu dp" role="dialog" aria-label="Choose a date">
            <div className="dp-head">
              <button type="button" className="dp-nav" aria-label="Previous month" disabled={prevBlocked} onClick={() => setView(shiftMonth(view, -1))}>
                <Icon name="caret" className="ic dp-prev" />
              </button>
              <span className="dp-title" aria-live="polite">
                {MONTHS[viewMonth - 1]} {viewYear}
              </span>
              <button type="button" className="dp-nav" aria-label="Next month" disabled={nextBlocked} onClick={() => setView(shiftMonth(view, 1))}>
                <Icon name="caret" className="ic dp-next" />
              </button>
            </div>
            <div className="dp-week" aria-hidden="true">
              {WEEKDAYS.map((d) => (
                <span key={d}>{d.slice(0, 2)}</span>
              ))}
            </div>
            <div className="dp-grid" ref={grid}>
              {Array.from({ length: blanks }, (_, i) => (
                <span key={`b${i}`} />
              ))}
              {Array.from({ length: total }, (_, i) => {
                const day = i + 1;
                const iso = `${view.slice(0, 8)}${String(day).padStart(2, "0")}`;
                const ok = allowed(iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    data-iso={iso}
                    tabIndex={iso === cursor ? 0 : -1}
                    disabled={!ok}
                    aria-label={fmtLong(iso)}
                    aria-pressed={iso === selected}
                    className={`dp-day${iso === selected ? " dp-on" : ""}${iso === today ? " dp-today" : ""}`}
                    onClick={() => pick(iso)}
                    onKeyDown={onGridKey}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="dp-foot">
              {clearable && selected ? (
                <button type="button" className="dp-link" onClick={() => {
                    onChange("");
                    close();
                  }}>
                  Clear
                </button>
              ) : (
                <span />
              )}
              <button type="button" className="dp-link" disabled={!allowed(today)} onClick={() => pick(today)}>
                Today
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
