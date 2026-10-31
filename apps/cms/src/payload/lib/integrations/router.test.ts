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

const videoEvent: WebhookEvent = {
  event: 'video.needs-review',
  data: { count: 2, titles: ['A', 'B'] },
};

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

  it('treats an empty events list as ALL events (no filter)', () => {
    const routing: IntegrationRouting = { events: [] };
    expect(routingMatches(routing, publishEvent('blogs'))).toBe(true);
    expect(routingMatches(routing, leadEvent('contact'))).toBe(true);
  });

  it('still applies collection/formSlug filters when events is empty (all events)', () => {
    const routing: IntegrationRouting = { events: [], collections: ['blogs'] };
    expect(routingMatches(routing, publishEvent('blogs'))).toBe(true);
    expect(routingMatches(routing, publishEvent('pages'))).toBe(false);
    // lead events are unaffected by the collections filter.
    expect(routingMatches(routing, leadEvent('contact'))).toBe(true);
  });

  it('matches video.needs-review for an empty events list and for a row subscribed to it', () => {
    expect(routingMatches({ events: [] }, videoEvent)).toBe(true);
    expect(routingMatches({ events: ['video.needs-review'] }, videoEvent)).toBe(true);
  });

  it('does not deliver video.needs-review to rows subscribed to other events only', () => {
    expect(routingMatches({ events: ['document.published', 'lead.submitted'] }, videoEvent)).toBe(false);
  });

  it('ignores the collection and form filters for video.needs-review', () => {
    expect(
      routingMatches({ events: ['video.needs-review'], collections: ['blogs'], formSlugs: ['contact'] }, videoEvent),
    ).toBe(true);
  });

  it('does not deliver content or lead events to a row subscribed only to video.needs-review', () => {
    const routing: IntegrationRouting = { events: ['video.needs-review'] };
    expect(routingMatches(routing, publishEvent('blogs'))).toBe(false);
    expect(routingMatches(routing, leadEvent('contact'))).toBe(false);
  });
});
