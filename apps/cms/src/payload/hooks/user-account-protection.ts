import type { CollectionAfterChangeHook, CollectionBeforeChangeHook } from 'payload';
import { ValidationError } from 'payload';

import { userId } from '../access/typed-user';

// Payload's users update lets an owner change their own email or password with nothing but a session, never revokes
// the sessions a password change should end, and leaves a disabled account's tokens and API key working until they
// expire. These two hooks close that over REST; the Studio account screen enforces the same rules in its own action.

const fail = (message: string, path: string): ValidationError => new ValidationError({ errors: [{ message, path }] });

const sameEmail = (a: unknown, b: unknown): boolean => typeof a === 'string' && typeof b === 'string' && a.trim().toLowerCase() === b.trim().toLowerCase();

const isSelf = (user: unknown, id: unknown): boolean => {
  const mine = userId(user);
  return mine !== null && String(mine) === String(id);
};

type Session = { id?: string };

export const requireCurrentPasswordForSelf: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  const { currentPassword, ...rest } = data as Record<string, unknown>;
  if (operation !== 'update' || !originalDoc || !isSelf(req.user, originalDoc.id)) return rest;

  const changesEmail = rest.email !== undefined && !sameEmail(rest.email, originalDoc.email);
  const changesPassword = typeof rest.password === 'string' && rest.password !== '';
  if (!changesEmail && !changesPassword) return rest;

  if (typeof currentPassword !== 'string' || currentPassword === '') {
    throw fail('Enter your current password to change your email or password.', 'currentPassword');
  }
  try {
    // Goes through login so a guessed password counts toward the lockout. The session it opens is revoked afterwards.
    await req.payload.login({ collection: 'users', data: { email: originalDoc.email as string, password: currentPassword } });
  } catch {
    throw fail('Current password is incorrect.', 'currentPassword');
  }
  return rest;
};

// Payload removes `password` from the data before afterChange runs, so the change is recorded here.
const REVOKE = 'revokeSessions';
const DISABLE = 'disableAccount';

export const flagCredentialChange: CollectionBeforeChangeHook = ({ data, originalDoc, operation, context }) => {
  if (operation !== 'update' || !originalDoc) return data;
  const input = data as Record<string, unknown>;
  if (input.enabled === false && originalDoc.enabled !== false) context[DISABLE] = true;
  if ((typeof input.password === 'string' && input.password !== '') || (input.email !== undefined && !sameEmail(input.email, originalDoc.email))) {
    context[REVOKE] = true;
  }
  return data;
};

export const revokeSessionsOnAccountChange: CollectionAfterChangeHook = async ({ doc, operation, context, req }) => {
  const disabled = context[DISABLE] === true;
  if (operation !== 'update' || (!disabled && context[REVOKE] !== true)) return doc;

  // The sessions field hides itself from everyone but its owner, so read the raw row. updateOne upserts, so it needs the
  // whole row back, as Payload's own session helper passes it.
  const row = (await req.payload.db.findOne({ collection: 'users', where: { id: { equals: doc.id } }, req })) as ({ sessions?: Session[] } & Record<string, unknown>) | null;
  if (!row) return doc;
  const keepSid = !disabled && isSelf(req.user, doc.id) ? (req.user as { _sid?: string })._sid : undefined;
  const sessions = (row.sessions ?? []).filter((s) => keepSid !== undefined && s.id === keepSid);

  await req.payload.db.updateOne({
    collection: 'users',
    id: doc.id,
    data: { ...row, sessions, ...(disabled ? { enableAPIKey: false } : {}), updatedAt: null },
    req,
    returning: false,
  });
  return doc;
};
