import { describe, expect, it } from 'vitest';

import { PERMISSIONS_POLICY, REPORTING_ENDPOINTS, buildCsp } from './csp';

const parse = (csp: string): Record<string, string> =>
  Object.fromEntries(
    csp
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [name, ...rest] = d.split(' ');
        return [name, rest.join(' ')];
      }),
  );

const base = {
  isProduction: true,
  isDraftMode: false,
};

describe('buildCsp', () => {
  it('allows inline script and style (static-prerender-compatible policy)', () => {
    const d = parse(buildCsp(base));
    expect(d['script-src']).toContain("'unsafe-inline'");
    expect(d['style-src']).toContain("'unsafe-inline'");
    expect(d['style-src']).toContain("'self'");
  });

  it('does not use a per-request nonce or strict-dynamic (would force dynamic rendering)', () => {
    const csp = buildCsp(base);
    expect(csp).not.toContain('nonce-');
    expect(csp).not.toContain('strict-dynamic');
  });

  it('allows the GCS bucket in media-src for lesson videos', () => {
    const d = parse(buildCsp(base));
    expect(d['media-src']).toContain('https://storage.googleapis.com');
    expect(d['media-src']).toContain("'self'");
  });

  it('allows the youtube-nocookie player in frame-src', () => {
    const d = parse(buildCsp(base));
    // Without an explicit frame-src these iframes inherit default-src 'self'
    // and are blocked outright once the policy is enforced.
    expect(d['frame-src']).toContain('https://www.youtube-nocookie.com');
    expect(d['frame-src']).toContain("'self'");
  });

  it('allows YouTube poster images in img-src', () => {
    const d = parse(buildCsp(base));
    // frame-src allows the player origin; the thumbnails come from ytimg.com.
    // Without this, every podcast/lesson poster frame is blocked outright.
    expect(d['img-src']).toContain('https://*.ytimg.com');
  });

  it('allows the Turnstile challenge iframe in frame-src', () => {
    const d = parse(buildCsp(base));
    // Turnstile's loader is covered by script-src 'https:', but its challenge
    // renders in an iframe from this origin. Omitting it strips bot protection
    // from every lead form the moment CSP_ENFORCE is set.
    expect(d['frame-src']).toContain('https://challenges.cloudflare.com');
  });

  it('allows GA4 gtag.js and its collect endpoints (incl. regional)', () => {
    const d = parse(buildCsp(base));
    expect(d['connect-src']).toContain('https://www.googletagmanager.com');
    expect(d['connect-src']).toContain('https://www.google-analytics.com');
    expect(d['connect-src']).toContain('https://*.google-analytics.com');
    expect(d['connect-src']).toContain('https://*.analytics.google.com');
    // gtag.js library is served over https: (no per-host script-src needed).
    expect(d['script-src']).toContain('https:');
  });

  it('allows the Leadfeeder tracker host in connect-src and img-src', () => {
    const d = parse(buildCsp(base));
    expect(d['connect-src']).toContain('https://*.lfeeder.com');
    expect(d['img-src']).toContain('https://*.lfeeder.com');
    // The sc.lfeeder.com loader is served over https: (no per-host script-src).
    expect(d['script-src']).toContain('https:');
  });

  it('locks object-src, base-uri and form-action', () => {
    const d = parse(buildCsp(base));
    expect(d['object-src']).toBe("'none'");
    expect(d['base-uri']).toBe("'self'");
    expect(d['form-action']).toBe("'self'");
  });

  it('denies framing by default', () => {
    expect(parse(buildCsp(base))['frame-ancestors']).toBe("'none'");
  });

  it('allows the preview/admin frame ancestors in draft mode', () => {
    const d = parse(buildCsp({ ...base, isDraftMode: true }));
    expect(d['frame-ancestors']).toContain('https://cms.cleanstart.com');
    expect(d['frame-ancestors']).not.toContain("'none'");
  });

  it('allows preview frame ancestors on a preview path', () => {
    const d = parse(buildCsp({ ...base, isPreviewPath: true }));
    expect(d['frame-ancestors']).toContain('http://localhost:3000');
  });

  it('adds localhost CMS to connect-src only outside production', () => {
    expect(parse(buildCsp({ ...base, isProduction: false }))['connect-src']).toContain(
      'http://localhost:3000',
    );
    expect(parse(buildCsp(base))['connect-src']).not.toContain('http://localhost:3000');
  });

  it('does not emit Trusted Types (incompatible with the Turbopack chunk loader)', () => {
    // require-trusted-types-for 'script' blocks Turbopack's `script.src` chunk
    // loads, crashing hydration on every route. Must stay absent in both modes.
    expect(buildCsp(base)).not.toContain('require-trusted-types-for');
    expect(buildCsp(base)).not.toContain('trusted-types');
    expect(buildCsp({ ...base, isProduction: false })).not.toContain('trusted-types');
  });

  it('emits upgrade-insecure-requests as a bare directive', () => {
    const csp = buildCsp(base);
    expect(csp).toContain('upgrade-insecure-requests');
    expect(csp).not.toContain('upgrade-insecure-requests ;');
  });
});

describe('policy constants', () => {
  it('PERMISSIONS_POLICY disables high-risk features and ad-tech APIs', () => {
    expect(PERMISSIONS_POLICY).toContain('camera=()');
    expect(PERMISSIONS_POLICY).toContain('geolocation=()');
    expect(PERMISSIONS_POLICY).toContain('browsing-topics=()');
  });

  it('REPORTING_ENDPOINTS points at the CSP report route', () => {
    expect(REPORTING_ENDPOINTS).toContain('/api/csp-report');
  });
});
