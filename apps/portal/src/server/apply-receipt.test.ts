import { describe, expect, it } from 'vitest';
import { type ApplyReceipt, APPLY_RECEIPT_TTL_SECONDS, signApplyReceipt, verifyApplyReceipt } from './apply-receipt';

const receipt: ApplyReceipt = {
  reference: 'APP-2611-0045',
  company: 'Tidewater Infosec',
  firstName: 'Neha',
  email: 'neha.joshi@tidewaterinfosec.in',
  category: 'channel',
  region: 'india',
  submittedOn: '2026-11-12',
};
const now = new Date('2026-11-12T10:00:00Z');

describe('apply receipt cookie', () => {
  it('round trips a signed receipt', () => {
    expect(verifyApplyReceipt(signApplyReceipt(receipt, now), now)).toEqual(receipt);
  });

  it('rejects a tampered payload and a tampered signature', () => {
    const [payload = '', mac = ''] = signApplyReceipt(receipt, now).split('.');
    const forged = Buffer.from(JSON.stringify({ ...receipt, reference: 'APP-2611-0001', exp: now.getTime() + 60_000 })).toString('base64url');
    expect(verifyApplyReceipt(`${forged}.${mac}`, now)).toBeNull();
    expect(verifyApplyReceipt(`${payload}.${mac.slice(0, -2)}xx`, now)).toBeNull();
    expect(verifyApplyReceipt('garbage', now)).toBeNull();
    expect(verifyApplyReceipt('', now)).toBeNull();
  });

  it('expires after the ttl', () => {
    const value = signApplyReceipt(receipt, now);
    const later = new Date(now.getTime() + (APPLY_RECEIPT_TTL_SECONDS + 1) * 1000);
    expect(verifyApplyReceipt(value, later)).toBeNull();
  });
});
