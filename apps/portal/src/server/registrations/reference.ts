import { sql } from 'drizzle-orm';
import type { Db } from '@/db/client';

/** REG-YYMM-NNNN. The yymm part is the month of registration (`at`); the number is the next value of registration_reference_seq. */
export async function nextRegistrationReference(tx: Pick<Db, 'execute'>, at: Date): Promise<string> {
  const yymm = `${String(at.getUTCFullYear()).slice(2)}${String(at.getUTCMonth() + 1).padStart(2, '0')}`;
  const result = await tx.execute(sql`select nextval('registration_reference_seq') as n`);
  const row: unknown = result.rows[0];
  const raw = typeof row === 'object' && row !== null && 'n' in row ? (row as { n: unknown }).n : undefined;
  const n = Number(raw);
  if (!Number.isInteger(n)) throw new Error('registration_reference_seq returned no number');
  return `REG-${yymm}-${String(n).padStart(4, '0')}`;
}
