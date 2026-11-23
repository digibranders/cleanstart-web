"use client";

import { useId, useState } from "react";
import { Icon } from "../icon";

interface ComboboxProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: (() => void) | undefined;
  options: readonly string[];
  placeholder?: string | undefined;
  invalid?: boolean | undefined;
  ariaDescribedBy?: string | undefined;
  className?: string | undefined;
}

const MAX_SHOWN = 8;

/**
 * A text field with its own suggestion list, in place of the browser's datalist. The visitor can still type any text; the
 * caller decides what to do with a value that is not in the list (the forms snap it to a known name on blur).
 */
export function Combobox({ id, value, onChange, onBlur, options, placeholder, invalid, ariaDescribedBy, className = "field" }: ComboboxProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();

  const query = value.trim().toLowerCase();
  const matches =
    query === ""
      ? options.slice(0, MAX_SHOWN)
      : [...options.filter((o) => o.toLowerCase().startsWith(query)), ...options.filter((o) => !o.toLowerCase().startsWith(query) && o.toLowerCase().includes(query))].slice(0, MAX_SHOWN);
  const shown = open && matches.length > 0 && !(matches.length === 1 && matches[0] === value);

  const choose = (option: string): void => {
    onChange(option);
    setOpen(false);
  };

  const onKey = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (matches.length === 0 ? -1 : (a + step + matches.length) % matches.length));
    } else if (event.key === "Enter" && shown && active >= 0) {
      event.preventDefault();
      const picked = matches[active];
      if (picked !== undefined) choose(picked);
    } else if (event.key === "Escape" && shown) {
      event.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className="dd dd-full">
      <input
        id={id}
        className={`${className}${invalid ? " field-err" : ""}`}
        type="text"
        role="combobox"
        aria-expanded={shown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={ariaDescribedBy}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          onBlur?.();
        }}
        onKeyDown={onKey}
      />
      {shown ? (
        // biome-ignore lint/a11y/useFocusableInteractive: focus stays in the input; the active option is announced through aria-activedescendant
        <div className="dd-menu" id={listId} role="listbox">
          {matches.map((o, i) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: the input owns the keyboard; options are picked with Enter there
            <div
              key={o}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              tabIndex={-1}
              className={`dd-opt${i === active ? " dd-act" : ""}${o === value ? " dd-on" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o)}
            >
              {o}
              <Icon name="check" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
