'use client';

import type { ChangeEvent, KeyboardEvent, ReactElement, ReactNode } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { Spinner } from './Spinner';

export type ComboboxOption<TValue extends string | number = string> = {
  readonly value: TValue;
  readonly label: string;
  readonly description?: string;
  readonly thumb?: string | null;
  readonly disabled?: boolean;
};

type Props<TValue extends string | number = string> = {
  readonly options: ReadonlyArray<ComboboxOption<TValue>>;
  readonly value?: TValue | null;
  readonly onChange: (value: TValue, option: ComboboxOption<TValue>) => void;
  readonly query: string;
  readonly onQueryChange: (next: string) => void;
  readonly placeholder?: string;
  readonly loading?: boolean;
  readonly emptyLabel?: string;
  readonly autoFocus?: boolean;
  /** Optional render override for an option row. */
  readonly renderOption?: (option: ComboboxOption<TValue>) => ReactNode;
  readonly ariaLabel?: string;
  readonly className?: string;
};

/**
 * Filterable list primitive — input + virtualised-friendly list. Keyboard:
 * ArrowUp/Down to move, Home/End jump, Enter selects, Esc clears query.
 * Filtering is *not* done here: the parent owns `query` + `options`, so
 * async data sources (REST, search-as-you-type) work without forks.
 */
export const Combobox = <TValue extends string | number = string>(
  props: Props<TValue>,
): ReactElement => {
  const {
    options,
    value,
    onChange,
    query,
    onQueryChange,
    placeholder = 'Search…',
    loading = false,
    emptyLabel = 'No results.',
    autoFocus = false,
    renderOption,
    ariaLabel,
    className,
  } = props;

  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [activeIdx, setActiveIdx] = useState<number>(-1);

  const enabledIndexes = useMemo(
    () => options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0),
    [options],
  );

  useEffect(() => {
    const first = enabledIndexes[0];
    if (first === undefined) {
      setActiveIdx(-1);
      return;
    }
    if (value != null) {
      const idx = options.findIndex((o) => o.value === value);
      const matched = idx >= 0 ? options[idx] : undefined;
      if (matched && !matched.disabled) {
        setActiveIdx(idx);
        return;
      }
    }
    setActiveIdx(first);
  }, [enabledIndexes, options, value]);

  useEffect(() => {
    if (!autoFocus) return;
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [autoFocus]);

  const moveActive = (delta: number): void => {
    if (enabledIndexes.length === 0) return;
    const currentPos = enabledIndexes.indexOf(activeIdx);
    const nextPos = (currentPos + delta + enabledIndexes.length) % enabledIndexes.length;
    const next = enabledIndexes[nextPos];
    if (next !== undefined) setActiveIdx(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveActive(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      const first = enabledIndexes[0];
      if (first !== undefined) setActiveIdx(first);
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = enabledIndexes[enabledIndexes.length - 1];
      if (last !== undefined) setActiveIdx(last);
    } else if (e.key === 'Enter') {
      const opt = options[activeIdx];
      if (opt && !opt.disabled) {
        e.preventDefault();
        onChange(opt.value, opt);
      }
    } else if (e.key === 'Escape' && query.length > 0) {
      e.preventDefault();
      onQueryChange('');
    }
  };

  const onInput = (e: ChangeEvent<HTMLInputElement>): void => {
    onQueryChange(e.target.value);
  };

  const composed = ['cs-combobox', className].filter(Boolean).join(' ');
  const activeId = activeIdx >= 0 ? `${listboxId}-opt-${activeIdx}` : undefined;

  return (
    <div className={composed}>
      <div className="cs-combobox__field">
        <input
          ref={inputRef}
          type="search"
          className="cs-combobox__input"
          placeholder={placeholder}
          value={query}
          onChange={onInput}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-label={ariaLabel}
        />
        {loading ? (
          <span className="cs-combobox__loading">
            <Spinner size="sm" label="Searching" />
          </span>
        ) : null}
      </div>
      <div
        ref={listRef}
        id={listboxId}
        // biome-ignore lint/a11y/useSemanticElements: native <select> can't host the custom-styled, async-loading option rows this combobox needs
        role="listbox"
        tabIndex={-1}
        className="cs-combobox__list"
        aria-label={ariaLabel}
      >
        {options.length === 0 && !loading ? (
          <div className="cs-combobox__empty">{emptyLabel}</div>
        ) : (
          options.map((opt, i) => {
            const isActive = i === activeIdx;
            const isSelected = value != null && value === opt.value;
            return (
              <button
                key={`${opt.value}`}
                id={`${listboxId}-opt-${i}`}
                type="button"
                // biome-ignore lint/a11y/useSemanticElements: this option lives inside a custom listbox (see note above); native <option> isn't valid outside <select>
                role="option"
                aria-selected={isSelected}
                disabled={opt.disabled}
                className={[
                  'cs-combobox__option',
                  isActive ? 'is-active' : '',
                  isSelected ? 'is-selected' : '',
                  opt.disabled ? 'is-disabled' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => {
                  if (!opt.disabled) setActiveIdx(i);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => {
                  if (!opt.disabled) onChange(opt.value, opt);
                }}
              >
                {renderOption ? (
                  renderOption(opt)
                ) : (
                  <>
                    {opt.thumb ? (
                      <img className="cs-combobox__thumb" src={opt.thumb} alt="" />
                    ) : null}
                    <span className="cs-combobox__option-text">
                      <span className="cs-combobox__option-label">{opt.label}</span>
                      {opt.description ? (
                        <span className="cs-combobox__option-description">{opt.description}</span>
                      ) : null}
                    </span>
                  </>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
