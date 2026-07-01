/**
 * Provisions the `preview-bot@cleanstart.com` user that the web app's draft-preview
 * fetch authenticates as (see Users.ts `auth.useAPIKey` comment + access/index.ts
 * `publishedOrAuthenticated`). Anonymous reads are scoped to published docs only;
 * an authenticated request (any role) also sees drafts. Without this user (and its
 * API key wired into the web app's CMS_API_KEY env var), draft preview 404s because
 * the fetch is anonymous and the CMS access filter excludes unpublished docs.
 *
 * Least privilege: `author` is the lowest-privilege value in the required `roles`
 * field (no `viewer`/`none` option exists) and this fresh user owns no content, so
 * it cannot write anything of consequence — read (including drafts) is the only
 * capability that matters here.
 *
 * Idempotent: if the user already exists, reuses it and only (re)generates the API
 * key when `--rotate` is passed or the user has no key yet. The generated key is
 * printed once — copy it into `CMS_API_KEY` in the web app's prod env immediately;
 * it is stored encrypted at rest and cannot be recovered afterwards.
 *
 * Run (inside the cms container):
 *   pnpm exec tsx scripts/provision-preview-bot.ts            # create-if-missing
 *   pnpm exec tsx scripts/provision-preview-bot.ts --rotate    # force a new API key
 */
import crypto from 'crypto';

import { getPayload } from 'payload';

import config from '../src/payload.config.ts';

const EMAIL = 'preview-bot@cleanstart.com';

async function run(): Promise<void> {
  const rotate = process.argv.includes('--rotate');
  const payload = await getPayload({ config });

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: EMAIL } },
    limit: 1,
    overrideAccess: true,
  });

  const apiKey = crypto.randomBytes(32).toString('hex');
  let id: string | number;
  let needsKey: boolean;

  if (existing.docs.length > 0) {
    const user = existing.docs[0] as { id: string | number; enableAPIKey?: boolean };
    id = user.id;
    needsKey = rotate || !user.enableAPIKey;
    console.log(`Found existing preview-bot user (id=${id}).`);
  } else {
    const created = await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        email: EMAIL,
        name: 'Preview Bot',
        password: crypto.randomBytes(24).toString('hex'),
        roles: ['author'],
        enabled: true,
      },
    });
    id = created.id;
    needsKey = true;
    console.log(`Created preview-bot user (id=${id}).`);
  }

  if (!needsKey) {
    console.log('User already has an API key. Pass --rotate to issue a new one.');
    process.exit(0);
  }

  await payload.update({
    collection: 'users',
    id,
    overrideAccess: true,
    data: { enableAPIKey: true, apiKey },
  });

  console.log('\nAPI key generated — copy this now, it will not be shown again:');
  console.log(apiKey);
  console.log(
    '\nSet this as CMS_API_KEY in the web app\'s production environment, then redeploy/restart web.',
  );

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
