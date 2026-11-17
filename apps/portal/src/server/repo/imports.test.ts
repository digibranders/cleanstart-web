import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', '..');

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const SOURCE_FILE = /\.[mc]?[jt]sx?$/;
const TEST_FILE = /\.(test|spec)\.[mc]?[jt]sx?$/;
const CONTEXT_FILE = /^server\/(.+\/)?context\.ts$/;
const EXT = String.raw`(?:\.[mc]?[jt]sx?)?`;
/** The module specifier of a quoted string: the alias, or any relative path ending in db/<name>, with or without an extension. */
const specifier = (name: string): string =>
  String.raw`['"\`](?:@/db/${name}|\.{1,2}/(?:[^'"\`]*/)?db/${name})${EXT}['"\`]`;

const CLIENT = specifier('client');
const TEST_HELPERS = specifier('test-helpers');
const CLIENT_NAMES = ['appDb', 'db', 'systemDb', 'pool'];

/** Identifiers each src/server owner may import as values (contracts F.1, C.2). Everything else in src/server may only import types. */
const SERVER_OWNERS: ReadonlyArray<{ match: RegExp; names: readonly string[] }> = [
  { match: /^server\/repo\/context\.ts$/, names: ['appDb', 'systemDb'] },
  { match: /^server\/notify\.ts$/, names: ['db'] },
  { match: /^server\/(jobs|hubspot|auth|intake)\//, names: ['db', 'systemDb', 'pool'] },
  // Demo mode only: the upload store of the generated placeholder storage (docs/partner-portal/DEMO.md) is not a table of the real schema.
  { match: /^server\/files\/instance\.ts$/, names: ['pool'] },
];

interface ClientImports {
  /** Names imported as values with `import { ... } from` (not `import type`, not `type X` specifiers). */
  values: string[];
  /** Count of references to the client module that are neither a type import nor a plain named import. */
  otherForms: number;
}

/** Every reference to the client module in one file, classified. */
const clientImports = (source: string): ClientImports => {
  const values: string[] = [];
  const understood = new Set<number>();
  const mark = (match: RegExpMatchArray): void => {
    understood.add((match.index ?? 0) + match[0].length);
  };
  for (const match of source.matchAll(new RegExp(String.raw`\bimport\s+type\s[^;'"\`]*?\bfrom\s*${CLIENT}`, 'g'))) mark(match);
  for (const match of source.matchAll(new RegExp(String.raw`\bimport\s*\{([^}]*)\}\s*from\s*${CLIENT}`, 'g'))) {
    mark(match);
    for (const part of (match[1] ?? '').split(',')) {
      const trimmed = part.trim();
      if (!trimmed || trimmed.startsWith('type ')) continue;
      values.push((trimmed.split(/\s+as\s+/)[0] ?? '').trim());
    }
  }
  let otherForms = 0;
  for (const match of source.matchAll(new RegExp(CLIENT, 'g'))) {
    if (!understood.has((match.index ?? 0) + match[0].length)) otherForms += 1;
  }
  return { values, otherForms };
};

const clientViolations = (path: string, source: string): string[] => {
  const { values, otherForms } = clientImports(source);
  const inServer = path.startsWith('server/');
  const owner = SERVER_OWNERS.find((entry) => entry.match.test(path));
  const allowed = inServer ? (owner?.names ?? []) : ['db', 'systemDb', 'pool'];
  const out: string[] = [];
  if (inServer && otherForms > 0) {
    out.push(`${path}: references @/db/client other than by a type import or a named import (namespace, default, re-export, dynamic import, require)`);
  }
  for (const name of values) {
    if (CLIENT_NAMES.includes(name) && !allowed.includes(name)) out.push(`${path}: imports ${name} from @/db/client`);
  }
  return out;
};

/** Violations of the import and identity rules for one non-test source file. `path` is relative to src, with forward slashes. */
const scanSource = (path: string, source: string): string[] => {
  if (TEST_FILE.test(path) || path.startsWith('db/')) return [];
  const out = clientViolations(path, source);
  if (new RegExp(TEST_HELPERS).test(source)) out.push(`${path}: imports @/db/test-helpers`);
  if (!CONTEXT_FILE.test(path) && /set_config|app\.kind/.test(source)) {
    out.push(`${path}: sets or reads app.kind or set_config outside the withViewer file`);
  }
  return out;
};

const files = walk(SRC).filter((file) => SOURCE_FILE.test(file));
const rel = (file: string): string => relative(SRC, file).split(sep).join('/');

describe('database client import rules', () => {
  it('detects value imports and ignores type imports', () => {
    expect(clientImports("import { db, type Db, pool as p } from '@/db/client';").values).toEqual(['db', 'pool']);
    expect(clientImports("import type { Db } from '@/db/client';")).toEqual({ values: [], otherForms: 0 });
    expect(clientImports("import { appDb } from '@/db/client'").values).toEqual(['appDb']);
  });

  describe('the scanner catches every bypass form (fixtures)', () => {
    const bad: Array<[string, string, string]> = [
      ['named value import', 'server/repo/x.ts', "import { db } from '@/db/client';"],
      ['named import with an alias', 'server/actions/x.ts', "import { appDb as a } from '@/db/client';"],
      ['namespace import', 'server/repo/x.ts', "import * as client from '@/db/client';"],
      ['default import', 'server/repo/x.ts', "import client from '@/db/client';"],
      ['default plus named import', 'server/repo/x.ts', "import client, { type Db } from '@/db/client';"],
      ['side-effect import', 'server/repo/x.ts', "import '@/db/client';"],
      ['re-export', 'server/repo/x.ts', "export { db } from '@/db/client';"],
      ['star re-export', 'server/repo/x.ts', "export * from '@/db/client';"],
      ['dynamic import', 'server/repo/x.ts', "const c = await import('@/db/client');"],
      ['require', 'server/repo/x.mts', "const c = require('@/db/client');"],
      ['relative path', 'server/repo/x.ts', "import { db } from '../../db/client';"],
      ['relative path with an extension', 'server/repo/x.tsx', "import * as c from '../../db/client.ts';"],
      ['relative dynamic import with a js extension', 'server/x.js', "import('../db/client.js');"],
      ['alias with an extension', 'server/repo/x.ts', "import { pool } from '@/db/client.ts';"],
      ['double quoted', 'server/repo/x.ts', 'import * as c from "@/db/client";'],
      ['template literal', 'server/repo/x.ts', 'const c = await import(`@/db/client`);'],
      ['appDb outside src/server', 'app/page.tsx', "import { appDb } from '@/db/client';"],
      ['test helpers by alias', 'server/jobs/x.ts', "import { testDb } from '@/db/test-helpers';"],
      ['test helpers by relative path', 'lib/x.ts', "import { testDb } from '../db/test-helpers';"],
      ['test helpers as a dynamic import', 'app/x.tsx', "await import('@/db/test-helpers');"],
      ['set_config', 'server/repo/x.ts', "sql`select set_config('app.partner_id', ${id}, true)`"],
      ['app.kind', 'server/notify.ts', "const kind = current_setting('app.kind');"],
      ['set_config outside the context file', 'server/auth/context-helper.ts', "sql`select set_config('x', 'y', true)`"],
    ];
    it.each(bad)('flags %s', (_name, path, source) => {
      expect(scanSource(path, source)).not.toEqual([]);
    });

    const good: Array<[string, string, string]> = [
      ['a type import', 'server/repo/x.ts', "import type { Db } from '@/db/client';"],
      ['an inline type specifier', 'server/repo/x.ts', "import { type Db } from '@/db/client';"],
      ['the context owner', 'server/repo/context.ts', "import { appDb, type Db, systemDb } from '@/db/client';\nsql`select set_config('app.kind', 'x', true)`"],
      ['notify owning db', 'server/notify.ts', "import { db } from '@/db/client';"],
      ['a job owning pool', 'server/jobs/schedule.ts', "import { pool } from '@/db/client';"],
      ['a test file', 'server/repo/x.test.ts', "import { db } from '@/db/client';\nimport { testDb } from '@/db/test-helpers';\nset_config"],
      ['a spec file', 'server/x.spec.ts', "import * as c from '@/db/client';"],
      ['the db folder', 'db/test-helpers.ts', "import { pool } from './client';\nset_config app.kind"],
      ['a route using the system pool', 'app/api/x/route.ts', "import { pool } from '@/db/client';"],
      ['an unrelated module', 'server/repo/x.ts', "import { thing } from '@/db/schema';"],
    ];
    it.each(good)('allows %s', (_name, path, source) => {
      expect(scanSource(path, source)).toEqual([]);
    });

    it('does not let notify.ts take pool, or context.ts take db', () => {
      expect(scanSource('server/notify.ts', "import { pool } from '@/db/client';")).not.toEqual([]);
      expect(scanSource('server/repo/context.ts', "import { db } from '@/db/client';")).not.toEqual([]);
    });
  });

  it('keeps the real source tree inside the rules', () => {
    const offenders = files.flatMap((file) => scanSource(rel(file), readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
