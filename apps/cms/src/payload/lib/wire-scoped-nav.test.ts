import type { CollectionConfig, GlobalConfig } from 'payload';
import { describe, expect, it } from 'vitest';

import {
  isHiddenForScopedNav,
  isScopedOnlyUser,
  scopedCollectionSlugsForUser,
  wireScopedNav,
  wireScopedNavGlobal,
} from './wire-scoped-nav';

const userWith = (...roles: string[]) => ({ id: 1, roles });

const hiddenFor = (collection: CollectionConfig, user: unknown): boolean => {
  const hidden = collection.admin?.hidden;
  if (typeof hidden !== 'function') return hidden === true;
  return hidden({ user } as never);
};

const globalHiddenFor = (global: GlobalConfig, user: unknown): boolean => {
  const hidden = global.admin?.hidden;
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

  it('shows an hr-only user their careers + signature collections and hides the rest', () => {
    const hr = userWith('hr');
    for (const slug of [
      'jobs',
      'career-applications',
      'resumes',
      'departments',
      'jobLocations',
      'emailSignatures',
    ]) {
      expect(isHiddenForScopedNav(slug, hr)).toBe(false);
    }
    // signatureTemplates and emailAssets stay admin-only, so hr must not see
    // them even though they sit in the same Brand nav group.
    for (const slug of [
      'blogs',
      'events',
      'webinars',
      'leads',
      'users',
      'signatureTemplates',
      'emailAssets',
    ]) {
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

describe('isScopedOnlyUser', () => {
  it('is true only for users whose roles are all departmental', () => {
    expect(isScopedOnlyUser(userWith('hr'))).toBe(true);
    expect(isScopedOnlyUser(userWith('events'))).toBe(true);
    expect(isScopedOnlyUser(userWith('hr', 'events'))).toBe(true);
  });

  it('is false for general roles, mixed roles, and role-less/anonymous requests', () => {
    for (const role of ['admin', 'editor', 'author', 'seo']) {
      expect(isScopedOnlyUser(userWith(role))).toBe(false);
    }
    expect(isScopedOnlyUser(userWith('editor', 'hr'))).toBe(false);
    expect(isScopedOnlyUser(userWith())).toBe(false);
    expect(isScopedOnlyUser(null)).toBe(false);
    expect(isScopedOnlyUser(undefined)).toBe(false);
  });
});

describe('scopedCollectionSlugsForUser', () => {
  it('returns null for users with full access (general role, mixed, anon)', () => {
    expect(scopedCollectionSlugsForUser(userWith('admin'))).toBeNull();
    expect(scopedCollectionSlugsForUser(userWith('editor', 'hr'))).toBeNull();
    expect(scopedCollectionSlugsForUser(userWith())).toBeNull();
    expect(scopedCollectionSlugsForUser(null)).toBeNull();
  });

  it('returns the domain slugs for a single departmental role', () => {
    expect(scopedCollectionSlugsForUser(userWith('hr'))).toEqual([
      'jobs',
      'career-applications',
      'resumes',
      'departments',
      'jobLocations',
      'emailSignatures',
    ]);
    expect(scopedCollectionSlugsForUser(userWith('events'))).toEqual([
      'events',
      'webinars',
      'webinarTypes',
      'podcastEpisodes',
    ]);
  });

  it('unions and de-duplicates domains for a user holding both roles', () => {
    const slugs = scopedCollectionSlugsForUser(userWith('hr', 'events'));
    expect(slugs).toContain('jobs');
    expect(slugs).toContain('webinars');
    expect(new Set(slugs).size).toBe(slugs?.length);
  });
});

describe('wireScopedNavGlobal', () => {
  it('hides every global from a departmental-only user', () => {
    const output = wireScopedNavGlobal({ slug: 'siteSettings', fields: [] });
    expect(globalHiddenFor(output, userWith('hr'))).toBe(true);
    expect(globalHiddenFor(output, userWith('events'))).toBe(true);
  });

  it('leaves globals visible to general roles and anonymous requests', () => {
    const output = wireScopedNavGlobal({ slug: 'seoDefaults', fields: [] });
    expect(globalHiddenFor(output, userWith('admin'))).toBe(false);
    expect(globalHiddenFor(output, userWith('editor', 'hr'))).toBe(false);
    expect(globalHiddenFor(output, null)).toBe(false);
  });

  it('preserves a statically hidden global for everyone', () => {
    const output = wireScopedNavGlobal({ slug: 'legal', fields: [], admin: { hidden: true } });
    expect(globalHiddenFor(output, userWith('admin'))).toBe(true);
    expect(globalHiddenFor(output, userWith('events'))).toBe(true);
  });

  it('honours an existing hidden function (OR-composed) before applying scope', () => {
    const output = wireScopedNavGlobal({
      slug: 'impactStats',
      fields: [],
      admin: {
        hidden: ({ user }) => (user as { roles?: string[] })?.roles?.includes('author') ?? false,
      },
    });
    expect(globalHiddenFor(output, userWith('author'))).toBe(true);
    expect(globalHiddenFor(output, userWith('admin'))).toBe(false);
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
