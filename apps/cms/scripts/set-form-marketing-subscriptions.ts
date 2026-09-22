#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: point the book-a-demo and gated-download forms at the HubSpot
 * "Marketing Information" subscription, so a visitor who ticks "Keep me
 * updated" is actually subscribed.
 *
 * Neither form had a subscription type, so the relay sent consent to process
 * only and every marketing opt-in was dropped.
 *
 * ORDER MATTERS. Until the relay change that sends a subscription only for a
 * visitor who ticked the box, setting a type here would subscribe EVERY
 * visitor to marketing. This script therefore refuses to write unless the code
 * it runs against contains that guard: it imports `hubspotLegalConsent` (absent
 * before the fix, so the import fails) and checks that an unticked visitor gets
 * no subscription.
 *
 * IDs verified 2026-09-17 in HubSpot (Settings > Marketing > Email >
 * Subscription Types, "Used in"). The portal has exactly three types, none
 * archived:
 *   2258674941  Marketing Information   <- used here
 *   2258674944  One to One (HubSpot's default for 1:1 sales email)
 *   3005083821  Newsletter              (the newsletter form, left unchanged)
 * Every one of these HubSpot forms now carries the same consent block: an
 * explicit consent-to-process plus one Marketing Information checkbox. The
 * gated form used to point its checkbox at One to One, and contact and
 * become-a-partner had no consent configuration at all, which is why those
 * two were out of scope here until 22 Sep 2026.
 *
 * Writes via `payload.update`, is idempotent, and supports --dry-run.
 *
 * In the prod container (env is in the process, there is no .env):
 *   /app/node_modules/.bin/tsx scripts/set-form-marketing-subscriptions.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/set-form-marketing-subscriptions.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';
import { hubspotLegalConsent } from '../src/payload/lib/lead-handlers/hubspot.ts';

const MARKETING_INFORMATION = '2258674941';

const TARGETS: Readonly<Record<string, string>> = {
  'book-a-demo': MARKETING_INFORMATION,
  'content-gated': MARKETING_INFORMATION,
  contact: MARKETING_INFORMATION,
  'become-a-partner': MARKETING_INFORMATION,
};

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

/** Refuse to run against a relay that would subscribe unticked visitors. */
const assertOptInGuard = (): void => {
  const probe = { givenAt: '2026-01-01T00:00:00.000Z', snapshot: 'probe' };
  const unticked = hubspotLegalConsent({ ...probe, categories: ['storage'] }, 1);
  const ticked = hubspotLegalConsent({ ...probe, categories: ['storage', 'marketing'] }, 1);
  if (unticked?.consent.communications !== undefined) {
    throw new Error('Relay would subscribe a visitor who did not opt in. Deploy the fix first.');
  }
  if (ticked?.consent.communications === undefined) {
    throw new Error('Relay does not subscribe a visitor who opted in. Refusing to continue.');
  }
};

const run = async (): Promise<void> => {
  assertOptInGuard();
  log('Opt-in guard present in the running relay.');

  const payload = await getPayload({ config: payloadConfig });
  log(`\nMode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE via payload.update'}\n`);

  let updated = 0;
  let skipped = 0;
  let missing = 0;
  let errors = 0;

  for (const [slug, typeId] of Object.entries(TARGETS)) {
    const found = await payload.find({
      collection: 'forms',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const form = found.docs[0] as
      | { id: number | string; hubspotSubscriptionTypeId?: string | null }
      | undefined;
    if (!form) {
      missing += 1;
      log(`  MISSING  ${slug}`);
      continue;
    }
    const current = form.hubspotSubscriptionTypeId?.trim() ?? '';
    if (current === typeId) {
      skipped += 1;
      log(`  skip     ${slug} (already ${typeId})`);
      continue;
    }
    if (DRY_RUN) {
      updated += 1;
      log(`  would set ${slug}: ${current || '(none)'} -> ${typeId}`);
      continue;
    }
    try {
      await payload.update({
        collection: 'forms',
        id: form.id,
        data: { hubspotSubscriptionTypeId: typeId } as Record<string, unknown>,
        overrideAccess: true,
      });
      updated += 1;
      log(`  set      ${slug}: ${current || '(none)'} -> ${typeId}`);
    } catch (err) {
      errors += 1;
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console -- script output
      console.error(`  ! forms ${slug}: ${message}`);
    }
  }

  log(`\nDone. updated=${updated} skipped=${skipped} missing=${missing} errors=${errors}`);
  if (errors > 0) process.exitCode = 1;
};

run()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
