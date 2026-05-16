#!/usr/bin/env -S node --no-warnings --experimental-strip-types
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const email = process.argv[2];
if (!email) {
  console.error('Usage: promote-admin.ts <email>');
  process.exit(1);
}

console.log('[promote] start');
const payload = await getPayload({ config: payloadConfig });
console.log('[promote] payload ready');

const existing = await payload.find({
  collection: 'users',
  where: { email: { equals: email } },
  limit: 1,
});
console.log('[promote] found', existing.docs.length, 'users');

if (existing.docs.length === 0) {
  console.error('[promote] no user');
  process.exit(1);
}

const user = existing.docs[0]!;
const updated = await payload.update({
  collection: 'users',
  id: user.id,
  data: { roles: ['admin', 'editor', 'author'], enabled: true } as Record<string, unknown>,
  overrideAccess: true,
});
console.log('[promote] updated, roles=', (updated as { roles?: string[] }).roles);
process.exit(0);
