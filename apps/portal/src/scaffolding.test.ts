import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../', import.meta.url));
const SELF = 'src/scaffolding.test.ts';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const sources = ['src', 'scripts', 'e2e']
  .map((folder) => join(root, folder))
  .filter((folder) => existsSync(folder))
  .flatMap(walk)
  .filter((file) => /\.(ts|tsx|mjs)$/.test(file))
  .map((file) => relative(root, file))
  .filter((file) => file !== SELF);

const SCAFFOLDING =
  /@\/lib\/slice|createSlice|shell\/personas|\.\/personas|@\/tour|driver\.js|@\/data\/|@\/lib\/demo-date|mock-banner|TourProvider|data-tour/;

describe('mock scaffolding is gone (M5.4)', () => {
  it('has no source file that mentions the mock scaffolding', () => {
    const hits = sources.filter((file) => SCAFFOLDING.test(readFileSync(join(root, file), 'utf8')));
    expect(hits).toEqual([]);
  });

  // The deal form keeps an unsent draft per user in the browser (B2). It is the only file allowed to; the data is the
  // partner's own unsent text and is cleared on submit. Everything else must keep state on the server.
  const STORAGE_ALLOWED = ['src/components/screens/RegisterDeal.tsx'];

  it('has no source file that uses browser storage, except the deal form draft', () => {
    const hits = sources.filter((file) => !STORAGE_ALLOWED.includes(file) && /localStorage|sessionStorage/.test(readFileSync(join(root, file), 'utf8')));
    expect(hits).toEqual([]);
  });

  it.each([
    'src/lib/slice.ts',
    'src/lib/demo-date.ts',
    'src/components/shell/personas.ts',
    'src/tour',
    'src/data',
  ])('has deleted %s', (path) => {
    expect(existsSync(join(root, path))).toBe(false);
  });

  it('has no banner, walkthrough or Driver.js rule in the stylesheet', () => {
    const css = readFileSync(join(root, 'src/styles/portal.css'), 'utf8');
    expect(css).not.toMatch(/mock-banner|\.tour-|\.driver-|--banner-h/);
  });

  it('does not depend on driver.js', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { dependencies: Record<string, string> };
    expect(pkg.dependencies['driver.js']).toBeUndefined();
  });

  it('shows no mock wording in the app shell metadata', () => {
    expect(readFileSync(join(root, 'src/app/layout.tsx'), 'utf8')).not.toMatch(/\(mock\)|Clickable mock/i);
  });

  it('keeps the development seed and fixtures', () => {
    expect(existsSync(join(root, 'scripts/seed-dev.ts'))).toBe(true);
    expect(existsSync(join(root, 'src/db/fixtures.ts'))).toBe(true);
  });
});

describe('the shell reads real data (M5.4 step 0)', () => {
  const shell = readFileSync(join(root, 'src/components/shell/shell.tsx'), 'utf8');

  it('has no mock search or notification state', () => {
    expect(shell).not.toMatch(/searchOpen|PARTNER_SEARCH|ADMIN_SEARCH|notesRead|partnerNotes|adminNotes/);
  });

  it('mounts the search palette and the notifications popover', () => {
    expect(shell).toContain('<SearchPalette kind={kind} nav={nav} />');
    expect(shell).toContain('<NotificationsPopover');
    expect(shell).toContain("aria-label={searchLabel}");
  });

  it.each(['src/app/partner/layout.tsx', 'src/app/admin/layout.tsx'])('%s loads the viewer notifications', (layout) => {
    const text = readFileSync(join(root, layout), 'utf8');
    expect(text).toContain('listNotifications(tx, viewer, { limit: 10 })');
    expect(text).toContain('today={systemClock.today()}');
  });
});
