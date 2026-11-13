// Fails when a source file, spec or script contains an em-dash or an en-dash (CLAUDE.md: no AI-tell punctuation in
// code-owned copy). Mirrors apps/web `verify:copy`. Run: node apps/portal/scripts/verify-copy.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['src', 'e2e', 'scripts', 'drizzle'];
const FILES = ['next.config.ts', 'playwright.config.ts', 'README.md'];
const SKIP = new Set(['node_modules', '.next', '.next-e2e', 'playwright-report', 'test-results', '.auth', 'meta']);
// Built from code points so this file itself contains neither character.
const DASH = new RegExp(`[${String.fromCharCode(8211, 8212)}]`);

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return [];
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const isFile = (p) => statSync(p, { throwIfNoEntry: false })?.isFile() ?? false;
const isDir = (p) => statSync(p, { throwIfNoEntry: false })?.isDirectory() ?? false;

const files = [
  ...DIRS.map((d) => path.join(root, d)).filter(isDir).flatMap(walk),
  ...FILES.map((f) => path.join(root, f)).filter(isFile),
];

const hits = [];
for (const file of files) {
  if (!/\.(ts|tsx|mjs|cjs|js|json|sql|css|md)$/.test(file)) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (DASH.test(line)) hits.push(`${path.relative(root, file)}:${index + 1}: ${line.trim().slice(0, 100)}`);
    });
}

if (hits.length > 0) {
  console.error(`Found ${hits.length} em-dash or en-dash line(s). Use a comma, a colon, a full stop, or "to" for ranges:`);
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.info(`verify:copy ok (${files.length} files)`);
