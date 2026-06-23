import { describe, expect, it } from 'vitest';

import { WebhookDeadLetter } from './WebhookDeadLetter';

describe('WebhookDeadLetter collection', () => {
  it('has the expected slug and timestamps', () => {
    expect(WebhookDeadLetter.slug).toBe('webhooks_dead_letter');
    expect(WebhookDeadLetter.timestamps).toBe(true);
  });

  it('is system-managed: create and update are denied in the admin UI', () => {
    // Every runtime write (dispatchEvent create, retryWebhookTask update, the
    // integrations endpoints) uses overrideAccess, which bypasses these rules —
    // so create/update are hard-denied to keep the queue out of human hands.
    expect(WebhookDeadLetter.access?.create?.({} as never)).toBe(false);
    expect(WebhookDeadLetter.access?.update?.({} as never)).toBe(false);
    // read + delete stay admin-gated (delete for triage once a row is handled).
    expect(typeof WebhookDeadLetter.access?.read).toBe('function');
    expect(typeof WebhookDeadLetter.access?.delete).toBe('function');
  });

  it('renders every field read-only in the admin form', () => {
    // Collection-level `update: () => false` blocks the save but does NOT
    // disable the form inputs — a human could still edit eventPayload and
    // corrupt the blob the retry task re-sends. Each field must be readOnly.
    const fields = WebhookDeadLetter.fields as {
      name?: string;
      admin?: { readOnly?: boolean };
    }[];
    for (const field of fields) {
      if (!field.name) continue;
      expect(field.admin?.readOnly, `${field.name} must be readOnly`).toBe(true);
    }
  });
});
