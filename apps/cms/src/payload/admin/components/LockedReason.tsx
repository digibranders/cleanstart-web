'use client';

import type { ReactElement } from 'react';

interface LockedReasonProps {
  /** Short human-readable explanation, e.g. "Set on first publish — cannot be edited". */
  readonly reason: string;
  /** Optional override for the chip label. Defaults to "Locked". */
  readonly label?: string;
  /** Compact variant strips the label and renders a 16×16 icon-only chip. */
  readonly compact?: boolean;
}

/**
 * Read-only-state badge. Surfaces invisible constraints (Leads are
 * append-only, `publishedAt` is set by a hook, system-managed
 * redirects can't be edited) with a 🔒 chip + tooltip explanation.
 *
 * Pure presentational — drop next to a field's label or in the value
 * column of a list cell. The reason becomes the `title` so a hover
 * surfaces the why; screen readers read the full label.
 */
export const LockedReason = (props: LockedReasonProps): ReactElement => {
  const label = props.label ?? 'Locked';
  const compact = props.compact ?? false;

  return (
    <span
      role="img"
      aria-label={`${label}: ${props.reason}`}
      title={props.reason}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 0 : 4,
        padding: compact ? 2 : '2px 6px',
        background: 'var(--theme-elevation-50, #1c1d21)',
        border: '1px solid var(--theme-elevation-150, #2a2c33)',
        borderRadius: 999,
        color: 'var(--theme-text-soft, #a4a7af)',
        fontSize: 11,
        lineHeight: 1,
        cursor: 'help',
      }}
    >
      <span aria-hidden style={{ fontSize: 11 }}>🔒</span>
      {compact ? null : <span>{label}</span>}
    </span>
  );
};

export default LockedReason;
