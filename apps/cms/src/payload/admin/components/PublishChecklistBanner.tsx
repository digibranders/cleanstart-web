'use client';

import { useDocumentInfo, useConfig } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useState, useEffect, useCallback } from 'react';

import type { CheckResult } from '@/payload/hooks/publish-gate';

const ICON_PASS = '✓';
const ICON_WARN = '⚠';
const ICON_BLOCKER = '✕';

const COLOR_PASS = 'var(--theme-success-500, #22c55e)';
const COLOR_WARN = 'var(--theme-warning-500, #f59e0b)';
const COLOR_BLOCKER = 'var(--theme-error-500, #ef4444)';

type ChecklistResponse = {
  ok: boolean;
  checks?: CheckResult[];
  blockerCount?: number;
  warnCount?: number;
};

const iconFor = (check: CheckResult): string => {
  if (check.pass) return ICON_PASS;
  return check.severity === 'warn' ? ICON_WARN : ICON_BLOCKER;
};

const colorFor = (check: CheckResult): string => {
  if (check.pass) return COLOR_PASS;
  return check.severity === 'warn' ? COLOR_WARN : COLOR_BLOCKER;
};

/**
 * Advisory banner that shows the publishing checklist state above the
 * document controls. Calls GET /api/[collection]/[id]/checklist on mount
 * and whenever the document ID changes (i.e. after save).
 *
 * The banner is purely informational — the server-side publishGateHook
 * is the hard gate. This component shows editors what to fix before
 * attempting to publish.
 *
 * Mounted via admin.components.beforeDocumentControls on content collections.
 */
export const PublishChecklistBanner = (): ReactElement | null => {
  const { id, collectionSlug } = useDocumentInfo();
  const { config } = useConfig();
  const [checks, setChecks] = useState<CheckResult[] | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id || !collectionSlug) return;
    const serverURL = config?.serverURL ?? '';
    try {
      const res = await fetch(`${serverURL}/api/${collectionSlug}/${String(id)}/checklist`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const body = (await res.json()) as ChecklistResponse;
      if (body.ok && Array.isArray(body.checks)) {
        setChecks(body.checks);
      }
    } catch {
      // Silent — banner is advisory; a failing fetch is not fatal.
    }
  }, [id, collectionSlug, config]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!checks || checks.length === 0) return null;

  const blockers = checks.filter((c) => !c.pass && c.severity === 'blocker');
  const warns = checks.filter((c) => !c.pass && c.severity === 'warn');
  const allPass = blockers.length === 0 && warns.length === 0;

  const summaryColor = allPass
    ? COLOR_PASS
    : blockers.length > 0
      ? COLOR_BLOCKER
      : COLOR_WARN;

  const summaryText = allPass
    ? 'Ready to publish'
    : blockers.length > 0
      ? `${blockers.length} blocker${blockers.length > 1 ? 's' : ''} must be fixed before publishing`
      : `${warns.length} warning${warns.length > 1 ? 's' : ''} — publishing is allowed`;

  return (
    <div
      style={{
        borderLeft: `3px solid ${summaryColor}`,
        background: 'var(--theme-elevation-50, rgba(0,0,0,.04))',
        borderRadius: '0 4px 4px 0',
        marginBottom: '0.75rem',
        padding: '0.5rem 0.75rem',
        fontSize: '0.8125rem',
        lineHeight: 1.4,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          width: '100%',
          color: summaryColor,
          fontWeight: 600,
        }}
      >
        <span>{allPass ? ICON_PASS : blockers.length > 0 ? ICON_BLOCKER : ICON_WARN}</span>
        <span style={{ flex: 1 }}>{summaryText}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--theme-elevation-500)' }}>
          {open ? '▲ hide' : '▼ details'}
        </span>
      </button>

      {open && (
        <ul
          style={{
            margin: '0.5rem 0 0',
            padding: '0 0 0 1.25rem',
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          {checks.map((check) => (
            <li
              key={check.id}
              style={{
                display: 'flex',
                gap: '0.4rem',
                color: check.pass
                  ? 'var(--theme-elevation-600)'
                  : colorFor(check),
              }}
            >
              <span style={{ color: colorFor(check), fontWeight: 600, minWidth: '1rem' }}>
                {iconFor(check)}
              </span>
              <span>
                <strong>{check.label}</strong>
                {!check.pass && check.message != null ? (
                  <span style={{ opacity: 0.85 }}> — {check.message}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PublishChecklistBanner;
