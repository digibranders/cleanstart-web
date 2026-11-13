import { db, pool } from '@/db/client';
import { DEV_SEED_PASSWORD, seedDevDatabase } from '@/db/fixtures';
import { systemClock } from '@/lib/clock';
import { hashPassword } from '@/server/auth/passwords';

hashPassword(DEV_SEED_PASSWORD)
  .then((passwordHash) => seedDevDatabase(db, systemClock, passwordHash))
  .then((summary) => console.info('seeded the mock data', summary))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
