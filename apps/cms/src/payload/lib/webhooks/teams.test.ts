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

  it('leads with the clean content title (no slug appended) and the event eyebrow below', () => {
    const raw = buildTeamsPayload(baseEvent);
    const parsed = JSON.parse(raw) as {
      attachments: { content: { body: { type: string; size?: string; text: string }[] } }[];
    };
    const body = parsed.attachments[0]?.content.body ?? [];
    // First block: the title, Large/Bolder, no "(slug)".
    expect(body[0]?.size).toBe('Large');
    expect(body[0]?.text).toBe('My Post');
    // Second block: the small event eyebrow.
    expect(body[1]?.size).toBe('Small');
    expect(body[1]?.text).toBe('CleanStart · document.published');
  });

  it('falls back to email as the title when no title is set (lead.submitted shape)', () => {
    const raw = buildTeamsPayload({
      event: 'lead.submitted',
      data: { email: 'jane@example.com', formSlug: 'contact' },
    });
    const parsed = JSON.parse(raw) as {
      attachments: { content: { body: { text: string }[] } }[];
    };
    expect(parsed.attachments[0]?.content.body[0]?.text).toBe('jane@example.com');
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

  it('renders both Published and Updated date facts (re-publish of older content)', () => {
    const raw = buildTeamsPayload({
      event: 'document.published',
      data: {
        title: 'Old post',
        slug: 'old-post',
        publishedAt: '2026-02-25T05:30:00Z',
        updatedAt: '2026-05-30T13:16:00Z',
      },
    });
    const parsed = JSON.parse(raw) as {
      attachments: { content: { body: { type: string; facts?: { title: string; value: string }[] }[] } }[];
    };
    const facts = parsed.attachments[0]?.content.body.find((b) => b.type === 'FactSet')?.facts ?? [];
    const titles = facts.map((f) => f.title);
    expect(titles).toContain('Published');
    expect(titles).toContain('Updated');
    // Both render as human-readable dates, not raw ISO.
    expect(facts.find((f) => f.title === 'Published')?.value).toContain('Feb 25, 2026');
    expect(facts.find((f) => f.title === 'Updated')?.value).toContain('May 30, 2026');
  });

  it('truncates long values rather than blowing up the card', () => {
    const raw = buildTeamsPayload({
      event: 'document.published',
      data: { body: 'a'.repeat(500) },
    });
    expect(raw).toContain('…');
  });

  it('injects msteams.entities[] and an <at> line when mentions are passed', () => {
    const raw = buildTeamsPayload(baseEvent, {
      mentions: [
        {
          displayName: 'Alex',
          aadObjectId: 'aad-1',
          upn: 'alex@cleanstart.com',
        },
        {
          displayName: 'Priya',
          aadObjectId: 'aad-2',
          upn: 'priya_fynix.digital#EXT#@cleanstart.onmicrosoft.com',
        },
      ],
    });
    expect(raw).toContain('<at>Alex</at>');
    expect(raw).toContain('<at>Priya</at>');
    const parsed = JSON.parse(raw) as {
      attachments: {
        content: {
          msteams?: { entities: { type: string; mentioned: { id: string; name: string } }[] };
        };
      }[];
    };
    expect(parsed.attachments[0]?.content.msteams?.entities.length).toBe(2);
    expect(parsed.attachments[0]?.content.msteams?.entities[0]?.mentioned.id).toBe('aad-1');
    // mentioned.name is the display name Teams renders (NOT the UPN/email).
    expect(parsed.attachments[0]?.content.msteams?.entities[0]?.mentioned.name).toBe('Alex');
    expect(parsed.attachments[0]?.content.msteams?.entities[1]?.mentioned.name).toBe('Priya');
    expect(parsed.attachments[0]?.content.msteams?.entities[1]?.mentioned.id).toBe('aad-2');
  });

  it('renders an Action.OpenUrl "View live page" button when data.url is set', () => {
    const raw = buildTeamsPayload({
      event: 'document.published',
      data: { title: 'My Post', slug: 'my-post', collection: 'blogs', url: 'https://cleanstart.com/blogs/my-post' },
    });
    const parsed = JSON.parse(raw) as {
      attachments: {
        content: {
          actions?: { type: string; title: string; url: string }[];
          body: { type: string; facts?: { title: string }[] }[];
        };
      }[];
    };
    const action = parsed.attachments[0]?.content.actions?.[0];
    expect(action?.type).toBe('Action.OpenUrl');
    expect(action?.title).toBe('View live page');
    expect(action?.url).toBe('https://cleanstart.com/blogs/my-post');
    // url must NOT also appear as a FactSet row.
    const fact = parsed.attachments[0]?.content.body.find((b) => b.type === 'FactSet');
    expect(fact?.facts?.map((f) => f.title)).not.toContain('url');
  });

  it('does NOT render an "Edit in CMS" button even when data.adminUrl is set', () => {
    const raw = buildTeamsPayload({
      event: 'document.published',
      data: { title: 'X', slug: 'x', adminUrl: 'https://cms.cleanstart.com/admin/collections/blogs/1' },
    });
    const parsed = JSON.parse(raw) as {
      attachments: { content: { actions?: { title: string }[] } }[];
    };
    const titles = parsed.attachments[0]?.content.actions?.map((a) => a.title) ?? [];
    expect(titles).not.toContain('Edit in CMS');
  });

  it('skips mentions whose triggerOn list does not include the event', () => {
    const raw = buildTeamsPayload(baseEvent, {
      mentions: [
        {
          displayName: 'OnlyLeads',
          aadObjectId: 'aad-3',
          upn: 'sales@cleanstart.com',
          triggerOn: ['lead.submitted'],
        },
      ],
    });
    const parsed = JSON.parse(raw) as {
      attachments: { content: { msteams?: unknown } }[];
    };
    expect(parsed.attachments[0]?.content.msteams).toBeUndefined();
    expect(raw).not.toContain('<at>OnlyLeads</at>');
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
