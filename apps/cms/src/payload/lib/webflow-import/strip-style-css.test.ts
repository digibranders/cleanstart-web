import { describe, expect, it } from 'vitest';

import { looksLikeLeakedCss, stripLeakedStyleCss } from './strip-style-css';

const para = (text: string) => ({
  type: 'paragraph',
  children: [{ type: 'text', text }],
});

describe('looksLikeLeakedCss', () => {
  it('flags a leaked stylesheet', () => {
    expect(
      looksLikeLeakedCss(
        ' .what-is-mythos-box { padding: 20px; background-color: rgba(255,255,255,0.1); border-radius: 12px; }',
      ),
    ).toBe(true);
    expect(looksLikeLeakedCss('@media (max-width:768px){ .feature-grid{ gap:30px; } }')).toBe(
      true,
    );
    expect(looksLikeLeakedCss('#hero { display: flex; }')).toBe(true);
  });

  it('does not flag prose, even prose that mentions CSS', () => {
    expect(looksLikeLeakedCss('Set padding: 20px on the container to add space.')).toBe(false);
    expect(looksLikeLeakedCss('The .env file holds secrets.')).toBe(false);
    expect(looksLikeLeakedCss('Use the box { } pattern conceptually.')).toBe(false);
    expect(looksLikeLeakedCss('')).toBe(false);
  });
});

describe('stripLeakedStyleCss', () => {
  it('removes the leaked-CSS paragraph and keeps real prose', () => {
    const body = {
      root: {
        type: 'root',
        children: [
          para('Anthropic’s most advanced security-focused AI model.'),
          para(' .what-is-mythos-box { padding: 20px; border-radius: 12px; } .myth-box { margin: 0; }'),
          para('That changes the economics of cyber risk.'),
        ],
      },
    };
    const { body: next, removed } = stripLeakedStyleCss(body);
    expect(removed).toBe(1);
    const children = (next as typeof body).root.children;
    expect(children).toHaveLength(2);
    expect(JSON.stringify(next)).not.toContain('padding');
    expect(JSON.stringify(next)).toContain('economics of cyber risk');
  });

  it('is a no-op (same reference) for a clean body', () => {
    const body = { root: { type: 'root', children: [para('Just prose here.')] } };
    const result = stripLeakedStyleCss(body);
    expect(result.removed).toBe(0);
    expect(result.body).toBe(body);
  });

  it('tolerates a missing / malformed body', () => {
    expect(stripLeakedStyleCss(null)).toEqual({ body: null, removed: 0 });
    expect(stripLeakedStyleCss({}).removed).toBe(0);
  });
});
