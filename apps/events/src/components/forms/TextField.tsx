"use client";

import {
  FIELD_SURFACE_CLASS,
  fieldSurfaceStyle,
  type FieldHeight,
  type FieldVariant,
} from "./field-surface";
import { FieldShell } from "./FieldShell";

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  onBlur?: (() => void) | undefined;
  type?: "text" | "email" | undefined;
  placeholder?: string | undefined;
  required?: boolean | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  autoComplete?: string | undefined;
  maxLength?: number | undefined;
  multiline?: boolean | undefined;
  rows?: number | undefined;
  size?: FieldHeight | undefined;
  variant?: FieldVariant | undefined;
  className?: string | undefined;
}

/**
 * Single-line or multi-line text input on the shared field surface, with the
 * validation message rendered inline underneath rather than in a native
 * browser bubble.
 */
export function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  required = false,
  error,
  hint,
  autoComplete,
  maxLength,
  multiline = false,
  rows = 4,
  size = "sm",
  variant = "marketing",
  className,
}: TextFieldProps): React.ReactElement {
  const invalid = Boolean(error);
  const style = fieldSurfaceStyle({ variant, size, invalid, multiline });
  const aria = {
    "aria-invalid": invalid,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;

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
      {multiline ? (
        <textarea
          id={id}
          name={id}
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={FIELD_SURFACE_CLASS}
          style={style}
          {...aria}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={FIELD_SURFACE_CLASS}
          style={style}
          {...aria}
        />
      )}
    </FieldShell>
  );
}
