'use client';

import type { ReactElement, ReactNode } from 'react';

export type NoticeVariant = 'info' | 'success' | 'warn' | 'error';

interface NoticeProps {
  readonly variant?: NoticeVariant;
  readonly title?: ReactNode;
  readonly children?: ReactNode;
  /** Optional inline action (e.g. "Retry", "Open settings"). */
  readonly action?: { readonly label: string; readonly onClick: () => void };
  /** When provided, renders an `aria-label`-able dismiss button. */
  readonly onDismiss?: () => void;
}

const VARIANT_ICON: Record<NoticeVariant, string> = {
  info: 'ℹ',
  success: '✓',
  warn: '!',
  error: '✕',
};

const VARIANT_TONE: Record<
  NoticeVariant,
  { bg: string; ring: string; fg: string; ariaRole: 'status' | 'alert' }
> = {
  info: { bg: '#1a2a3a', ring: '#3a6ea8', fg: '#9bc4e8', ariaRole: 'status' },
  success: { bg: '#0f3a26', ring: '#2fae67', fg: '#7ddc9c', ariaRole: 'status' },
  warn: { bg: '#3a2f0f', ring: '#c79a2e', fg: '#f0c45a', ariaRole: 'status' },
  error: { bg: '#3a1212', ring: '#c54040', fg: '#f08f8f', ariaRole: 'alert' },
};

/**
 * Single inline notice / banner used everywhere we need to surface
 * something to the editor mid-form: validation errors, soft warnings
 * (CSV truncation), success confirmations, etc.
 *
 * Replaces the ad-hoc `<div style="color: red">` patterns scattered
 * across InboundRedirectsField, LeadsCsvTruncationBanner, and friends.
 *
 * Accessibility:
 *   - error variant uses `role="alert"` + `aria-live="assertive"` so
 *     screen readers announce it immediately.
 *   - other variants use `role="status"` + `aria-live="polite"`.
 *   - dismiss button has an explicit aria-label.
 */
export const Notice = (props: NoticeProps): ReactElement => {
  const variant = props.variant ?? 'info';
  const tone = VARIANT_TONE[variant];
  const isError = variant === 'error';

  return (
    <div
      role={tone.ariaRole}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`cs-notice cs-notice--${variant}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '8px 10px',
        background: tone.bg,
        border: `1px solid ${tone.ring}`,
        borderRadius: 6,
        color: tone.fg,
        fontSize: 12,
        lineHeight: 1.4,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          flex: '0 0 auto',
          borderRadius: '50%',
          border: `1px solid ${tone.ring}`,
          fontSize: 11,
          fontWeight: 700,
          marginTop: 1,
        }}
      >
        {VARIANT_ICON[variant]}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {props.title ? (
          <div style={{ fontWeight: 600, marginBottom: props.children ? 2 : 0 }}>{props.title}</div>
        ) : null}
        {props.children ? <div>{props.children}</div> : null}
      </div>
      {props.action ? (
        <button
          type="button"
          onClick={props.action.onClick}
          style={{
            background: 'transparent',
            border: `1px solid ${tone.ring}`,
            color: tone.fg,
            padding: '2px 8px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 11,
            flex: '0 0 auto',
          }}
        >
          {props.action.label}
        </button>
      ) : null}
      {props.onDismiss ? (
        <button
          type="button"
          onClick={props.onDismiss}
          aria-label="Dismiss notice"
          style={{
            background: 'transparent',
            border: 0,
            color: tone.fg,
            cursor: 'pointer',
            fontSize: 14,
            padding: 0,
            marginLeft: 4,
            flex: '0 0 auto',
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
};

export default Notice;
