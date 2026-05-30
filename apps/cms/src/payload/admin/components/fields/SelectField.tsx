'use client';

import { useField } from '@payloadcms/ui';
import type { SelectFieldClientProps } from 'payload';
import type { CSSProperties, KeyboardEvent, ReactElement } from 'react';
import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type StoredValue = string | string[] | null | undefined;

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

export const SelectField = (props: SelectFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, disabled, showError, errorMessage } = useField<StoredValue>({ path });

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const inputId = useId();
  const listboxId = useId();

  // The dropdown is rendered in a portal on document.body (position:
  // fixed) so it escapes the array-row's `overflow: hidden` clip — inside
  // a `.cs-array__row` an absolutely-positioned menu was cut off and
  // invisible. We track the control's viewport rect to anchor it.
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const measure = useCallback((): void => {
    const el = controlRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuRect({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  // Re-measure on open and whenever the selection count changes (adding
  // chips can wrap the control onto a new line, moving the anchor), and
  // keep the portaled menu pinned to the control while scrolling/resizing.
  const selectedCount = Array.isArray(value) ? value.length : value == null ? 0 : 1;
  // biome-ignore lint/correctness/useExhaustiveDependencies: selectedCount is intentionally a trigger — its change must re-run measure() to reposition the portal when chips wrap the control.
  useLayoutEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [open, selectedCount, measure]);

  const hasMany = field.hasMany === true;
  const readOnly = field.admin?.readOnly === true;
  // Merge access-control driven disabled with field.admin.readOnly
  const isInteractive = !disabled && !readOnly;
  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;

  const options = (field.options ?? []).map((o) => {
    if (typeof o === 'string') return { value: o, label: o };
    return {
      value: String(o.value),
      label: labelOf((o as { label?: unknown }).label) || String(o.value),
    };
  });

  const selected: string[] =
    value == null ? [] : Array.isArray(value) ? value.map(String) : [String(value)];

  const filtered = options.filter(
    (opt) =>
      (hasMany ? !selected.includes(opt.value) : true) &&
      opt.label.toLowerCase().includes(query.toLowerCase()),
  );

  const labelFor = (val: string): string => options.find((o) => o.value === val)?.label ?? val;

  const pick = (val: string): void => {
    if (hasMany) {
      setValue([...selected, val]);
      setQuery('');
      setActiveIdx(0);
      inputRef.current?.focus();
    } else {
      setValue(val);
      setOpen(false);
      setQuery('');
    }
  };

  const remove = (val: string): void => {
    setValue(hasMany ? selected.filter((v) => v !== val) : null);
  };

  const clear = (): void => {
    setValue(hasMany ? [] : null);
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
      if (opt) pick(opt.value);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    } else if (e.key === 'Backspace' && query === '' && selected.length > 0 && hasMany) {
      remove(selected[selected.length - 1] as string);
    }
  };

  const isEmpty = selected.length === 0;

  const wrapperClass = [
    'cs-collections-select',
    open ? 'is-open' : '',
    showError ? 'cs-collections-select--error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="field-type select">
      <span className="field-label" id={labelId}>
        {labelText}
        {field.required ? (
          <span className="required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </span>

      <div className={wrapperClass}>
        <div
          ref={controlRef}
          className="cs-collections-select__control"
          onClick={() => isInteractive && inputRef.current?.focus()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && isInteractive) inputRef.current?.focus();
          }}
        >
          {hasMany
            ? selected.map((val) => (
                <span key={val} className="cs-collections-select__tag">
                  {labelFor(val)}
                  {isInteractive && (
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
                  )}
                </span>
              ))
            : null}

          {isInteractive ? (
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls={listboxId}
              aria-activedescendant={
                open && filtered[activeIdx] ? `${listboxId}-opt-${activeIdx}` : undefined
              }
              aria-labelledby={labelId}
              className="cs-collections-select__input"
              value={open ? query : isEmpty ? '' : labelFor(selected[0] as string)}
              placeholder={isEmpty ? 'Select…' : ''}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                setActiveIdx(0);
              }}
              onFocus={(e) => {
                setOpen(true);
                // Switch to query mode so the user can type to filter
                if (!hasMany && !isEmpty) {
                  setQuery('');
                  e.target.select();
                }
              }}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              onKeyDown={onKeyDown}
            />
          ) : !hasMany ? (
            <span
              className="cs-collections-select__input cs-collections-select__input--readonly"
              aria-labelledby={labelId}
            >
              {isEmpty ? <em>No selection</em> : labelFor(selected[0] as string)}
            </span>
          ) : null}

          {!isEmpty && isInteractive && (
            <button
              type="button"
              className="cs-collections-select__reset"
              aria-label="Clear selection"
              onMouseDown={(e) => {
                e.preventDefault();
                clear();
              }}
            >
              {hasMany ? 'Clear' : '×'}
            </button>
          )}
        </div>

        {open && isInteractive && menuRect && typeof document !== 'undefined'
          ? createPortal(
              <div
                id={listboxId}
                // biome-ignore lint/a11y/useSemanticElements: custom select listbox; div is required here because a <select> cannot participate in a combobox composite widget
                role="listbox"
                tabIndex={-1}
                aria-label={labelText}
                aria-multiselectable={hasMany}
                className="cs-collections-select__dropdown cs-collections-select__dropdown--portal"
                style={
                  {
                    top: `${menuRect.top}px`,
                    left: `${menuRect.left}px`,
                    width: `${menuRect.width}px`,
                  } as CSSProperties
                }
                // Keep the input focused (don't let the menu steal it and
                // trigger the input's onBlur close) while interacting.
                onMouseDown={(e) => e.preventDefault()}
              >
                {filtered.length === 0 ? (
                  <div className="cs-collections-select__empty">
                    {query
                      ? 'No matching options'
                      : hasMany
                        ? 'All options selected'
                        : 'No options'}
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
                      aria-selected={selected.includes(opt.value)}
                      className={`cs-collections-select__option${i === activeIdx ? ' is-active' : ''}`}
                      onMouseEnter={() => setActiveIdx(i)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(opt.value);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))
                )}
              </div>,
              document.body,
            )
          : null}
      </div>

      {description ? <p className="field-description">{description}</p> : null}
      {showError && errorMessage ? (
        <output className="field-error" aria-live="polite">
          {errorMessage}
        </output>
      ) : null}
    </div>
  );
};

export default SelectField;
