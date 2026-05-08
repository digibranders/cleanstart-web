import { describe, expect, it } from 'vitest';

import {
  type RedirectChainStep,
  type RedirectLookup,
  detectRedirectChain,
} from './redirect-cycle-guard';

const tableLookup = (
  table: Record<string, RedirectChainStep>,
): RedirectLookup =>
  async (from) => table[from] ?? null;

describe('detectRedirectChain', () => {
  it('returns ok for a simple one-hop redirect with no further chain', async () => {
    const result = await detectRedirectChain({
      from: '/old',
      to: '/new',
      lookup: tableLookup({}),
    });
    expect(result).toEqual({ kind: 'ok', target: '/new', hops: 0 });
  });

  it('returns ok for an external destination', async () => {
    const result = await detectRedirectChain({
      from: '/docs',
      to: 'https://example.com/docs',
      lookup: tableLookup({}),
    });
    expect(result.kind).toBe('ok');
  });

  it('detects a two-hop cycle (/a -> /b -> /a)', async () => {
    const result = await detectRedirectChain({
      from: '/a',
      to: '/b',
      lookup: tableLookup({
        '/b': { to: '/a', status: '301' },
      }),
    });
    expect(result.kind).toBe('cycle');
    if (result.kind === 'cycle') expect(result.via).toBe('/a');
  });

  it('detects a three-hop cycle', async () => {
    const result = await detectRedirectChain({
      from: '/a',
      to: '/b',
      lookup: tableLookup({
        '/b': { to: '/c', status: '301' },
        '/c': { to: '/d', status: '301' },
        '/d': { to: '/a', status: '301' },
      }),
    });
    expect(result.kind).toBe('cycle');
  });

  it('flattens chains longer than 3 hops', async () => {
    const result = await detectRedirectChain({
      from: '/a',
      to: '/b',
      lookup: tableLookup({
        '/b': { to: '/c', status: '301' },
        '/c': { to: '/d', status: '301' },
        '/d': { to: '/e', status: '301' },
        '/e': { to: '/f', status: '301' },
      }),
    });
    expect(result.kind).toBe('flatten');
    if (result.kind === 'flatten') expect(result.target).toBe('/f');
  });

  it('treats a 410 hop as the end of the chain', async () => {
    const result = await detectRedirectChain({
      from: '/old',
      to: '/intermediate',
      lookup: tableLookup({
        '/intermediate': { to: '', status: '410' },
      }),
    });
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') expect(result.target).toBe('/intermediate');
  });

  it('normalizes trailing slashes when comparing nodes', async () => {
    const result = await detectRedirectChain({
      from: '/old/',
      to: '/new',
      lookup: tableLookup({
        '/new': { to: '/old', status: '301' },
      }),
    });
    expect(result.kind).toBe('cycle');
  });

  it('runs cycle detection through an external hop boundary (stops at external)', async () => {
    const result = await detectRedirectChain({
      from: '/a',
      to: '/b',
      lookup: tableLookup({
        '/b': { to: 'https://example.com/c', status: '301' },
      }),
    });
    expect(result.kind).toBe('ok');
  });

  it('caps chain walking and reports cycle on runaway chains', async () => {
    const lookup: RedirectLookup = async (from) => ({
      to: `${from}/next`,
      status: '301',
    });
    const result = await detectRedirectChain({
      from: '/start',
      to: '/start/next',
      lookup,
    });
    expect(result.kind).toBe('cycle');
  });
});
