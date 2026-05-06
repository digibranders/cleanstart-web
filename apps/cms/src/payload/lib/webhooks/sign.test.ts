import { describe, expect, it } from 'vitest';

import { signWebhook, verifyWebhook } from './sign';

const KEY = { id: 'k1', secret: 'shhh' };
const KEY2 = { id: 'k2', secret: 'newer' };
const fixedDate = new Date('2026-05-05T12:00:00Z');

describe('signWebhook', () => {
  it('emits id, timestamp, and v1 signature headers', () => {
    const headers = signWebhook('{"hello":"world"}', [KEY], {
      id: 'msg_123',
      timestamp: fixedDate,
    });
    expect(headers['webhook-id']).toBe('msg_123');
    expect(headers['webhook-timestamp']).toBe(String(Math.floor(fixedDate.getTime() / 1000)));
    expect(headers['webhook-signature']).toMatch(/^v1,[A-Za-z0-9+/=]+$/);
  });

  it('emits multiple v1 signatures when multiple keys are provided', () => {
    const headers = signWebhook('{}', [KEY, KEY2], { id: 'a', timestamp: fixedDate });
    const tuples = headers['webhook-signature'].split(' ');
    expect(tuples.length).toBe(2);
    expect(tuples[0]?.startsWith('v1,')).toBe(true);
    expect(tuples[1]?.startsWith('v1,')).toBe(true);
    expect(tuples[0]).not.toBe(tuples[1]);
  });

  it('produces deterministic signatures for the same id + timestamp + payload', () => {
    const a = signWebhook('payload', [KEY], { id: 'msg_x', timestamp: fixedDate });
    const b = signWebhook('payload', [KEY], { id: 'msg_x', timestamp: fixedDate });
    expect(a['webhook-signature']).toBe(b['webhook-signature']);
  });

  it('throws when no keys are provided', () => {
    expect(() => signWebhook('{}', [])).toThrow(/at least one signing key/i);
  });
});

describe('verifyWebhook', () => {
  const sample = signWebhook('{"hello":"world"}', [KEY], {
    id: 'msg_123',
    timestamp: fixedDate,
  });

  it('accepts a freshly-signed delivery', () => {
    const result = verifyWebhook(sample, '{"hello":"world"}', [KEY], { now: fixedDate });
    expect(result).toEqual({ ok: true, matchedKeyId: 'k1' });
  });

  it('returns missing-headers when any header is absent', () => {
    expect(
      verifyWebhook({ 'webhook-id': null }, '{}', [KEY], { now: fixedDate }),
    ).toEqual({ ok: false, reason: 'missing-headers' });
  });

  it('rejects an out-of-tolerance timestamp', () => {
    const result = verifyWebhook(sample, '{"hello":"world"}', [KEY], {
      now: new Date(fixedDate.getTime() + 10 * 60 * 1000),
    });
    expect(result).toEqual({ ok: false, reason: 'timestamp-out-of-tolerance' });
  });

  it('rejects a payload that has been tampered with', () => {
    const result = verifyWebhook(sample, '{"hello":"WORLD"}', [KEY], { now: fixedDate });
    expect(result).toEqual({ ok: false, reason: 'no-matching-signature' });
  });

  it('rejects when the signing secret on file does not match', () => {
    const result = verifyWebhook(sample, '{"hello":"world"}', [{ id: 'wrong', secret: 'wrong' }], {
      now: fixedDate,
    });
    expect(result).toEqual({ ok: false, reason: 'no-matching-signature' });
  });

  it('accepts a delivery signed with the older of two keys (rotation)', () => {
    const oldOnly = signWebhook('payload', [KEY], { id: 'a', timestamp: fixedDate });
    const both = [KEY2, KEY]; // new key first; rotation period
    expect(verifyWebhook(oldOnly, 'payload', both, { now: fixedDate })).toEqual({
      ok: true,
      matchedKeyId: 'k1',
    });
  });

  it('returns no-v1-signature when only unknown versions are present', () => {
    const tampered = { ...sample, 'webhook-signature': 'v9,abc' };
    expect(verifyWebhook(tampered, 'payload', [KEY], { now: fixedDate })).toEqual({
      ok: false,
      reason: 'no-v1-signature',
    });
  });

  it('returns invalid-timestamp when the header is not a number', () => {
    const tampered = { ...sample, 'webhook-timestamp': 'not-a-number' };
    expect(verifyWebhook(tampered, 'payload', [KEY], { now: fixedDate })).toEqual({
      ok: false,
      reason: 'invalid-timestamp',
    });
  });
});
