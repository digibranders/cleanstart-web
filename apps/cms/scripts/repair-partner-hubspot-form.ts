#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: point the become-a-partner form at a HubSpot form that exists.
 *
 * The stored GUID (ea66c444-acfe-4237-9a54-aea500f5e6d7) was deleted in
 * HubSpot at some point after 3 Jun 2026: every HubSpot API answers 404 for
 * it, so the relay had been failing each partner submission with
 * "HubSpot 404" since then. The lead itself still reached Postgres and the
 * partner still got their Brevo email, so nothing surfaced the break.
 *
 * Its replacement `website-become-a-partner` mirrors `website-contact-us`:
 * the same visible fields as the CMS form, the same hidden UTM and click-ID
 * fields, and the same consent block (Marketing Information, 2258674941).
 *
 * Writes via `payload.update`, is idempotent, and supports --dry-run.
 *
 * In the prod container (env is in the process, there is no .env):
 *   /app/node_modules/.bin/tsx scripts/repair-partner-hubspot-form.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/repair-partner-hubspot-form.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const SLUG = 'become-a-partner';
const GUID = 'f159b2e8-9355-4d61-99cb-ad934359204f';

const DRY_RUN = new Set(process.argv.slice(2)).has('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE via payload.update'}\n`);

  const found = await payload.find({
    collection: 'forms',
    where: { slug: { equals: SLUG } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const form = found.docs[0] as { id: number | string; hubspotFormGuid?: string | null } | undefined;
  if (!form) {
    log(`  MISSING  ${SLUG}`);
    process.exitCode = 1;
    return;
  }

  const current = form.hubspotFormGuid?.trim() ?? '';
  if (current === GUID) {
    log(`  skip     ${SLUG} (already ${GUID})`);
    return;
  }
  if (DRY_RUN) {
    log(`  would set ${SLUG}: ${current || '(none)'} -> ${GUID}`);
    return;
  }
  await payload.update({
    collection: 'forms',
    id: form.id,
    data: { hubspotFormGuid: GUID } as Record<string, unknown>,
    overrideAccess: true,
  });
  log(`  set      ${SLUG}: ${current || '(none)'} -> ${GUID}`);
};

run()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
