"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { searchCountries, type PhoneCountry } from "@/lib/forms/countries";
import {
  digitsOnly,
  formatNational,
  maxNationalDigits,
  parseInternational,
  type PhoneValue,
} from "@/lib/forms/phone-value";

import {
  FIELD_BORDER_ERROR,
  fieldBorderColor,
  fieldSurfaceStyle,
  type FieldHeight,
  type FieldVariant,
} from "./field-surface";
import { FieldShell } from "./FieldShell";

interface PhoneFieldProps {
  id: string;
  label: string;
  value: PhoneValue;
  onChange: (next: PhoneValue) => void;
  required?: boolean | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  size?: FieldHeight | undefined;
  variant?: FieldVariant | undefined;
  className?: string | undefined;
  /** Fires on blur so the caller can validate a field the visitor has left. */
  onBlur?: (() => void) | undefined;
}

/**
 * Phone entry as one control: a country selector carrying the dial code, and a
 * digits-only number input beside it.
 *
 * The country is preselected from the visitor's IP by whoever owns the value
 * (see useDetectedCountry) and stays editable. It doubles as the answer to
 * "which country is this lead in", which is why the forms no longer ask
 * separately.
 *
 * The number input takes digits and nothing else: letters, spaces and
 * punctuation are dropped on the way in rather than rejected afterwards, so
 * pasting "+1 (415) 555-2671" into a US field leaves the right digits behind.
 */
