import { describe, expect, it } from 'vitest';

import { redactWebhookErrorBody } from './redact-error-body';

describe('redactWebhookErrorBody', () => {
  it('returns empty string for null / empty input', () => {
    expect(redactWebhookErrorBody(null)).toBe('');
    expect(redactWebhookErrorBody(undefined)).toBe('');
    expect(redactWebhookErrorBody('')).toBe('');
  });

  it('redacts Bearer tokens', () => {
    const out = redactWebhookErrorBody('401 Unauthorized: Bearer eyJhbGciOiJIUzI1NiJ9.aaaa.bbbb');
    expect(out).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    expect(out).toContain('Bearer [REDACTED]');
  });

  it('redacts api_key fields in JSON-shaped errors', () => {
    const out = redactWebhookErrorBody(
      '{"ok":false,"api_key":"sk_live_abcdefghijklmnop","msg":"bad"}',
    );
    expect(out).toContain('"api_key":"[REDACTED]"');
    expect(out).not.toContain('sk_live_abcdefghijklmnop');
  });

  it('redacts authorization header echoes', () => {
    const out = redactWebhookErrorBody('echo: authorization=sk_test_xyzABC1234567890abcdef');
    expect(out).toContain('[REDACTED]');
    expect(out).not.toContain('sk_test_xyzABC1234567890abcdef');
  });

  it('redacts AWS access key ids', () => {
    const out = redactWebhookErrorBody('AKIAABCDEFGHIJKLMNOP rejected the request');
    expect(out).toContain('[REDACTED-AWS-KEY]');
    expect(out).not.toContain('AKIAABCDEFGHIJKLMNOP');
  });

  it('truncates beyond 200 chars', () => {
    // Lots of short words so the long-token redactor doesn't collapse everything.
    const big = `${'oh '.repeat(200)}done`;
    const out = redactWebhookErrorBody(big);
    expect(out.length).toBeLessThanOrEqual(200);
    expect(out.endsWith('…')).toBe(true);
  });

  it('passes through short, secret-free messages unchanged', () => {
    expect(redactWebhookErrorBody('not found')).toBe('not found');
    expect(redactWebhookErrorBody('500 internal server error')).toBe(
      '500 internal server error',
    );
  });
});
