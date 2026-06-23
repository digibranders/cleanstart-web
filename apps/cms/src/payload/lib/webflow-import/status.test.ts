import { describe, expect, it } from 'vitest';

import { webflowHiringStatus, webflowStatus } from './status';

const row = (meta: Record<string, unknown> | undefined) => ({ _meta: meta });

describe('webflowStatus', () => {
  it('publishes a live item with no staged changes', () => {
    expect(
      webflowStatus(row({ isDraft: false, isArchived: false, lastPublished: '2026-05-14T00:00:00Z' })),
    ).toBe('published');
  });

  it('keeps a never-published draft as draft', () => {
    expect(webflowStatus(row({ isDraft: true, isArchived: false, lastPublished: null }))).toBe('draft');
  });

  it('treats "published with changes in draft" as published (the mis-import bug)', () => {
    // Webflow reports isDraft:true for the staged copy of a live item, but a
    // non-null lastPublished means a published version exists on the source.
    expect(
      webflowStatus(row({ isDraft: true, isArchived: false, lastPublished: '2026-05-14T13:07:00.904Z' })),
    ).toBe('published');
  });

  it('treats an archived item as draft even when it was once published', () => {
    expect(
      webflowStatus(row({ isDraft: false, isArchived: true, lastPublished: '2026-05-14T00:00:00Z' })),
    ).toBe('draft');
  });

  it('defaults a row with no _meta to published', () => {
    expect(webflowStatus(row(undefined))).toBe('published');
  });
});

describe('webflowHiringStatus', () => {
  it('marks a live job as open', () => {
    expect(
      webflowHiringStatus(row({ isDraft: false, isArchived: false, lastPublished: '2026-05-14T00:00:00Z' })),
    ).toBe('open');
  });

  it('marks any unpublished (draft) job as closed', () => {
    expect(webflowHiringStatus(row({ isDraft: true, isArchived: false, lastPublished: null }))).toBe('closed');
  });

  it('marks a once-published-but-now-draft job as closed (unlike content _status)', () => {
    // Jobs use the draft flag as the open/closed signal regardless of publish
    // history, so this intentionally diverges from webflowStatus.
    expect(
      webflowHiringStatus(row({ isDraft: true, isArchived: false, lastPublished: '2026-05-14T00:00:00Z' })),
    ).toBe('closed');
  });
});
