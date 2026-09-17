import { describe, expect, it } from 'vitest';

import { buildResourceDownloadEmail } from './lead-emails';

const HOUR = 3_600_000;

const input = {
  firstName: 'Elena',
  resourceTitle: 'Securing the Software Supply Chain in 2026',
  downloadUrl: 'https://cms.example.com/api/resources/r/download?token=t',
  expiresAt: Date.now() + 24 * HOUR,
};

describe('buildResourceDownloadEmail', () => {
  it('thanks the visitor by resource in the subject', () => {
    const { subject } = buildResourceDownloadEmail(input);
    expect(subject).toBe('Thanks for downloading Securing the Software Supply Chain in 2026');
  });

  it('opens with thanks rather than just handing over a file', () => {
    const { htmlContent } = buildResourceDownloadEmail(input);
    expect(htmlContent).toContain(
      'Thank you for downloading Securing the Software Supply Chain in 2026.',
    );
  });

  // The download already started in the browser; the email is the way back to
  // the file for a visitor who closed the tab.
  it('still carries the signed link as a way back to the file', () => {
    const { htmlContent } = buildResourceDownloadEmail(input);
    expect(htmlContent).toContain(input.downloadUrl);
    expect(htmlContent).toContain('Download your copy');
  });

  it('states how long the link lasts', () => {
    const { htmlContent } = buildResourceDownloadEmail(input);
    expect(htmlContent).toContain('stops working in about 24 hours');
  });

  it('uses the singular for a one-hour link', () => {
    const { htmlContent } = buildResourceDownloadEmail({
      ...input,
      expiresAt: Date.now() + HOUR,
    });
    expect(htmlContent).toContain('stops working in about 1 hour.');
  });

  // 9f0defc2 removed every response-time promise from site mail because it
  // reads as a commitment the team has not agreed to.
  it('makes no promise about when anyone will follow up', () => {
    const { htmlContent } = buildResourceDownloadEmail(input);
    expect(htmlContent).not.toMatch(/business day|within \d+ hours|get in touch|reach out/i);
  });
});
