import { describe, expect, it } from 'vitest';

import { BrokenLinks } from './BrokenLinks';

describe('BrokenLinks collection', () => {
  it('has the expected slug and timestamps', () => {
    expect(BrokenLinks.slug).toBe('brokenLinks');
    expect(BrokenLinks.timestamps).toBe(true);
  });

  it('is cron-managed: create and update are denied in the admin UI', () => {
    // The nightly checkBrokenLinks cron writes every row via overrideAccess,
    // so create/update are hard-denied — a human never authors a row.
    expect(BrokenLinks.access?.create?.({} as never)).toBe(false);
    expect(BrokenLinks.access?.update?.({} as never)).toBe(false);
    // read (admin or editor) + delete (admin) stay function-gated.
    expect(typeof BrokenLinks.access?.read).toBe('function');
    expect(typeof BrokenLinks.access?.delete).toBe('function');
  });

  it('renders every field read-only in the admin form', () => {
    // `update: () => false` blocks the save but does NOT disable the inputs;
    // each field must be admin.readOnly so a cron-detected row can't be
    // hand-edited.
    const fields = BrokenLinks.fields as { name?: string; admin?: { readOnly?: boolean } }[];
    for (const field of fields) {
      if (!field.name) continue;
      expect(field.admin?.readOnly, `${field.name} must be readOnly`).toBe(true);
    }
  });
});
