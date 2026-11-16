import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { definedInNextEnvFiles } from './support/env-files';

/**
 * Pure helper, no browser: every way Next's own parser accepts a variable must be seen by the e2e guard that refuses
 * a run which would load real service settings. Runs in the Playwright run because vitest does not cover e2e/.
 */
const HERE = fileURLToPath(import.meta.url);
const KEYS = ['BREVO_API_KEY', 'HUBSPOT_PORTAL_TOKEN'] as const;

function scan(files: Record<string, string>): string[] {
  const dir = mkdtempSync(join(tmpdir(), 'portal-e2e-env-'));
  try {
    for (const [name, contents] of Object.entries(files)) {
      writeFileSync(join(dir, name), contents);
    }
    return definedInNextEnvFiles(dir, KEYS, HERE);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test.describe('@portal e2e env guard', () => {
  const cases: Array<[string, string, string]> = [
    ['plain KEY=value', 'BREVO_API_KEY=abc\n', 'BREVO_API_KEY in .env'],
    ['colon form', 'BREVO_API_KEY: abc\n', 'BREVO_API_KEY in .env'],
    ['a byte order mark before the first key', '﻿BREVO_API_KEY=abc\n', 'BREVO_API_KEY in .env'],
    ['export prefix', 'export BREVO_API_KEY=abc\n', 'BREVO_API_KEY in .env'],
    ['double quoted value', 'BREVO_API_KEY="abc def"\n', 'BREVO_API_KEY in .env'],
    ['single quoted value', "BREVO_API_KEY='abc'\n", 'BREVO_API_KEY in .env'],
    ['CRLF line endings', 'OTHER=1\r\nBREVO_API_KEY=abc\r\n', 'BREVO_API_KEY in .env'],
    ['an empty value', 'BREVO_API_KEY=\n', 'BREVO_API_KEY in .env'],
  ];
  for (const [name, contents, expected] of cases) {
    test(`refuses ${name}`, () => {
      expect(scan({ '.env': contents })).toEqual([expected]);
    });
  }

  for (const file of ['.env.local', '.env.development', '.env.development.local']) {
    test(`reads ${file}`, () => {
      expect(scan({ [file]: 'HUBSPOT_PORTAL_TOKEN=pat-x\n' })).toEqual([`HUBSPOT_PORTAL_TOKEN in ${file}`]);
    });
  }

  test('does not read a file next dev does not load', () => {
    expect(scan({ '.env.production': 'BREVO_API_KEY=abc\n', '.env.test': 'BREVO_API_KEY=abc\n' })).toEqual([]);
  });

  test('ignores a comment and keys it was not asked about', () => {
    expect(scan({ '.env': '# BREVO_API_KEY=abc\nDATABASE_URL=postgres://x\n' })).toEqual([]);
  });

  test('reports every file that defines a key', () => {
    expect(scan({ '.env': 'BREVO_API_KEY=a\n', '.env.local': 'BREVO_API_KEY: b\nHUBSPOT_PORTAL_TOKEN=c\n' }).sort()).toEqual([
      'BREVO_API_KEY in .env',
      'BREVO_API_KEY in .env.local',
      'HUBSPOT_PORTAL_TOKEN in .env.local',
    ]);
  });
});
