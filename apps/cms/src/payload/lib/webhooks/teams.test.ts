import { describe, expect, it, vi } from 'vitest';

import { buildTeamsPayload, postTeamsWebhook } from './teams';

const baseEvent = {
  event: 'document.published' as const,
  data: { title: 'My Post', slug: 'my-post', collection: 'blogs' },
};

describe('buildTeamsPayload', () => {
  it('emits a v1.4 AdaptiveCard wrapped in a Teams attachment', () => {
    const raw = buildTeamsPayload(baseEvent);
    const parsed = JSON.parse(raw) as {
      type: string;
      attachments: { contentType: string; content: { type: string; version: string } }[];
    };
    expect(parsed.type).toBe('message');
    expect(parsed.attachments[0]?.contentType).toBe(
      'application/vnd.microsoft.card.adaptive',
    );
    expect(parsed.attachments[0]?.content.type).toBe('AdaptiveCard');
    expect(parsed.attachments[0]?.content.version).toBe('1.4');
  });

  it('uses title (slug) as the headline when both are present', () => {
    const raw = buildTeamsPayload(baseEvent);
    expect(raw).toContain('My Post (my-post)');
  });

  it('falls back to email when no title/slug is set (lead.submitted shape)', () => {
    const raw = buildTeamsPayload({
      event: 'lead.submitted',
      data: { email: 'jane@example.com', formName: 'Contact' },
    });
    expect(raw).toContain('jane@example.com');
  });

  it('renders a FactSet of up to six top-level fields', () => {
    const raw = buildTeamsPayload({
      event: 'document.published',
      data: {
        a: 1,
        b: 2,
        c: 3,
        d: 4,
        e: 5,
        f: 6,
        g: 7, // dropped
      },
    });
    const parsed = JSON.parse(raw) as {
      attachments: { content: { body: { type: string; facts?: { title: string }[] }[] } }[];
    };
    const fact = parsed.attachments[0]?.content.body.find((b) => b.type === 'FactSet');
    expect(fact?.facts?.length).toBe(6);
    expect(fact?.facts?.map((f) => f.title)).not.toContain('g');
  });

  it('truncates long values rather than blowing up the card', () => {
    const raw = buildTeamsPayload({
      event: 'document.published',
      data: { body: 'a'.repeat(500) },
    });
    expect(raw).toContain('…');
  });
});

describe('postTeamsWebhook', () => {
  it('POSTs the rendered card body to the URL', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 202 }));
    const result = await postTeamsWebhook(
      'https://example.com/hook',
      baseEvent,
      { fetch: fetchMock as unknown as typeof fetch },
    );
    expect(result).toEqual({ ok: true, status: 202 });
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    expect(calls[0]?.[0]).toBe('https://example.com/hook');
    expect(calls[0]?.[1]?.method).toBe('POST');
    expect((calls[0]?.[1]?.headers as Record<string, string>)['content-type']).toBe(
      'application/json',
    );
    expect(calls[0]?.[1]?.body).toBe(buildTeamsPayload(baseEvent));
  });

  it('returns ok=false on non-2xx', async () => {
    const fetchMock = vi.fn(async () => new Response('boom', { status: 500 }));
    const result = await postTeamsWebhook(
      'https://example.com/hook',
      baseEvent,
      { fetch: fetchMock as unknown as typeof fetch },
    );
    expect(result).toEqual({ ok: false, status: 500, error: 'boom' });
  });

  it('returns ok=false on network error', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('network');
    });
    const result = await postTeamsWebhook(
      'https://example.com/hook',
      baseEvent,
      { fetch: fetchMock as unknown as typeof fetch },
    );
    expect(result).toEqual({ ok: false, status: 0, error: 'network' });
  });
});
