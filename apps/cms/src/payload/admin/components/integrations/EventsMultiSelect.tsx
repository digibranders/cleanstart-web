'use client';

import { useField } from '@payloadcms/ui';
import type { KeyboardEvent, ReactElement } from 'react';
import { useId, useRef, useState } from 'react';

const OPTIONS = [
  {
    label: 'document.published',
    sublabel: 'on first publish of a content doc',
    value: 'document.published',
  },
  {
    label: 'lead.submitted',
    sublabel: 'on every public form submission',
    value: 'lead.submitted',
  },
] as const;

interface Props {
  path?: string;
}

export const EventsMultiSelect = ({ path = 'routing.events' }: Props): ReactElement => {
  const { value, setValue } = useField<string[]>({ path });
  const selected: string[] = value ?? [];

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const listboxId = useId();

  const isAll = selected.length === 0;

  const filtered = OPTIONS.filter(
    (opt) =>
      !selected.includes(opt.value) &&
      (opt.label.toLowerCase().includes(query.toLowerCase()) ||
        opt.sublabel.toLowerCase().includes(query.toLowerCase())),
  );

  const add = (val: string): void => {
    setValue([...selected, val]);
    setQuery('');
    setActiveIdx(0);
    inputRef.current?.focus();
  };

  const remove = (val: string): void => {
    setValue(selected.filter((v) => v !== val));
  };

  const resetToAll = (): void => {
    setValue([]);
    setQuery('');
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[activeIdx];
      if (opt) add(opt.value);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    } else if (e.key === 'Backspace' && query === '' && selected.length > 0) {
      remove(selected[selected.length - 1] as string);
    }
  };

  const labelFor = (val: string): string =>
    OPTIONS.find((o) => o.value === val)?.label ?? val;

  return (
    <div className="cs-cms-field">
      <div className="field-label">
        <label htmlFor={inputId}>Events</label>
        <span className="cs-cms-field__desc">
          Choose which site events trigger a notification.
        </span>
      </div>

      <div className={`cs-collections-select${open ? ' is-open' : ''}`}>
        <div
          className="cs-collections-select__control"
          onClick={() => inputRef.current?.focus()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.focus();
          }}
        >
          {isAll ? (
            <span className="cs-collections-select__tag cs-collections-select__tag--all">
              All events
            </span>
          ) : (
            <>
              {selected.map((val) => (
                <span key={val} className="cs-collections-select__tag">
                  {labelFor(val)}
                  <button
                    type="button"
                    className="cs-collections-select__tag-remove"
                    aria-label={`Remove ${labelFor(val)}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      remove(val);
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </>
          )}
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={
              open && filtered[activeIdx]
                ? `${listboxId}-opt-${activeIdx}`
                : undefined
            }
            className="cs-collections-select__input"
            value={query}
            placeholder={isAll ? 'Filter to specific events…' : ''}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIdx(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setTimeout(() => setOpen(false), 150);
            }}
            onKeyDown={onKeyDown}
          />
          {!isAll && (
            <button
              type="button"
              className="cs-collections-select__reset"
              aria-label="Reset to all events"
              onMouseDown={(e) => {
                e.preventDefault();
                resetToAll();
              }}
            >
              Reset to all
            </button>
          )}
        </div>

        {open && (
          <div
            id={listboxId}
            // biome-ignore lint/a11y/useSemanticElements: custom multi-select listbox; div is required here because a <select> cannot participate in a combobox composite widget
            role="listbox"
            tabIndex={-1}
            aria-label="Events"
            aria-multiselectable="true"
            className="cs-collections-select__dropdown"
          >
            {!isAll && (
              <button
                type="button"
                // biome-ignore lint/a11y/useSemanticElements: option inside a custom listbox; native <option> is only valid inside <select>
                role="option"
                tabIndex={-1}
                aria-selected={false}
                className="cs-collections-select__option cs-collections-select__option--all"
                onMouseDown={(e) => {
                  e.preventDefault();
                  resetToAll();
                }}
              >
                ✕ All events (clear filter)
              </button>
            )}
            {filtered.length === 0 && isAll ? (
              <div className="cs-collections-select__empty">
                All events are already included
              </div>
            ) : filtered.length === 0 ? (
              <div className="cs-collections-select__empty">
                {query ? 'No matching events' : 'All events selected'}
              </div>
            ) : (
              filtered.map((opt, i) => (
                <button
                  key={opt.value}
                  id={`${listboxId}-opt-${i}`}
                  type="button"
                  // biome-ignore lint/a11y/useSemanticElements: option inside a custom listbox; native <option> is only valid inside <select>
                  role="option"
                  tabIndex={-1}
                  aria-selected={false}
                  className={`cs-collections-select__option${i === activeIdx ? ' is-active' : ''}`}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(opt.value);
                  }}
                >
                  <span className="cs-collections-select__opt-label">{opt.label}</span>
                  <span className="cs-collections-select__opt-slug">{opt.sublabel}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsMultiSelect;
