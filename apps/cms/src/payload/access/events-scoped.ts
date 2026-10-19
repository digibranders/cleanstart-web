import type { Access, Where } from 'payload';

import { hasAnyRole, hasRole } from './typed-user';

/** Media folders the `events` role may edit; mirrors the `folderHint` of events and webinars. */
export const EVENTS_MEDIA_FOLDERS = ['web/event', 'web/webinar'] as const;

/**
 * Media update: admin/editor anywhere; `events` only on files filed under its
 * own folders, so it can fix alt text, crop or replace an event image in place
 * without touching blog, news or page imagery. Delete stays admin/editor: a
 * removed file 404s on every page that still references it.
 */
export const mediaUpdateAccess: Access = ({ req: { user } }) => {
  if (hasAnyRole(user, ['admin', 'editor'])) return true;
  if (hasRole(user, 'events')) return { folder: { in: [...EVENTS_MEDIA_FOLDERS] } } satisfies Where;
  return false;
};

const relationId = (value: unknown): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id;
    if (typeof id === 'number' || typeof id === 'string') return id;
  }
  return null;
};

/**
 * Forms update: admin/editor anywhere; `events` only on forms already attached
 * as the `registrationForm` of an event or webinar (drafts included). Every
 * other form (demo, contact, newsletter, gates) is lead capture the events team
 * must not be able to reshape.
 */
export const formsUpdateAccess: Access = async ({ req }) => {
  const { user, payload } = req;
  if (hasAnyRole(user, ['admin', 'editor'])) return true;
  if (!hasRole(user, 'events')) return false;

  const query = {
    select: { registrationForm: true },
    depth: 0,
    pagination: false,
    draft: true,
    overrideAccess: true,
  } as const;
  const [events, webinars] = await Promise.all([
    payload.find({ collection: 'events', ...query }),
    payload.find({ collection: 'webinars', ...query }),
  ]);

  const ids = new Set<number | string>();
  for (const doc of [...events.docs, ...webinars.docs]) {
    const id = relationId(doc.registrationForm);
    if (id !== null) ids.add(id);
  }
  if (ids.size === 0) return false;
  return { id: { in: [...ids] } } satisfies Where;
};
