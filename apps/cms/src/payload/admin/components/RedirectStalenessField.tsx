'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

const STALE_AFTER_DAYS = 90;
const HOT_AFTER_HITS = 1000;

type Verdict =
  | { kind: 'hot'; label: string; tone: { fg: string; bg: string; ring: string } }
  | { kind: 'active'; label: string; tone: { fg: string; bg: string; ring: string } }
  | { kind: 'cold'; label: string; tone: { fg: string; bg: string; ring: string } }
  | { kind: 'never-hit'; label: string; tone: { fg: string; bg: string; ring: string } };

const TONE = {
  hot: { fg: '#f08f8f', bg: '#3a1212', ring: '#c54040' },
  active: { fg: '#7ddc9c', bg: '#0f3a26', ring: '#2fae67' },
  cold: { fg: '#f0c45a', bg: '#3a2f0f', ring: '#c79a2e' },
  none: { fg: '#a4a7af', bg: '#1c1d21', ring: '#2a2c33' },
} as const;

const verdict = (
  hitCount: number | null | undefined,
  lastHitAt: string | null | undefined,
): Verdict => {
  const hits = typeof hitCount === 'number' ? hitCount : 0;
  if (hits >= HOT_AFTER_HITS) {
    return { kind: 'hot', label: `🔥 Hot · ${hits.toLocaleString()} hits`, tone: TONE.hot };
  }
  if (hits === 0 || !lastHitAt) {
    return {
      kind: 'never-hit',
      label: 'Never hit · safe to remove',
      tone: TONE.none,
    };
  }
  const last = new Date(lastHitAt).getTime();
  if (!Number.isFinite(last)) {
    return { kind: 'active', label: `${hits.toLocaleString()} hits`, tone: TONE.active };
  }
  const ageDays = (Date.now() - last) / (24 * 60 * 60 * 1000);
  if (ageDays > STALE_AFTER_DAYS) {
    return {
      kind: 'cold',
      label: `Cold · last hit ${Math.round(ageDays)}d ago`,
      tone: TONE.cold,
    };
  }
  return {
    kind: 'active',
    label: `Active · last hit ${Math.round(ageDays)}d ago`,
    tone: TONE.active,
  };
};

/**
 * Sidebar pill on each Redirect doc that surfaces lifecycle health:
 *
 *   🔥 Hot         — > 1000 cumulative hits (probably worth promoting
 *                     to a permanent route)
 *   ✓ Active       — hit at least once in the last 90 days
 *   ❄ Cold         — hit at least once but not in the last 90 days
 *   · Never hit    — zero hits ever; safe to remove
 *
 * Pure derived signal — reads `hitCount` + `lastHitAt` directly from
 * the form. No API calls.
 */
export const RedirectStalenessField = (): ReactElement => {
  const { value: hitCount } = useField<number>({ path: 'hitCount' });
  const { value: lastHitAt } = useField<string>({ path: 'lastHitAt' });

  const v = useMemo(() => verdict(hitCount, lastHitAt), [hitCount, lastHitAt]);

  return (
    <div
      className="field-type redirect-staleness-field"
      style={{ marginBottom: 'var(--cs-space-3, 12px)' }}
    >
      <div
        className="field-label"
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--theme-text-soft, #a4a7af)',
          marginBottom: 4,
        }}
      >
        Lifecycle
      </div>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: v.tone.bg,
          color: v.tone.fg,
          border: `1px solid ${v.tone.ring}`,
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 500,
        }}
      >
        {v.label}
      </span>
    </div>
  );
};
