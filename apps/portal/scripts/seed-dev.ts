import { db, pool } from '@/db/client';
import { seedDevDatabase } from '@/db/fixtures';
import { systemClock } from '@/lib/clock';

seedDevDatabase(db, systemClock)
  .then((summary) => console.info('seeded the mock data', summary))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
