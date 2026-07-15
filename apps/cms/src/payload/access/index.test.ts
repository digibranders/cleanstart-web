import type { Access, FieldAccess } from 'payload';
import { describe, expect, it } from 'vitest';

import {
  isAdmin,
  isAdminEditorOrEvents,
  isAdminEditorOrHr,
  isAdminEditorOrSeo,
  isAdminFieldLevel,
  isAdminOrEditor,
  isAdminOrSeo,
  isAdminOrSeoFieldLevel,
  isAdminOrSelf,
  isAuthenticated,
  publishedOrAuthenticated,
} from './index';

const callAccess = (fn: Access, user: unknown): ReturnType<Access> =>
  (fn as (args: { req: { user: unknown } }) => ReturnType<Access>)({ req: { user } });

const callFieldAccess = (fn: FieldAccess, user: unknown): boolean =>
  (fn as (args: { req: { user: unknown } }) => boolean)({ req: { user } });

const admin = { id: 1, roles: ['admin'] };
const editor = { id: 2, roles: ['editor'] };
const author = { id: 3, roles: ['author'] };
const seo = { id: 4, roles: ['seo'] };
const hr = { id: 5, roles: ['hr'] };
const events = { id: 6, roles: ['events'] };
describe('isAuthenticated', () => {
  it('is true for any logged-in user, false otherwise', () => {
    expect(callAccess(isAuthenticated, author)).toBe(true);
    expect(callAccess(isAuthenticated, null)).toBe(false);
    expect(callAccess(isAuthenticated, undefined)).toBe(false);
  });
});

describe('isAdmin', () => {
  it('is true only for admins', () => {
    expect(callAccess(isAdmin, admin)).toBe(true);
    expect(callAccess(isAdmin, editor)).toBe(false);
    expect(callAccess(isAdmin, null)).toBe(false);
  });
});

describe('isAdminFieldLevel', () => {
  it('mirrors isAdmin at the field level', () => {
    expect(callFieldAccess(isAdminFieldLevel, admin)).toBe(true);
    expect(callFieldAccess(isAdminFieldLevel, editor)).toBe(false);
    expect(callFieldAccess(isAdminFieldLevel, null)).toBe(false);
  });
});

describe('isAdminOrEditor', () => {
  it('is true for admins and editors, false for authors and anonymous', () => {
    expect(callAccess(isAdminOrEditor, admin)).toBe(true);
    expect(callAccess(isAdminOrEditor, editor)).toBe(true);
    expect(callAccess(isAdminOrEditor, author)).toBe(false);
    expect(callAccess(isAdminOrEditor, null)).toBe(false);
  });
});

describe('seo-role schema access', () => {
  it('isAdminOrSeo: admin + seo only', () => {
    expect(callAccess(isAdminOrSeo, admin)).toBe(true);
    expect(callAccess(isAdminOrSeo, seo)).toBe(true);
    expect(callAccess(isAdminOrSeo, editor)).toBe(false);
    expect(callAccess(isAdminOrSeo, author)).toBe(false);
    expect(callAccess(isAdminOrSeo, null)).toBe(false);
  });

  it('isAdminOrSeoFieldLevel: admin + seo only (raw override write)', () => {
    expect(callFieldAccess(isAdminOrSeoFieldLevel, admin)).toBe(true);
    expect(callFieldAccess(isAdminOrSeoFieldLevel, seo)).toBe(true);
    expect(callFieldAccess(isAdminOrSeoFieldLevel, editor)).toBe(false);
  });

  it('isAdminEditorOrSeo: admin + editor + seo (pageRegistry writers)', () => {
    expect(callAccess(isAdminEditorOrSeo, admin)).toBe(true);
    expect(callAccess(isAdminEditorOrSeo, editor)).toBe(true);
    expect(callAccess(isAdminEditorOrSeo, seo)).toBe(true);
    expect(callAccess(isAdminEditorOrSeo, author)).toBe(false);
    expect(callAccess(isAdminEditorOrSeo, null)).toBe(false);
  });
});

describe('departmental role write access', () => {
  it('isAdminEditorOrHr: admin + editor + hr, not events/author/anon', () => {
    expect(callAccess(isAdminEditorOrHr, admin)).toBe(true);
    expect(callAccess(isAdminEditorOrHr, editor)).toBe(true);
    expect(callAccess(isAdminEditorOrHr, hr)).toBe(true);
    expect(callAccess(isAdminEditorOrHr, events)).toBe(false);
    expect(callAccess(isAdminEditorOrHr, author)).toBe(false);
    expect(callAccess(isAdminEditorOrHr, null)).toBe(false);
  });

  it('isAdminEditorOrEvents: admin + editor + events, not hr/author/anon', () => {
    expect(callAccess(isAdminEditorOrEvents, admin)).toBe(true);
    expect(callAccess(isAdminEditorOrEvents, editor)).toBe(true);
    expect(callAccess(isAdminEditorOrEvents, events)).toBe(true);
    expect(callAccess(isAdminEditorOrEvents, hr)).toBe(false);
    expect(callAccess(isAdminEditorOrEvents, author)).toBe(false);
    expect(callAccess(isAdminEditorOrEvents, null)).toBe(false);
  });
});

describe('isAdminOrSelf', () => {
  it('grants full access (true) to admins', () => {
    expect(callAccess(isAdminOrSelf, admin)).toBe(true);
  });

  it('scopes non-admins to their own record via a query constraint', () => {
    expect(callAccess(isAdminOrSelf, editor)).toEqual({ id: { equals: 2 } });
    expect(callAccess(isAdminOrSelf, author)).toEqual({ id: { equals: 3 } });
  });

  it('denies unauthenticated requests', () => {
    expect(callAccess(isAdminOrSelf, null)).toBe(false);
    expect(callAccess(isAdminOrSelf, undefined)).toBe(false);
  });

  it('denies a non-admin whose id cannot be resolved (no silent widening)', () => {
    expect(callAccess(isAdminOrSelf, { roles: ['editor'] })).toBe(false);
    expect(callAccess(isAdminOrSelf, { id: 'not-a-number', roles: ['editor'] })).toBe(false);
  });
});

describe('publishedOrAuthenticated', () => {
  it('returns full access (true) for any authenticated user', () => {
    expect(callAccess(publishedOrAuthenticated, admin)).toBe(true);
    expect(callAccess(publishedOrAuthenticated, editor)).toBe(true);
    expect(callAccess(publishedOrAuthenticated, author)).toBe(true);
  });

  it('grants the role-less preview-bot API-key user full read (drafts included)', () => {
    // The preview-bot user holds no roles — write access is denied elsewhere
    // (isAdminOrEditor), but it must still read drafts for editor preview.
    expect(callAccess(publishedOrAuthenticated, { id: 9, roles: [] })).toBe(true);
  });

  it('constrains anonymous requests to published docs only', () => {
    expect(callAccess(publishedOrAuthenticated, null)).toEqual({
      _status: { equals: 'published' },
    });
    expect(callAccess(publishedOrAuthenticated, undefined)).toEqual({
      _status: { equals: 'published' },
    });
  });
});
