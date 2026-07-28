import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { PURGEABLE_COLLECTIONS } from './web-pages';

const APP_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../web/src/app',
);

/**
 * Collect every route URL-pattern, stripping (groups).
 *
 * A segment counts as a route if it has a `page.tsx` OR a `route.ts` — the
 * latter is a Route Handler, which serves a real URL just like a page. The
 * email-signature detail route is a handler on purpose: it emits a bare HTML
 * document so the whole `<body>` is the signature and nothing else, which a
 * page inheriting the site layout could not do.
 */
const collectRoutePatterns = (dir: string, urlSegments: string[], out: Set<string>): void => {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (entry.startsWith('(') && entry.endsWith(')')) {
      collectRoutePatterns(full, urlSegments, out); // route group — not in URL
      continue;
    }
    const next = [...urlSegments, entry];
    if (existsSync(path.join(full, 'page.tsx')) || existsSync(path.join(full, 'route.ts'))) {
      out.add(`/${next.join('/')}`);
    }
    collectRoutePatterns(full, next, out);
  }
};

describe('PURGEABLE_COLLECTIONS map matches real apps/web routes', () => {
  const patterns = new Set<string>();
  collectRoutePatterns(APP_DIR, [], patterns);

  for (const [collection, page] of Object.entries(PURGEABLE_COLLECTIONS)) {
    if (page.listingPath) {
      it(`${collection}: listing ${page.listingPath} exists`, () => {
        expect(patterns.has(page.listingPath as string)).toBe(true);
      });
    }
    if (page.detailPrefix) {
      it(`${collection}: detail ${page.detailPrefix}/[slug] exists`, () => {
        expect(patterns.has(`${page.detailPrefix}/[slug]`)).toBe(true);
      });
    }
  }
});
