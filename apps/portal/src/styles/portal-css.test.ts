import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, 'portal.css'), 'utf8');

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi = 0, lo = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('portal.css control tokens', () => {
  const token = /--ctl-border:(#[0-9A-Fa-f]{6})/.exec(css)?.[1] ?? '';

  it('defines a control border of at least 3:1 on the page and card backgrounds', () => {
    expect(token).not.toBe('');
    for (const background of ['#FFFFFF', '#FAFAFB', '#FCFCFD']) {
      expect(contrast(token, background), background).toBeGreaterThanOrEqual(3);
    }
  });

  it('uses the token on every control, not a hard-coded light grey', () => {
    for (const selector of ['.fsel', '.finput', '.field', '.rsel', '.chk', '.radio', '.seg']) {
      const rule = new RegExp(`(^|\\n)${selector.replace('.', '\\.')}\\{[^}]*var\\(--ctl-border\\)`);
      expect(css, selector).toMatch(rule);
    }
  });

  it('keeps the placeholder at 4.5:1 or better', () => {
    const color = /::placeholder\{color:(#[0-9A-Fa-f]{6})/.exec(css)?.[1] ?? '';
    expect(contrast(color, '#FCFCFD')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('portal.css mobile rules', () => {
  const mobile = css.slice(css.lastIndexOf('@media (max-width:760px){'));

  it('defines hide-sm at the mobile breakpoint', () => {
    expect(mobile).toContain('.hide-sm{display:none}');
  });

  it('gives touch targets 40 px', () => {
    expect(mobile).toContain('.ibtn{width:40px;height:40px}');
    expect(mobile).toMatch(/\.act\{[^}]*min-width:40px;height:40px/);
    expect(mobile).toContain('.btn,.field,.fsel,.finput,.dd-btn,.tab{min-height:40px}');
  });
});
