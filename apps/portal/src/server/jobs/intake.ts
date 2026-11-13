import { type Db, db } from '@/db/client';
import { type Clock, systemClock } from '@/lib/clock';
import { type CmsClient, createCmsClient, importWebsiteApplications } from '@/server/intake/website-applications';
import { log } from '@/server/log';

/** The job body with its dependencies explicit, so tests can pass a client or none. */
export const runIntakeWith = async (deps: { db: Db; cms: CmsClient | null; clock: Clock }): Promise<void> => {
  if (!deps.cms) {
    log.debug({}, 'website intake skipped: CMS_INTAKE_API_KEY is not set');
    return;
  }
  const result = await importWebsiteApplications({ db: deps.db, cms: deps.cms, clock: deps.clock });
  log.info({ ...result }, 'website intake finished');
};

export const runIntake = async (): Promise<void> => runIntakeWith({ db, cms: createCmsClient(), clock: systemClock });
