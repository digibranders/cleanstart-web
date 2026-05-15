#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-off helper to reset the local-dev admin password. Idempotent —
 * creates the user if missing, updates the password if present.
 *
 * Run from the cms app dir:
 *   node --env-file=.env --no-warnings --experimental-strip-types \
 *     scripts/reset-admin-password.ts <email> <password>
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const run = async (): Promise<void> => {
  console.log('reset-admin-password: starting, argv =', process.argv);
  const [, , emailArg, passwordArg] = process.argv;
  if (!emailArg || !passwordArg) {
    console.error('Usage: reset-admin-password.ts <email> <password>');
    process.exit(1);
  }

  console.log('Loading payload...');
  const payload = await getPayload({ config: payloadConfig });
  console.log('Payload loaded.');

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: emailArg } },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    const user = existing.docs[0]!;
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { password: passwordArg } as Record<string, unknown>,
    });
    console.log(`Updated password for existing user ${emailArg} (id=${user.id}).`);
  } else {
    const created = await payload.create({
      collection: 'users',
      data: {
        email: emailArg,
        password: passwordArg,
      } as Record<string, unknown>,
    });
    console.log(`Created new user ${emailArg} (id=${created.id}).`);
  }

  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
