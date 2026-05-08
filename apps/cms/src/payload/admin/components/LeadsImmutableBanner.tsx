'use client';

import type { ReactElement } from 'react';

import { LockedReason } from './LockedReason';

/**
 * Surfaces the "Leads are append-only" invariant at the top of the
 * leads list view. Editors regularly clicked into a lead expecting to
 * make a quick edit; without this banner they hit a wall of read-only
 * fields with no explanation. The chip + reason gives the why
 * up-front so they know to use the CSV export or a separate
 * integration for outbound sync.
 */
export const LeadsImmutableBanner = (): ReactElement => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 12px',
      margin: '0 0 12px 0',
      background: 'var(--theme-elevation-50, #1c1d21)',
      border: '1px solid var(--theme-elevation-150, #2a2c33)',
      borderRadius: 6,
      fontSize: 12,
      color: 'var(--theme-text-soft, #a4a7af)',
    }}
  >
    <LockedReason
      reason="Leads are append-only — captured once at submit, never edited from the admin"
      label="Append-only"
    />
    <span>
      Need to update a record? Use the CSV export → fix the source, or wire an
      integration through the LeadHandler chain. Direct edits are deliberately
      disabled to keep the GDPR audit trail intact.
    </span>
  </div>
);

export default LeadsImmutableBanner;
