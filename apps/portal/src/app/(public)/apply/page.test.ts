import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('/apply page', () => {
  it('is rendered per request so the Turnstile site key is read at runtime, not baked in at build time', () => {
    const source = readFileSync(join(__dirname, 'page.tsx'), 'utf8');
    expect(source).toMatch(/export const dynamic = ["']force-dynamic["']/u);
  });
});
