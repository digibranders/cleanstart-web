'use client';

import { useField } from '@payloadcms/ui';
import type { SelectFieldClientProps } from 'payload';
import type { ReactElement } from 'react';
import { useId, useMemo, useRef, useState } from 'react';

import { Combobox, type ComboboxOption } from '../ui/Combobox';
import { Popover } from '../ui/Popover';

type StoredValue = string | string[] | null | undefined;

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

/**
 * Custom select field. Single + hasMany. Combobox-style trigger →
 * Popover-anchored Combobox listbox. Replaces Payload's stock <select>
 * styling + native dropdown to match the rest of CleanStart admin chrome.
 */
export const SelectField = (props: SelectFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, showError, errorMessage } = useField<StoredValue>({ path });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const labelId = useId();

  const fieldOptions = useMemo<ReadonlyArray<ComboboxOption<string>>>(() => {
    const opts = field.options ?? [];
    return opts.map((o) => {
      if (typeof o === 'string') return { value: o, label: o };
      const optionLabel = labelOf((o as { label?: unknown }).label) || String(o.value);
      return { value: String(o.value), label: optionLabel };
    });
  }, [field.options]);

  const filtered = useMemo<ReadonlyArray<ComboboxOption<string>>>(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return fieldOptions;
    return fieldOptions.filter(
      (o) => o.label.toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q),
    );
  }, [fieldOptions, query]);

  const hasMany = field.hasMany === true;

  const selected = useMemo<ReadonlyArray<string>>(() => {
    if (value == null) return [];
    if (Array.isArray(value)) return value.map(String);
    return [String(value)];
  }, [value]);

  const triggerLabel =
    selected.length === 0
      ? 'Select…'
      : selected
          .map((v) => fieldOptions.find((o) => o.value === v)?.label ?? v)
          .join(', ');

  const handlePick = (v: string): void => {
    if (hasMany) {
      const next = selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v];
      setValue(next);
    } else {
      setValue(v);
      setOpen(false);
    }
  };

  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const readOnly = field.admin?.readOnly === true;

  return (
    <div
      className={`field-type select cs-select-field${
        showError ? ' cs-select-field--error' : ''
      }`}
    >
      <span className="field-label" id={labelId}>
        {labelText}
        {field.required ? (
          <span className="required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </span>
      <button
        ref={triggerRef}
        type="button"
        className="cs-select-field__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        disabled={readOnly}
      >
        <span className="cs-select-field__trigger-text">{triggerLabel}</span>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {description ? <p className="field-description">{description}</p> : null}
      {showError && errorMessage ? (
        <output className="field-error" aria-live="polite">
          {errorMessage}
        </output>
      ) : null}
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        placement="bottom-start"
        ariaLabel={`${labelText} options`}
      >
        <div className="cs-select-field__listbox">
          <Combobox
            options={filtered}
            query={query}
            onQueryChange={setQuery}
            onChange={(v) => handlePick(String(v))}
            autoFocus
            ariaLabel={labelText}
            value={!hasMany ? (selected[0] ?? null) : null}
            renderOption={(opt) => (
              <span className="cs-select-field__option-row">
                <span className="cs-combobox__option-text">
                  <span className="cs-combobox__option-label">{opt.label}</span>
                </span>
                {selected.includes(String(opt.value)) ? (
                  <svg
                    className="cs-select-field__check"
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8l4 4 6-7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </span>
            )}
          />
        </div>
      </Popover>
    </div>
  );
};

export default SelectField;
