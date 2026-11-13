// signature.test.ts
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyV3 } from './signature';

const secret = 's3cret';
const sign = (method: string, uri: string, body: string, ts: string): string =>
  createHmac('sha256', secret).update(`${method}${uri}${body}${ts}`).digest('base64');

describe('verifyV3', () => {
  const now = 1_800_000_000_000;
  const ts = String(now - 1000);
  const uri = 'https://partners.cleanstart.com/api/hubspot/webhook';
  const body = '[{"objectId":1}]';

  it('accepts a valid signature', () => {
    expect(verifyV3({ secret, method: 'POST', uri, body, timestamp: ts, signature: sign('POST', uri, body, ts), now })).toBe(true);
  });
  it('rejects a tampered body', () => {
    expect(verifyV3({ secret, method: 'POST', uri, body: '[]', timestamp: ts, signature: sign('POST', uri, body, ts), now })).toBe(false);
  });
  it('rejects a timestamp older than 5 minutes', () => {
    const old = String(now - 6 * 60_000);
    expect(verifyV3({ secret, method: 'POST', uri, body, timestamp: old, signature: sign('POST', uri, body, old), now })).toBe(false);
  });
});
