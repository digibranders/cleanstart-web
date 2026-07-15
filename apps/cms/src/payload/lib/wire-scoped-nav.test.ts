import type { CollectionConfig } from 'payload';
import { describe, expect, it } from 'vitest';

import { isHiddenForScopedNav, wireScopedNav } from './wire-scoped-nav';

const userWith = (...roles: string[]) => ({ id: 1, roles });

const hiddenFor = (collection: CollectionConfig, user: unknown): boolean => {
  const hidden = collection.admin?.hidden;
  if (typeof hidden !== 'function') return hidden === true;
  return hidden({ user } as never);
};

describe('isHiddenForScopedNav', () => {
  it('shows every collection to a general role (admin/editor/author/seo)', () => {
    for (const role of ['admin', 'editor', 'author', 'seo']) {
      expect(isHiddenForScopedNav('blogs', userWith(role))).toBe(false);
      expect(isHiddenForScopedNav('jobs', userWith(role))).toBe(false);
      expect(isHiddenForScopedNav('events', userWith(role))).toBe(false);
    }
  });

  it('leaves the default (visible) for unauthenticated / role-less requests', () => {
    expect(isHiddenForScopedNav('blogs', null)).toBe(false);
    expect(isHiddenForScopedNav('blogs', undefined)).toBe(false);
    expect(isHiddenForScopedNav('blogs', userWith())).toBe(false);
  });

  it('shows an hr-only user their careers collections and hides the rest', () => {
    const hr = userWith('hr');
    for (const slug of ['jobs', 'career-applications', 'resumes', 'departments', 'jobLocations']) {
      expect(isHiddenForScopedNav(slug, hr)).toBe(false);
    }
    for (const slug of ['blogs', 'events', 'webinars', 'leads', 'users']) {
      expect(isHiddenForScopedNav(slug, hr)).toBe(true);
    }
  });

  it('shows an events-only user their events collections and hides the rest', () => {
    const events = userWith('events');
    for (const slug of ['events', 'webinars', 'webinarTypes', 'podcastEpisodes']) {
      expect(isHiddenForScopedNav(slug, events)).toBe(false);
    }
    for (const slug of ['blogs', 'jobs', 'resumes', 'leads', 'users']) {
      expect(isHiddenForScopedNav(slug, events)).toBe(true);
    }
  });

  it('unions the domains for a user holding both departmental roles', () => {
    const both = userWith('hr', 'events');
    expect(isHiddenForScopedNav('jobs', both)).toBe(false);
    expect(isHiddenForScopedNav('webinars', both)).toBe(false);
    expect(isHiddenForScopedNav('blogs', both)).toBe(true);
  });

  it('falls back to the full nav when a departmental role is paired with a general one', () => {
    const editorHr = userWith('editor', 'hr');
    expect(isHiddenForScopedNav('blogs', editorHr)).toBe(false);
    expect(isHiddenForScopedNav('users', editorHr)).toBe(false);
  });
});

describe('wireScopedNav', () => {
  it('attaches a role-aware hidden function to a plain collection', () => {
    const output = wireScopedNav({ slug: 'jobs', fields: [] });
    expect(hiddenFor(output, userWith('hr'))).toBe(false);
    expect(hiddenFor(output, userWith('events'))).toBe(true);
    expect(hiddenFor(output, userWith('editor'))).toBe(false);
  });

  it('preserves a statically hidden collection for everyone', () => {
    const output = wireScopedNav({ slug: 'jobs', fields: [], admin: { hidden: true } });
    expect(hiddenFor(output, userWith('admin'))).toBe(true);
    expect(hiddenFor(output, userWith('hr'))).toBe(true);
  });

  it('honours an existing hidden function (OR-composed) before applying scope', () => {
    const output = wireScopedNav({
      slug: 'jobs',
      fields: [],
      admin: { hidden: ({ user }) => (user as { roles?: string[] })?.roles?.includes('author') ?? false },
    });
    // author would normally see everything, but the existing predicate hides jobs from them
    expect(hiddenFor(output, userWith('author'))).toBe(true);
    // hr still sees jobs (existing predicate is false for hr, scope allows it)
    expect(hiddenFor(output, userWith('hr'))).toBe(false);
  });
});
