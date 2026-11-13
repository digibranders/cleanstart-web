import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', '..');

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

/** Names imported as values (not `import type`, not `type X` specifiers) from '@/db/client' in one file. */
const clientValueImports = (source: string): string[] => {
  const names: string[] = [];
  for (const match of source.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+['"]@\/db\/client['"]/g)) {
    if (match[1]) continue;
    for (const part of (match[2] ?? '').split(',')) {
      const trimmed = part.trim();
      if (!trimmed || trimmed.startsWith('type ')) continue;
      names.push((trimmed.split(/\s+as\s+/)[0] ?? '').trim());
    }
  }
  return names;
};

const files = walk(SRC).filter((file) => /\.tsx?$/.test(file));
const rel = (file: string): string => relative(SRC, file).split(sep).join('/');

describe('database client import rules', () => {
  it('detects value imports and ignores type imports', () => {
    expect(clientValueImports("import { db, type Db, pool as p } from '@/db/client';")).toEqual(['db', 'pool']);
    expect(clientValueImports("import type { Db } from '@/db/client';")).toEqual([]);
    expect(clientValueImports("import { appDb } from '@/db/client'")).toEqual(['appDb']);
  });

  it('lets only server/repo/context.ts (and test files) import appDb', () => {
    const offenders = files
      .filter((file) => rel(file) !== 'server/repo/context.ts' && !/\.test\.tsx?$/.test(file))
      .filter((file) => clientValueImports(readFileSync(file, 'utf8')).includes('appDb'))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it('keeps db, systemDb and pool out of repo and action code (tests excepted)', () => {
    const offenders = files
      .filter((file) => /^server\/(repo|actions)\//.test(rel(file)))
      .filter((file) => rel(file) !== 'server/repo/context.ts' && !/\.test\.tsx?$/.test(file))
      .filter((file) => clientValueImports(readFileSync(file, 'utf8')).some((name) => ['db', 'systemDb', 'pool'].includes(name)))
      .map(rel);
    expect(offenders).toEqual([]);
  });
});
