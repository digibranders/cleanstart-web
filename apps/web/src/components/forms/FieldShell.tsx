import type { ReactNode } from "react";

import { FIELD_ERROR_TEXT, fieldLabelStyle, type FieldVariant } from "./field-surface";

interface FieldShellProps {
  /** Must match the control's id so clicking the label focuses it. */
  htmlFor: string;
  label: string;
  required?: boolean | undefined;
  /** Inline validation message. Its presence is what puts the field in error. */
  error?: string | undefined;
  hint?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
  variant?: FieldVariant | undefined;
}

/**
 * Label, required marker, control, and the inline error underneath it.
 *
 * The error is the point. The forms previously relied on the browser's native
 * validation bubble, which shows one message at a time, disappears on the next
 * keystroke and cannot say "use your company email". This renders the message
 * in the layout, next to the field it belongs to, and keeps it there.
 */
export function FieldShell({
  htmlFor,
  label,
  required = false,
  error,
  hint,
  children,
  className,
  variant = "marketing",
}: FieldShellProps): React.ReactElement {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block" style={fieldLabelStyle(variant)}>
        {label}
        {required ? (
          <span className="ml-0.5" style={{ color: FIELD_ERROR_TEXT }} aria-hidden>
            *
          </span>
        ) : null}
      </label>

      {children}

      {error ? (
        <p
          id={`${htmlFor}-error`}
          // aria-live so a message appearing after submit is announced, rather
          // than only being found by someone who navigates back to the field.
          role="alert"
          aria-live="polite"
          className="mt-1.5"
          style={{
            color: FIELD_ERROR_TEXT,
            fontFamily: "var(--font-display), 'Manrope', sans-serif",
            fontSize: "var(--fs-caption)",
            lineHeight: 1.35,
          }}
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${htmlFor}-hint`}
          className="mt-1.5 text-[#666]"
          style={{
            fontFamily: "var(--font-display), 'Manrope', sans-serif",
            fontSize: "var(--fs-caption)",
            lineHeight: 1.35,
          }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Wire-up every control inside a FieldShell needs to announce its own error. */
export const fieldAria = (
  id: string,
  error: string | undefined,
  hint?: string,
): { "aria-invalid": boolean; "aria-describedby": string | undefined } => ({
  "aria-invalid": Boolean(error),
  "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
});
