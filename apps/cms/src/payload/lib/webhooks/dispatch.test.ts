import { describe, expect, it, vi } from 'vitest';

import { destinationsFromEnv, dispatchEvent } from './dispatch';
import { verifyWebhook } from './sign';

describe('destinationsFromEnv', () => {
  it('returns empty when no env is set', () => {
    expect(destinationsFromEnv({} as NodeJS.ProcessEnv)).toEqual([]);
  });

  it('builds a Teams destination when WEBHOOK_TEAMS_URL is set', () => {
    const dests = destinationsFromEnv({
      WEBHOOK_TEAMS_URL: 'https://teams.example/hook',
    } as unknown as NodeJS.ProcessEnv);
    expect(dests).toHaveLength(1);
    expect(dests[0]).toMatchObject({ id: 'teams', kind: 'teams' });
  });

  it('builds a generic destination only when both URL + secret are set', () => {
    const onlyUrl = destinationsFromEnv({
      WEBHOOK_GENERIC_URL: 'https://generic.example/hook',
    } as unknown as NodeJS.ProcessEnv);
    expect(onlyUrl).toEqual([]);

    const both = destinationsFromEnv({
      WEBHOOK_GENERIC_URL: 'https://generic.example/hook',
      WEBHOOK_GENERIC_SIGNING_SECRET: 'secret',
    } as unknown as NodeJS.ProcessEnv);
    expect(both).toHaveLength(1);
    expect(both[0]).toMatchObject({ id: 'generic', kind: 'generic' });
  });

  it('honours WEBHOOK_TEAMS_EVENTS as a comma-list filter', () => {
    const dests = destinationsFromEnv({
      WEBHOOK_TEAMS_URL: 'https://x',
      WEBHOOK_TEAMS_EVENTS: 'lead.submitted',
    } as unknown as NodeJS.ProcessEnv);
    expect(dests[0]?.events).toEqual(['lead.submitted']);
  });

  it('falls back to all events when WEBHOOK_TEAMS_EVENTS is empty / unknown', () => {
    const dests = destinationsFromEnv({
      WEBHOOK_TEAMS_URL: 'https://x',
      WEBHOOK_TEAMS_EVENTS: 'bogus.event',
    } as unknown as NodeJS.ProcessEnv);
    expect(dests[0]?.events).toEqual(['document.published', 'lead.submitted']);
  });
});

describe('dispatchEvent', () => {
  it('returns [] when no destinations are configured', async () => {
    const result = await dispatchEvent(
      { event: 'document.published', data: { slug: 'x' } },
      { destinations: [] },
    );
    expect(result).toEqual([]);
  });

  it('skips destinations that don\'t subscribe to the event', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    const result = await dispatchEvent(
      { event: 'document.published', data: { slug: 'x' } },
      {
        destinations: [
          {
            id: 'teams',
            kind: 'teams',
            url: 'https://x',
            events: ['lead.submitted'],
          },
        ],
        fetch: fetchMock as unknown as typeof fetch,
      },
    );
    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts to a Teams destination with the rendered card', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 202 }));
    const result = await dispatchEvent(
      { event: 'document.published', data: { slug: 'x', title: 'X' } },
      {
        destinations: [
          {
            id: 'teams',
            kind: 'teams',
            url: 'https://x',
            events: ['document.published'],
          },
        ],
        fetch: fetchMock as unknown as typeof fetch,
      },
    );
    expect(result).toEqual([{ destinationId: 'teams', ok: true, status: 202 }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('signs a generic destination delivery and the receiver can verify', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 202 }));
    const fixedNow = new Date('2026-05-05T12:00:00Z');
    await dispatchEvent(
      { event: 'lead.submitted', data: { email: 'a@b.com' }, occurredAt: fixedNow },
      {
        destinations: [
          {
            id: 'gen',
            kind: 'generic',
            url: 'https://recv',
            events: ['lead.submitted'],
            signingKeys: [{ id: 'k1', secret: 'shhh' }],
          },
        ],
        fetch: fetchMock as unknown as typeof fetch,
        now: fixedNow,
      },
    );
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    const init = calls[0]?.[1];
    const headers = init?.headers as Record<string, string>;
    const body = init?.body as string;
    const verify = verifyWebhook(
      {
        'webhook-id': headers['webhook-id'] ?? null,
        'webhook-timestamp': headers['webhook-timestamp'] ?? null,
        'webhook-signature': headers['webhook-signature'] ?? null,
      },
      body,
      [{ id: 'k1', secret: 'shhh' }],
      { now: fixedNow },
    );
    expect(verify).toEqual({ ok: true, matchedKeyId: 'k1' });
  });

  it('logs a warn on non-2xx but still resolves with the failure', async () => {
    const fetchMock = vi.fn(async () => new Response('nope', { status: 500 }));
    const warn = vi.fn();
    const result = await dispatchEvent(
      { event: 'document.published', data: {} },
      {
        destinations: [
          {
            id: 'teams',
            kind: 'teams',
            url: 'https://x',
            events: ['document.published'],
          },
        ],
        fetch: fetchMock as unknown as typeof fetch,
        logger: { warn },
      },
    );
    expect(result[0]).toMatchObject({ ok: false, status: 500 });
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ destination: 'teams', status: 500 }),
      'webhook delivery failed',
    );
  });

  it('continues to the next destination when one fails', async () => {
    let call = 0;
    const fetchMock = vi.fn(async () => {
      call += 1;
      return call === 1
        ? new Response('boom', { status: 500 })
        : new Response(null, { status: 200 });
    });
    const result = await dispatchEvent(
      { event: 'document.published', data: {} },
      {
        destinations: [
          { id: 'a', kind: 'teams', url: 'https://a', events: ['document.published'] },
          { id: 'b', kind: 'teams', url: 'https://b', events: ['document.published'] },
        ],
        fetch: fetchMock as unknown as typeof fetch,
      },
    );
    expect(result).toEqual([
      expect.objectContaining({ destinationId: 'a', ok: false }),
      expect.objectContaining({ destinationId: 'b', ok: true }),
    ]);
  });
});