export function PhoneField({
  id,
  label,
  value,
  onChange,
  required = false,
  error,
  hint,
  size = "sm",
  variant = "marketing",
  className,
  onBlur,
}: PhoneFieldProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const listId = useId();
  const results = useMemo(() => searchCountries(query), [query]);

  const invalid = Boolean(error);
  const surface = fieldSurfaceStyle({ variant, size, invalid });
  const restingBorder = fieldBorderColor(variant);

  const closeMenu = (refocusTrigger: boolean): void => {
    setOpen(false);
    setQuery("");
    // preventScroll: focusing normally scrolls the element into view, which
    // would jolt the page every time the menu opens or closes.
    if (refocusTrigger) triggerRef.current?.focus({ preventScroll: true });
  };

  const selectCountry = (country: PhoneCountry): void => {
    // Re-clamp the digits: moving from a 10-digit plan to one with a longer
    // dial code can push an existing number past the E.164 ceiling.
    const capped = value.national.slice(0, maxNationalDigits(country));
    onChange({ country, national: capped });
    closeMenu(true);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (wrapRef.current?.contains(event.target as Node)) return;
      setOpen(false);
      setQuery("");
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Seeds the active row from the current selection when the menu opens.
  // Re-running it on `results` or `value` would fight the arrow keys and snap
  // the highlight back on every keystroke, so `open` is the only trigger.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally open-only, see above
  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus({ preventScroll: true });
    const selected = results.findIndex((country) => country.code === value.country.code);
    setActiveIndex(selected >= 0 ? selected : 0);
  }, [open]);

  // Keeps the active row visible by moving the list's own scrollTop and
  // nothing else. `scrollIntoView` would walk up and scroll every ancestor
  // scroll container, including the document, so arrowing through the list
  // would drag the page along behind the popover.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (!list || !row) return;
    const listBox = list.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    if (rowBox.top < listBox.top) {
      list.scrollTop -= listBox.top - rowBox.top;
    } else if (rowBox.bottom > listBox.bottom) {
      list.scrollTop += rowBox.bottom - listBox.bottom;
    }
  }, [activeIndex, open]);

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length === 0) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((prev) => (prev + delta + results.length) % results.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const picked = results[activeIndex];
      if (picked) selectCountry(picked);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
    }
  };

  const onDigitsChange = (raw: string): void => {
    // Pasting a full international number should move the country selector to
    // match, not fold the dial code into the local digits.
    const pasted = parseInternational(raw);
    if (pasted) {
      onChange(pasted);
      return;
    }
    onChange({
      country: value.country,
      national: digitsOnly(raw).slice(0, maxNationalDigits(value.country)),
    });
  };

  return (
    <FieldShell
      htmlFor={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      className={className}
      variant={variant}
    >
      <div
        ref={wrapRef}
        // The country trigger and the number input read as one control, so
        // the ring goes on the wrapper when either of them holds keyboard focus.
        className="cs-field-group relative flex w-full items-stretch transition-colors"
        style={{
          ...surface,
          borderColor: invalid ? FIELD_BORDER_ERROR : restingBorder,
          padding: 0,
          overflow: "visible",
        }}
        onBlur={(event) => {
          // Moving between the country trigger and the number input is still
          // "inside" the field, so it must not count as leaving it.
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          onBlur?.();
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-l-[8px] pl-3 pr-2 outline-none"
          style={{ borderRight: `1px solid ${restingBorder}` }}
          aria-label={`Country code: ${value.country.name}, +${value.country.callingCode}`}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? listId : undefined}
        >
          <span aria-hidden style={{ fontSize: "16px", lineHeight: 1 }}>
            {value.country.flag}
          </span>
          <span style={{ color: "#111111", whiteSpace: "nowrap" }}>
            +{value.country.callingCode}
          </span>
          <svg
            aria-hidden
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            style={{
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 150ms ease",
            }}
          >
            <path
              d="M1 1L5 5L9 1"
              stroke="#666"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={formatNational(value)}
          onChange={(event) => onDigitsChange(event.target.value)}
          aria-invalid={invalid}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="w-full min-w-0 rounded-r-[8px] bg-transparent px-3 outline-none placeholder:text-[#A3A3A3]"
          style={{
            fontFamily: "inherit",
            fontWeight: "inherit",
            fontSize: "inherit",
            color: "#111111",
          }}
        />

        {open ? (
          <div
            className="absolute left-0 top-full z-30 mt-1 w-full min-w-[280px] overflow-hidden rounded-[8px] bg-white"
            style={{
              border: `1px solid ${restingBorder}`,
              boxShadow: "0 12px 32px -8px rgba(15, 18, 62, 0.28)",
            }}
          >
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Search country or code"
              aria-label="Search country or dial code"
              aria-controls={listId}
              aria-activedescendant={
                results[activeIndex] ? `${listId}-${results[activeIndex].code}` : undefined
              }
              className="w-full border-b bg-white px-3 py-2.5 outline-none placeholder:text-[#A3A3A3]"
              style={{
                borderColor: restingBorder,
                fontFamily: "inherit",
                fontSize: "var(--fs-input)",
                color: "#111111",
              }}
            />
            <div
              ref={listRef}
              id={listId}
              // biome-ignore lint/a11y/useSemanticElements: a native <select> cannot render the flag, name and dial code as separate styled columns
              role="listbox"
              tabIndex={-1}
              aria-label="Country"
              className="max-h-[240px] overflow-y-auto py-1"
              // Lenis (root layout) intercepts wheel events and animates
              // window.scrollY itself, which leaves every nested scroll
              // container inert — the wheel scrolls the page instead of this
              // list. data-lenis-prevent hands wheel events over the list back
              // to the browser. Lenis is off for touch and reduced-motion, so
              // overscroll-behavior still does the containing work there.
              data-lenis-prevent
              style={{ overscrollBehavior: "contain" }}
            >
              {results.length === 0 ? (
                <p className="px-3 py-2.5 text-[#666]" style={{ fontSize: "var(--fs-caption)" }}>
                  No country matches that.
                </p>
              ) : (
                results.map((country, index) => {
                  const selected = country.code === value.country.code;
                  return (
                    <button
                      key={country.code}
                      id={`${listId}-${country.code}`}
                      type="button"
                      data-index={index}
                      // biome-ignore lint/a11y/useSemanticElements: this option lives inside a custom listbox (see note above); a native <option> is not valid outside <select>
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setActiveIndex(index)}
                      // Pointer-down rather than click: the search input would
                      // otherwise blur and close the menu before click fires.
                      onPointerDown={(event) => {
                        event.preventDefault();
                        selectCountry(country);
                      }}
                      className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left"
                      style={{
                        // Hover and keyboard highlight share one neutral grey;
                        // the chosen country keeps the brand tint. Differing in
                        // hue rather than only in strength keeps "where I am"
                        // and "what is picked" telling apart at a glance.
                        background: selected
                          ? index === activeIndex
                            ? "rgba(57, 96, 249, 0.16)"
                            : "rgba(57, 96, 249, 0.10)"
                          : index === activeIndex
                            ? "rgba(17, 17, 17, 0.05)"
                            : "transparent",
                        fontSize: "var(--fs-input)",
                        color: "#111111",
                        fontWeight: selected ? 600 : 400,
                      }}
                    >
                      <span aria-hidden style={{ fontSize: "16px", lineHeight: 1 }}>
                        {country.flag}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{country.name}</span>
                      <span className="shrink-0 text-[#666]">+{country.callingCode}</span>
                      {selected ? (
                        // Colour alone must not carry the selected state (WCAG 1.4.1).
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden
                          className="shrink-0"
                        >
                          <path
                            d="M20 6L9 17l-5-5"
                            stroke="#3960F9"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </FieldShell>
  );
}
