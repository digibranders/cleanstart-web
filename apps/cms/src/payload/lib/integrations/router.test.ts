import { describe, expect, it } from 'vitest';

import type { WebhookEvent } from '../webhooks/dispatch';
import { routingMatches, type IntegrationRouting } from './router';

const publishEvent = (collection: string): WebhookEvent => ({
  event: 'document.published',
  data: { collection, id: 'x', title: 't' },
});

const leadEvent = (formSlug: string): WebhookEvent => ({
  event: 'lead.submitted',
  data: { formSlug, email: 'a@b.com' },
});

describe('integrations/router', () => {
  it('returns false when the event is not subscribed', () => {
    const routing: IntegrationRouting = { events: ['lead.submitted'] };
    expect(routingMatches(routing, publishEvent('blogs'))).toBe(false);
  });

  it('returns true when the event is subscribed and no filters apply', () => {
    const routing: IntegrationRouting = { events: ['document.published'] };
    expect(routingMatches(routing, publishEvent('blogs'))).toBe(true);
  });

  it('filters publish events by collection list', () => {
    const routing: IntegrationRouting = {
      events: ['document.published'],
      collections: ['blogs', 'news'],
    };
    expect(routingMatches(routing, publishEvent('blogs'))).toBe(true);
    expect(routingMatches(routing, publishEvent('pages'))).toBe(false);
  });

  it('treats an empty collections array as no filter', () => {
    const routing: IntegrationRouting = {
      events: ['document.published'],
      collections: [],
    };
    expect(routingMatches(routing, publishEvent('anything'))).toBe(true);
  });

  it('filters lead events by formSlugs list', () => {
    const routing: IntegrationRouting = {
      events: ['lead.submitted'],
      formSlugs: ['contact', 'demo-request'],
    };
    expect(routingMatches(routing, leadEvent('contact'))).toBe(true);
    expect(routingMatches(routing, leadEvent('newsletter'))).toBe(false);
  });

  it('rejects publish events missing a collection field when filtered', () => {
    const routing: IntegrationRouting = {
      events: ['document.published'],
      collections: ['blogs'],
    };
    const event: WebhookEvent = { event: 'document.published', data: { title: 't' } };
    expect(routingMatches(routing, event)).toBe(false);
  });

  it('rejects an empty events list outright', () => {
    const routing: IntegrationRouting = { events: [] };
    expect(routingMatches(routing, publishEvent('blogs'))).toBe(false);
    expect(routingMatches(routing, leadEvent('contact'))).toBe(false);
  });
});
