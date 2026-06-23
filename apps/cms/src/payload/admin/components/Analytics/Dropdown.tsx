'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';

interface Option {
  value: string;
  label: string;
}

/**
 * Small custom dropdown (button trigger + popover menu of buttons) so the
 * OPEN menu is themed — a native <select>'s option list is OS-rendered and
 * can't be styled. Each option is a real <button> (natively focusable +
 * keyboard-operable); closes on outside-click and Escape.
 */
export function Dropdown({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  ariaLabel: string;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="cs-analytics__dd" ref={ref}>
      <button
        type="button"
        className="cs-analytics__dd-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{current?.label ?? ''}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div className="cs-analytics__dd-menu">
          {options.map((o) => (
            <button
              type="button"
              key={o.value}
              className={o.value === value ? 'is-sel' : ''}
              aria-current={o.value === value ? 'true' : undefined}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default Dropdown;
