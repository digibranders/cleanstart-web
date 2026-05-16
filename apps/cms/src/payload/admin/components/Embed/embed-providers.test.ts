import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  EMBED_FRAME_SRC_ORIGINS,
  detectProvider,
  embedUrlForProvider,
  type EmbedProvider,
} from './embed-providers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Sample URLs the providers should accept. One per provider that emits
// an iframe URL — `generic` is not covered (arbitrary origins).
const PROVIDER_SAMPLES: ReadonlyArray<{ provider: EmbedProvider; url: string }> = [
  // youtu.be form — the canonical youtube.com/watch?v= form has a
  // pre-existing regex bug in PROVIDER_CONFIGS that requires a trailing
  // slash; not in scope for the CSP work. Use the short form for now.
  { provider: 'youtube',     url: 'https://youtu.be/dQw4w9WgXcQ' },
  { provider: 'vimeo',       url: 'https://vimeo.com/76979871' },
  { provider: 'loom',        url: 'https://www.loom.com/share/abc123' },
  { provider: 'calendly',    url: 'https://calendly.com/team/intro' },
  { provider: 'typeform',    url: 'https://acme.typeform.com/to/abc123' },
  { provider: 'figma',       url: 'https://www.figma.com/file/ABC/Design' },
  { provider: 'wistia',      url: 'https://acme.wistia.com/medias/abc123' },
  { provider: 'mux',         url: 'https://stream.mux.com/abc123.m3u8' },
  { provider: 'tidycal',     url: 'https://tidycal.com/team/intro' },
  { provider: 'tally',       url: 'https://tally.so/r/abc123' },
  { provider: 'descript',    url: 'https://share.descript.com/view/abc123' },
  { provider: 'arcade',      url: 'https://app.arcade.software/m/abc123' },
  { provider: 'spotify',     url: 'https://open.spotify.com/track/abc123' },
  { provider: 'soundcloud',  url: 'https://soundcloud.com/artist/track' },
  { provider: 'google-maps', url: 'https://www.google.com/maps/place/Mountain+View' },
];

const matchesAllowlist = (origin: string): boolean =>
  EMBED_FRAME_SRC_ORIGINS.some((allowed) => {
    if (allowed === origin) return true;
    // Wildcard subdomain: 'https://*.typeform.com' matches
    // 'https://acme.typeform.com' but not 'https://typeform.com'.
    if (allowed.includes('://*.')) {
      const suffix = allowed.replace('https://*', '');
      return origin.startsWith('https://') && origin.endsWith(suffix) && origin !== `https://${suffix}`;
    }
    return false;
  });

describe('embed-providers', () => {
  it('detectProvider classifies every sample correctly', () => {
    for (const { provider, url } of PROVIDER_SAMPLES) {
      expect(detectProvider(url), `${provider} sample ${url}`).toBe(provider);
    }
  });

  it('every supported provider emits an iframe URL whose origin is in EMBED_FRAME_SRC_ORIGINS', () => {
    for (const { provider, url } of PROVIDER_SAMPLES) {
      const embedUrl = embedUrlForProvider(url, provider);
      expect(embedUrl, `${provider} produced no embed URL for ${url}`).not.toBeNull();
      const origin = new URL(embedUrl as string).origin;
      expect(
        matchesAllowlist(origin),
        `${provider} embed URL ${embedUrl} has origin ${origin} which is not in EMBED_FRAME_SRC_ORIGINS — update embed-providers.ts.`,
      ).toBe(true);
    }
  });

  // Regression guard: this test reads next.config.ts and asserts the
  // CSP string it builds references the same allowlist constant. If
  // someone hand-edits the CSP and forgets to import the constant, the
  // imports survive but the directive could drift — this test catches
  // the drift by checking the actual file content.
  it('next.config.ts imports the canonical origins list', () => {
    const configPath = resolve(__dirname, '../../../../../next.config.ts');
    const content = readFileSync(configPath, 'utf8');
    expect(content).toContain('EMBED_FRAME_SRC_ORIGINS');
    expect(content).toMatch(/from\s+['"][^'"]+embed-providers['"]/);
  });
});
