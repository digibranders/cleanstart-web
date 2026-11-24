import { runApplicationDigest } from './application-digest';
import { runChatDigest } from './chat-digest';
import { runDocumentPurge } from './document-purge';
import { runExpiry } from './expiry';
import { runExpiryReminders } from './expiry-reminders';
import { runHubspotOutbox } from './hubspot-outbox';
import { runHubspotPoll } from './hubspot-poll';
import { runIntake } from './intake';
import { runInviteReminders } from './invite-reminders';
import { runPendingDigest } from './pending-digest';
import { runReconcile } from './reconcile';
import { runRetention } from './retention';
import type { JobSpec } from './schedule';

export const JOBS: readonly JobSpec[] = [
  { name: 'hubspot-outbox', schedule: '* * * * *', run: runHubspotOutbox },
  { name: 'hubspot-poll', schedule: '*/5 * * * *', run: runHubspotPoll },
  { name: 'hubspot-reconcile', schedule: '30 2 * * *', run: runReconcile },
  { name: 'expiry', schedule: '10 0 * * *', run: runExpiry },
  { name: 'expiry-reminders', schedule: '0 5 * * *', run: runExpiryReminders },
  { name: 'invite-reminders', schedule: '30 5 * * *', run: runInviteReminders },
  { name: 'pending-digest', schedule: '30 4 * * *', run: runPendingDigest },
  { name: 'application-digest', schedule: '35 4 * * *', run: runApplicationDigest },
  { name: 'chat-digest', schedule: '*/5 * * * *', run: runChatDigest },
  { name: 'website-intake', schedule: '*/5 * * * *', run: runIntake },
  { name: 'document-purge', schedule: '20 3 * * *', run: runDocumentPurge },
  { name: 'retention', schedule: '40 3 * * *', run: runRetention },
];
