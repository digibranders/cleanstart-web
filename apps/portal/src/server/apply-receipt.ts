import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { env } from '@/env';
import { PARTNER_CATEGORIES } from '@/lib/domain';
import { regionKeySchema } from '@/lib/regions';

/** Cookie set by submitApplicationAction and read by /apply/done (decision 16: not the query string, not the database). */
export const APPLY_RECEIPT_COOKIE = 'portal_apply_receipt';
export const APPLY_RECEIPT_TTL_SECONDS = 3600;

const receiptSchema = z.object({
  reference: z.string().min(1),
  company: z.string().min(1),
  firstName: z.string(),
  email: z.string(),
  category: z.enum(PARTNER_CATEGORIES),
  region: regionKeySchema,
  submittedOn: z.string().length(10),
  /** The private status link token, so the receipt page can offer the link. Never logged. */
  statusToken: z.string().min(1).max(200).optional(),
});
export type ApplyReceipt = z.infer<typeof receiptSchema>;

const payloadSchema = receiptSchema.extend({ exp: z.number() });

const mac = (payload: string): string =>
  createHmac('sha256', `apply-receipt.v1:${env.AUTH_SECRET}`).update(payload).digest('base64url');

/** base64url(json).base64url(hmac). Not encrypted: the person reads their own application back. */
export function signApplyReceipt(receipt: ApplyReceipt, now: Date): string {
  const payload = Buffer.from(JSON.stringify({ ...receipt, exp: now.getTime() + APPLY_RECEIPT_TTL_SECONDS * 1000 })).toString('base64url');
  return `${payload}.${mac(payload)}`;
}

/** Null for anything that is not a fresh, correctly signed receipt. */
export function verifyApplyReceipt(value: string, now: Date): ApplyReceipt | null {
  const dot = value.indexOf('.');
  if (dot < 1) return null;
  const payload = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(mac(payload));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const parsed = payloadSchema.safeParse(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')));
    if (!parsed.success || parsed.data.exp <= now.getTime()) return null;
    const { exp: _exp, ...receipt } = parsed.data;
    return receipt;
  } catch {
    return null;
  }
}
