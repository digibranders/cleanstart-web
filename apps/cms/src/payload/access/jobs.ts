import type { CollectionConfig } from 'payload';

import { isAdmin } from './index';
import { hasRole } from './typed-user';

/**
 * Access for Payload's job queue (the `payload-jobs` collection and its REST endpoints).
 *
 * Payload's defaults let any signed-in user create, update and delete job rows, and run the queue. Its
 * `schedulePublish` task runs a job with `overrideAccess: input.user === null`, so a job posted over REST with no `user`
 * publishes or unpublishes any document with full rights. Staff schedule through Payload's `schedule-publish` server
 * function instead: it queues through the Local API, which skips collection access, and records the scheduler as
 * `input.user`, so the job later runs with that person's own rights. Locking the collection's writes and the run,
 * queue and cancel endpoints to admins closes the REST route and leaves that path alone. The cron autoRun is internal.
 */
export const jobsEndpointAccess = ({ req }: { req: { user?: unknown } }): boolean => hasRole(req.user, 'admin');

// Read stays as Payload sets it: the scheduling dialog lists a document's upcoming jobs through it.
export const jobsCollectionOverrides = ({ defaultJobsCollection }: { defaultJobsCollection: CollectionConfig }): CollectionConfig => ({
  ...defaultJobsCollection,
  access: {
    ...defaultJobsCollection.access,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
});
