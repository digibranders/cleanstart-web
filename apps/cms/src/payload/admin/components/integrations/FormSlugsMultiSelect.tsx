'use client';

import { useConfig, useField } from '@payloadcms/ui';
import type { KeyboardEvent, ReactElement } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

interface FormOption {
  label: string;
  value: string;
}

const fetchForms = async (serverURL: string): Promise<FormOption[]> => {
  const res = await fetch(`${serverURL}/api/forms?limit=100&depth=0`, {
    credentials: 'include',
  });
  if (!res.ok) return [];
  const body = (await res.json()) as { docs?: Array<{ name?: string; slug?: string }> };
  return (body.docs ?? [])
    .filter((d) => d.slug)
    .map((d) => ({ label: d.name ?? d.slug ?? '', value: d.slug as string }));
};

interface Props {
  path?: string;
}

export const FormSlugsMultiSelect = ({ path = 'routing.formSlugs' }: Props): ReactElement => {
  const { value, setValue } = useField<string[]>({ path });
  const selected: string[] = value ?? [];
  const { config } = useConfig();
  const serverURL = config?.serverURL ?? '';

  const [options, setOptions] = useState<FormOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const listboxId = useId();

  useEffect(() => {
    if (!serverURL) return;
    let cancelled = false;
    setLoading(true);
    setFetchError(false);
    fetchForms(serverURL)
      .then((opts) => {
        if (!cancelled) setOptions(opts);
      })
      .catch(() => {
        if (!cancelled) {
          setOptions([]);
          setFetchError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serverURL]);

  const isAll = selected.length === 0;

  const filtered = options.filter(
    (opt) =>
      !selected.includes(opt.value) &&
      (opt.label.toLowerCase().includes(query.toLowerCase()) ||
        opt.value.toLowerCase().includes(query.toLowerCase())),
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
    options.find((o) => o.value === val)?.label ?? val;

  return (
    <div className="cs-cms-field">
      <div className="field-label">
        <label htmlFor={inputId}>Form Slugs</label>
        <span className="cs-cms-field__desc">
          Filter <code>lead.submitted</code> events by form slug.
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
              All forms
            </span>
          ) : (
            selected.map((val) => (
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
            ))
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
            placeholder={
              loading
                ? 'Loading forms…'
                : fetchError
                  ? 'Could not load forms'
                  : isAll
                    ? 'Filter to specific forms…'
                    : ''
            }
            disabled={loading}
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
              aria-label="Reset to all forms"
              onMouseDown={(e) => {
                e.preventDefault();
                resetToAll();
              }}
            >
              Reset to all
            </button>
          )}
        </div>

        {open && !loading && (
          <div
            id={listboxId}
            // biome-ignore lint/a11y/useSemanticElements: custom multi-select listbox; div is required here because a <select> cannot participate in a combobox composite widget
            role="listbox"
            tabIndex={-1}
            aria-label="Form slugs"
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
                ✕ All forms (clear filter)
              </button>
            )}
            {fetchError ? (
              <div className="cs-collections-select__empty cs-collections-select__empty--error">
                Could not load forms — check your connection and try again.
              </div>
            ) : options.length === 0 ? (
              <div className="cs-collections-select__empty">
                No forms found — create a form first.
              </div>
            ) : filtered.length === 0 ? (
              <div className="cs-collections-select__empty">
                {query ? 'No matching forms' : 'All forms selected'}
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
                  <span className="cs-collections-select__opt-slug">{opt.value}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormSlugsMultiSelect;
