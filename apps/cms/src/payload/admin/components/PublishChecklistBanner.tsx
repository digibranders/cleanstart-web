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
 * Advisory banner showing the publishing checklist state above document
 * controls. Calls GET /api/[collection]/[id]/checklist on mount and
 * whenever the document ID changes (after save).
 *
 * The banner is purely informational — the server-side publishGateHook
 * is the hard gate. This shows editors what to fix before publishing.
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
      className="cs-checklist-banner"
      style={{ borderLeftColor: summaryColor }}
    >
      <button
        type="button"
        className="cs-checklist-banner__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="cs-checklist-banner__icon" style={{ color: summaryColor }} aria-hidden="true">
          {allPass ? ICON_PASS : blockers.length > 0 ? ICON_BLOCKER : ICON_WARN}
        </span>
        <span className="cs-checklist-banner__summary" style={{ color: summaryColor }}>
          {summaryText}
        </span>
        <span className="cs-checklist-banner__chevron" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <ul className="cs-checklist-banner__list">
          {checks.map((check) => (
            <li
              key={check.id}
              className="cs-checklist-banner__item"
              style={{ color: check.pass ? 'var(--theme-elevation-600)' : colorFor(check) }}
            >
              <span
                className="cs-checklist-banner__item-icon"
                style={{ color: colorFor(check) }}
                aria-hidden="true"
              >
                {iconFor(check)}
              </span>
              <span>
                <strong>{check.label}</strong>
                {!check.pass && check.message != null ? (
                  <span className="cs-checklist-banner__item-msg"> — {check.message}</span>
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
