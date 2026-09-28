'use client';

import { Popover } from '@cleanstart/ui';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

export type FilterPillOption = { readonly label: string; readonly value: string };

type Props = {
  readonly label: string;
  readonly options: ReadonlyArray<FilterPillOption>;
  readonly selected: ReadonlyArray<string>;
  readonly onChange: (next: ReadonlyArray<string>) => void;
  readonly loading?: boolean;
};

/** Above this many options, show a search box inside the popover. */
const SEARCH_THRESHOLD = 8;

/**
 * One filter in the `ListFilterBar` row: a pill button showing the field
 * label + active count, opening a checkbox popover on click. Fully
 * controlled — the parent owns selection state and derives the list-view
 * `where` clause from it.
 */
export const MultiSelectFilterPill = (props: Props): ReactElement => {
  const { label, options, selected, onChange, loading = false } = props;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  const filtered = useMemo(() => {
    if (query.trim().length === 0) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (value: string): void => {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );
  };

  const isActive = selected.length > 0;

  return (
    <div className="cs-filter-pill">
      <button
        ref={triggerRef}
        type="button"
        className={`cs-filter-pill__trigger${isActive ? ' is-active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{label}</span>
        {isActive ? <span className="cs-filter-pill__count">{selected.length}</span> : null}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
          className="cs-filter-pill__chevron"
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        ariaLabel={`Filter by ${label.toLowerCase()}`}
        className="cs-filter-pill__popover"
      >
        <div className="cs-filter-pill__header">
          <span>{label}</span>
          <button
            type="button"
            className="cs-filter-pill__close"
            onClick={() => setOpen(false)}
            aria-label={`Close ${label.toLowerCase()} filter`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path
                d="M1 1L9 9M9 1L1 9"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {options.length > SEARCH_THRESHOLD ? (
          <input
            ref={searchRef}
            type="search"
            className="cs-filter-pill__search"
            placeholder={`Search ${label.toLowerCase()}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        ) : null}
        {/* biome-ignore lint/a11y/useSemanticElements: this groups checkbox options inside a popover, not a <form> — a <fieldset> here would need a wrapping <form> it doesn't have */}
        <div className="cs-filter-pill__list" role="group" aria-label={label}>
          {loading ? (
            <div className="cs-filter-pill__empty">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="cs-filter-pill__empty">No matches.</div>
          ) : (
            filtered.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <label key={opt.value} className="cs-filter-pill__option">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })
          )}
        </div>
        <div className="cs-filter-pill__footer">
          {isActive ? (
            <button type="button" className="cs-filter-pill__clear" onClick={() => onChange([])}>
              Clear
            </button>
          ) : (
            <span />
          )}
          <button type="button" className="cs-filter-pill__done" onClick={() => setOpen(false)}>
            Done
          </button>
        </div>
      </Popover>
    </div>
  );
};
