import { env } from '@/env';
import { ROUTES } from '@/lib/routes';

/** APP_URL joined with an app relative path, with exactly one slash between them. */
export function absoluteUrl(path: string): string {
  return `${env.APP_URL.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export function inviteUrl(token: string): string {
  return absoluteUrl(`${ROUTES.acceptInvite}?token=${encodeURIComponent(token)}`);
}

export function confirmEmailUrl(token: string): string {
  return absoluteUrl(`${ROUTES.confirmEmail}?token=${encodeURIComponent(token)}`);
}

export function applicationStatusUrl(token: string): string {
  return absoluteUrl(`${ROUTES.applyStatus}?token=${encodeURIComponent(token)}`);
}

export function applicationReplyUrl(token: string): string {
  return absoluteUrl(`${ROUTES.applyReply}?token=${encodeURIComponent(token)}`);
}

export function resetPasswordUrl(token: string): string {
  return absoluteUrl(`${ROUTES.resetPassword}?token=${encodeURIComponent(token)}`);
}
