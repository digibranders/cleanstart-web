import { describe, expect, it } from 'vitest';

import { sanitizeSvg } from './sanitize-svg';

const wrap = (inner: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${inner}</svg>`;

describe('sanitizeSvg', () => {
  it('strips <script> elements', () => {
    const dirty = wrap('<script>alert(1)</script><circle cx="12" cy="12" r="10"/>');
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toMatch(/<script/i);
    expect(clean).toMatch(/<circle/);
  });

  it('strips event handler attributes', () => {
    const dirty = wrap('<rect width="10" height="10" onload="alert(1)" onclick="x()"/>');
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toMatch(/onload/i);
    expect(clean).not.toMatch(/onclick/i);
    expect(clean).toMatch(/<rect/);
  });

  it('strips <foreignObject> (can embed arbitrary HTML/JS)', () => {
    const dirty = wrap(
      '<foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><script>alert(1)</script></body></foreignObject>',
    );
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toMatch(/foreignObject/i);
    expect(clean).not.toMatch(/<script/i);
  });

  it('rewrites javascript: hrefs to neutral #', () => {
    const dirty = wrap('<a href="javascript:alert(1)"><circle r="5"/></a>');
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toMatch(/javascript:/i);
  });

  it('passes a clean SVG through with content preserved', () => {
    const dirty = wrap('<path d="M0 0 L10 10" fill="#06c7f2"/>');
    const clean = sanitizeSvg(dirty);
    expect(clean).toMatch(/<path/);
    expect(clean).toMatch(/M0 0/);
    expect(clean).toMatch(/#06c7f2/);
  });

  it('handles realistic malicious SVG (script + onload combo)', () => {
    const dirty = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(document.domain)">
        <script>fetch('/api/users').then(r=>r.json()).then(console.log)</script>
        <circle cx="50" cy="50" r="40" fill="red"/>
      </svg>`;
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toMatch(/<script/i);
    expect(clean).not.toMatch(/onload/i);
    expect(clean).not.toMatch(/document\.domain/);
    expect(clean).not.toMatch(/fetch\(/);
    expect(clean).toMatch(/<circle/);
  });
});
