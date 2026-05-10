'use client';

import type { ChangeEvent, ReactElement } from 'react';
import { useId, useMemo, useRef, useState } from 'react';

import { Popover } from './Popover';

type Mode = 'date' | 'datetime';

type Props = {
  readonly value: string | null;
  readonly onChange: (next: string | null) => void;
  readonly mode?: Mode;
  /** ISO timezone string, e.g. "Asia/Kolkata". Display-only; storage is UTC ISO. */
  readonly timezone?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly id?: string;
  readonly ariaLabel?: string;
  readonly minDate?: string;
  readonly maxDate?: string;
};

const pad = (n: number): string => `${n}`.padStart(2, '0');

const fmtMonthYear = (d: Date): string =>
  d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

const startOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1);

const buildGrid = (anchor: Date): Array<Date> => {
  const first = startOfMonth(anchor);
  const startDow = first.getDay();
  const start = new Date(first);
  start.setDate(first.getDate() - startDow);
  const days: Array<Date> = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
};

const sameDay = (a: Date, b: Date | null): boolean =>
  !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatStorage = (date: Date, mode: Mode): string => {
  if (mode === 'date') {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  return date.toISOString();
};

const formatDisplay = (iso: string | null, mode: Mode, tz: string | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (mode === 'date') {
    return d.toLocaleDateString(undefined, { timeZone: tz });
  }
  return d.toLocaleString(undefined, {
    timeZone: tz,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

/**
 * Calendar + time picker. Replaces stock react-datepicker. Storage is
 * always ISO; display is locale + optional timezone (used by schedule-
 * publish modal so editors see "Pacific" instead of UTC drift).
 */
export const DateTimePicker = (props: Props): ReactElement => {
  const {
    value,
    onChange,
    mode = 'date',
    timezone,
    placeholder = 'Select date…',
    disabled = false,
    required = false,
    id,
    ariaLabel,
    minDate,
    maxDate,
  } = props;
  const fallbackId = useId();
  const triggerId = id ?? fallbackId;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  const valueDate = useMemo(() => (value ? new Date(value) : null), [value]);
  const [anchorMonth, setAnchorMonth] = useState<Date>(() => valueDate ?? new Date());

  const grid = useMemo(() => buildGrid(anchorMonth), [anchorMonth]);
  const min = minDate ? new Date(minDate) : null;
  const max = maxDate ? new Date(maxDate) : null;

  const onPickDay = (d: Date): void => {
    const next = valueDate ? new Date(valueDate) : new Date();
    next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    if (mode === 'date') {
      next.setHours(0, 0, 0, 0);
    }
    onChange(formatStorage(next, mode));
    if (mode === 'date') setOpen(false);
  };

  const onTimeChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const parts = e.target.value.split(':').map((p) => Number.parseInt(p, 10));
    const hh = parts[0];
    const mm = parts[1];
    if (hh === undefined || mm === undefined || Number.isNaN(hh) || Number.isNaN(mm)) return;
    const next = valueDate ? new Date(valueDate) : new Date();
    next.setHours(hh, mm, 0, 0);
    onChange(formatStorage(next, mode));
  };

  const display = formatDisplay(value, mode, timezone);

  return (
    <div className="cs-datetime">
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className="cs-datetime__trigger"
        aria-label={ariaLabel ?? placeholder}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className={display ? 'cs-datetime__value' : 'cs-datetime__placeholder'}>
          {display || placeholder}
        </span>
        {value && !required && !disabled ? (
          <span
            role="button"
            tabIndex={0}
            className="cs-datetime__clear"
            aria-label="Clear"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onChange(null);
              }
            }}
          >
            ×
          </span>
        ) : null}
      </button>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        placement="bottom-start"
        ariaLabel="Date picker"
      >
        <div className="cs-datetime__panel">
          <header className="cs-datetime__panel-header">
            <button
              type="button"
              className="cs-datetime__nav"
              onClick={() => setAnchorMonth(new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() - 1, 1))}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="cs-datetime__month-year">{fmtMonthYear(anchorMonth)}</span>
            <button
              type="button"
              className="cs-datetime__nav"
              onClick={() => setAnchorMonth(new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() + 1, 1))}
              aria-label="Next month"
            >
              ›
            </button>
          </header>
          <div className="cs-datetime__weekdays" aria-hidden="true">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
              <span key={`dow-${i}`}>{w}</span>
            ))}
          </div>
          <div className="cs-datetime__grid" role="grid">
            {grid.map((d, i) => {
              const inMonth = d.getMonth() === anchorMonth.getMonth();
              const blocked = (min && d < min) || (max && d > max);
              const selected = sameDay(d, valueDate);
              const today = sameDay(d, new Date());
              return (
                <button
                  key={`d-${i}`}
                  type="button"
                  role="gridcell"
                  className={[
                    'cs-datetime__day',
                    inMonth ? '' : 'is-out',
                    selected ? 'is-selected' : '',
                    today ? 'is-today' : '',
                    blocked ? 'is-blocked' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={!!blocked}
                  onClick={() => onPickDay(d)}
                  aria-pressed={selected}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          {mode === 'datetime' ? (
            <footer className="cs-datetime__panel-footer">
              <label className="cs-datetime__time">
                <span>Time</span>
                <input
                  type="time"
                  value={
                    valueDate
                      ? `${pad(valueDate.getHours())}:${pad(valueDate.getMinutes())}`
                      : ''
                  }
                  onChange={onTimeChange}
                />
              </label>
              {timezone ? <span className="cs-datetime__tz">{timezone}</span> : null}
            </footer>
          ) : null}
        </div>
      </Popover>
    </div>
  );
};
