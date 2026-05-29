import { describe, it, expect } from 'vitest';
import { glyphs } from './glyphs';
import { NAV_TREE } from '@/lib/nav-config';

function collectIcons(): string[] {
  const out: string[] = [];
  for (const item of NAV_TREE) {
    if (item.kind === 'flat') continue;
    const groups = item.kind === 'mega' ? item.groups : [{ items: item.items }];
    for (const g of groups) {
      for (const leaf of g.items) {
        if (leaf.icon) out.push(leaf.icon);
      }
    }
  }
  return out;
}

describe('glyphs', () => {
  it('contains every icon id referenced by nav-config', () => {
    const referenced = collectIcons();
    const missing = referenced.filter((id) => !(id in glyphs));
    expect(missing).toEqual([]);
  });

  it('exports valid React nodes for each glyph', () => {
    for (const [id, node] of Object.entries(glyphs)) {
      expect(node, `glyph "${id}" must be defined`).toBeTruthy();
    }
  });
});
