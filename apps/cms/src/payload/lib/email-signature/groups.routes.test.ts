import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { SIGNATURE_GROUPS } from '../../collections/EmailSignatures';

/**
 * Cross-app drift guard for the directory groups.
 *
 * `SIGNATURE_GROUPS` (the CMS select enum) and `SIGNATURE_GROUP_ORDER` (the
 * order apps/web renders them in) have to describe the same set. A group added
 * to the CMS but missing from the web list still renders — `groupSignatures`
 * appends unknown groups — but it lands in an alphabetical tail instead of its
 * intended position, which is the kind of bug nobody notices until someone
 * asks why Legal is above Engineering.
 *
 * Asserted by reading the web source rather than importing it, because the two
 * apps have separate tsconfigs and the web module pulls in `next/*`. Same
 * approach as `web-pages.routes.test.ts`.
 */
const WEB_LIB = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../../../../../web/src/lib/email-signatures-utils.ts',
);

const webGroupOrder = (): string[] => {
  const source = readFileSync(WEB_LIB, 'utf8');
  const block = source.match(
    /export const SIGNATURE_GROUP_ORDER = \[([\s\S]*?)\] as const;/,
  );
  if (!block?.[1]) throw new Error('SIGNATURE_GROUP_ORDER not found in apps/web');
  return [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1] as string);
};

describe('signature groups match across cms and web', () => {
  const web = webGroupOrder();

  it('finds the web ordering list', () => {
    expect(web.length).toBeGreaterThan(0);
  });

  it('covers exactly the same set of groups', () => {
    expect([...web].sort()).toEqual([...SIGNATURE_GROUPS].sort());
  });

  it('has no duplicates on either side', () => {
    expect(new Set(web).size).toBe(web.length);
    expect(new Set(SIGNATURE_GROUPS).size).toBe(SIGNATURE_GROUPS.length);
  });
});
