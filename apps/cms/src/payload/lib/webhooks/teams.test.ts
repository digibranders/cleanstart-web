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

  it('does NOT repeat the title as a FactSet row (it is already the card heading)', () => {
    const raw = buildTeamsPayload(baseEvent);
    const parsed = JSON.parse(raw) as {
      attachments: { content: { body: { type: string; text?: string; facts?: { title: string }[] }[] } }[];
    };
    const body = parsed.attachments[0]?.content.body ?? [];
    // Title is the heading (first block) ...
    expect(body[0]?.text).toBe('My Post');
    // ... but must NOT also appear as a "Title" fact row.
    const facts = body.find((b) => b.type === 'FactSet')?.facts ?? [];
    expect(facts.map((f) => f.title)).not.toContain('Title');
  });

  it('orders facts predictably (Collection, Slug, then dates)', () => {
    const raw = buildTeamsPayload({
      event: 'document.published',
      // intentionally out of order in the payload
      data: { updatedAt: '2026-05-30T13:16:00Z', title: 'X', slug: 'x', collection: 'blogs', publishedAt: '2026-02-25T05:30:00Z' },
    });
    const parsed = JSON.parse(raw) as {
      attachments: { content: { body: { type: string; facts?: { title: string }[] }[] } }[];
    };
    const titles = (parsed.attachments[0]?.content.body.find((b) => b.type === 'FactSet')?.facts ?? []).map((f) => f.title);
    expect(titles).toEqual(['Collection', 'Slug', 'Published', 'Updated']);
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

describe('buildTeamsPayload for video.needs-review', () => {
  const card = (data: Record<string, unknown>) =>
    (
      JSON.parse(buildTeamsPayload({ event: 'video.needs-review', data })) as {
        attachments: {
          content: {
            body: { type: string; text?: string; facts?: unknown[] }[];
            actions?: { type: string; title: string; url: string }[];
          };
        }[];
      }
    ).attachments[0]?.content;

  const adminUrl = 'https://cms.cleanstart.com/admin/collections/videos?where[syncState][equals]=needs-review';

  it('headlines the count, with the event eyebrow below', () => {
    const body = card({ count: 3, titles: ['A', 'B', 'C'], adminUrl })?.body ?? [];
    expect(body[0]?.text).toBe('3 new videos need review');
    expect(body[1]?.text).toBe('CleanStart · video.needs-review');
  });

  it('uses the singular for one video', () => {
    expect(card({ count: 1, titles: ['A'] })?.body[0]?.text).toBe('1 new video needs review');
  });

  it('lists each title as a bullet and says how many more were not listed', () => {
    const body = card({ count: 8, titles: ['A', 'B', 'C', 'D', 'E'], adminUrl })?.body ?? [];
    expect(body.slice(2).map((b) => b.text)).toEqual(['• A', '• B', '• C', '• D', '• E', 'and 3 more']);
  });

  it('adds no "and N more" line when every title is listed', () => {
    const body = card({ count: 2, titles: ['A', 'B'] })?.body ?? [];
    expect(body.map((b) => b.text)).not.toContain('and 0 more');
    expect(body).toHaveLength(4);
  });

  it('renders no FactSet (count and titles are already on the card)', () => {
    expect(card({ count: 2, titles: ['A', 'B'], adminUrl })?.body.some((b) => b.type === 'FactSet')).toBe(false);
  });

  it('opens the Needs review list from a button', () => {
    expect(card({ count: 1, titles: ['A'], adminUrl })?.actions).toEqual([
      { type: 'Action.OpenUrl', title: 'Review in CMS', url: adminUrl },
    ]);
  });

  it('has no button when the CMS base URL is unknown, and ignores a non-http adminUrl', () => {
    expect(card({ count: 1, titles: ['A'] })?.actions).toBeUndefined();
    expect(card({ count: 1, titles: ['A'], adminUrl: 'javascript:alert(1)' })?.actions).toBeUndefined();
  });

  it('cuts a very long title and tolerates malformed data', () => {
    const long = 'x'.repeat(500);
    const body = card({ count: 1, titles: [long] })?.body ?? [];
    expect((body[2]?.text ?? '').length).toBeLessThanOrEqual(122);
    expect(card({ count: 'many', titles: 'nope' })?.body[0]?.text).toBe('0 new videos need review');
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
