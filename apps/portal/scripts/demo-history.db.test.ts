import { sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { seedMockData } from '../src/db/fixtures';
import { resetDb, testDb } from '../src/db/test-helpers';
import { fixedClock } from '../src/lib/clock';
import { addDemoHistory } from './demo';
import { DEMO_HISTORY_COUNT } from './demo-history';

const clock = fixedClock('2026-11-23T10:00:00Z');
const count = async (): Promise<number> => Number((await testDb().execute(sql`select count(*)::int as n from registrations`)).rows[0]?.n);

describe('addDemoHistory', () => {
  let before = 0;
  beforeAll(async () => {
    await resetDb(testDb());
    await seedMockData(testDb(), { clock });
    before = await count();
    await addDemoHistory(clock.today());
  });

  it('adds the generated registrations on top of the seeded ones, passing every table constraint', async () => {
    expect(await count()).toBe(before + DEMO_HISTORY_COUNT);
  });

  it('spreads them over the year with a mix of statuses', async () => {
    const { rows } = await testDb().execute(
      sql`select count(distinct to_char(registered_on, 'YYYY-MM'))::int as months, count(distinct status)::int as statuses from registrations`,
    );
    expect(Number(rows[0]?.months)).toBeGreaterThanOrEqual(8);
    expect(Number(rows[0]?.statuses)).toBe(6);
  });
});
