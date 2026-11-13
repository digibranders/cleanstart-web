// signature.ts
import { createHmac, timingSafeEqual } from 'node:crypto';

export const verifyV3 = (i: {
  secret: string; method: string; uri: string; body: string; timestamp: string; signature: string; now: number;
}): boolean => {
  if (Math.abs(i.now - Number(i.timestamp)) > 5 * 60_000) return false;
  const expected = createHmac('sha256', i.secret).update(`${i.method}${i.uri}${i.body}${i.timestamp}`).digest();
  const given = Buffer.from(i.signature, 'base64');
  return given.length === expected.length && timingSafeEqual(given, expected);
};
