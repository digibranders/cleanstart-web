import { describe, expect, it } from 'vitest';

import { EMAIL_TEMPLATES } from './registry';

describe('EMAIL_TEMPLATES', () => {
  it('has a unique key per template', () => {
    const keys = EMAIL_TEMPLATES.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(EMAIL_TEMPLATES.map((t) => [t.key, t] as const))('%s renders', (_key, entry) => {
    const { subject, htmlContent } = entry.sample();
    expect(subject.trim().length).toBeGreaterThan(0);
    expect(htmlContent.trim().length).toBeGreaterThan(0);
  });

  it('renders every site email through the shared layout', () => {
    // Payload builds its own password-reset body; everything else must come
    // from layout.ts so one design change reaches all of them.
    for (const entry of EMAIL_TEMPLATES) {
      if (entry.key === 'payload-password-reset') continue;
      const { htmlContent } = entry.sample();
      expect(htmlContent, entry.key).toContain('logo-email.png');
      expect(htmlContent, entry.key).toContain('16192 Coastal Highway');
    }
  });

  it('carries no em-dashes in subjects, except the HubSpot-synced deal name', () => {
    for (const entry of EMAIL_TEMPLATES) {
      const { subject } = entry.sample();
      if (entry.key.startsWith('deal-registration')) continue;
      expect(subject, entry.key).not.toMatch(/[–—]/u);
    }
  });

  it('covers every form that sends mail', () => {
    const forms = new Set(EMAIL_TEMPLATES.map((t) => t.form));
    for (const expected of [
      'book-a-demo',
      'contact',
      'newsletter',
      'become-a-partner',
      'deal-registration',
      'job application',
    ]) {
      expect([...forms].some((f) => f.includes(expected)), expected).toBe(true);
    }
  });
});
