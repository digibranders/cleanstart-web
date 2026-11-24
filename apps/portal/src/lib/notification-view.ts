import type { IconName } from '@/components/icon-paths';
import { daysBetween, fmtShort } from './dates';
import type { NotificationKind } from './domain';

const ICON: Record<NotificationKind, IconName> = {
  registration_submitted: 'approve',
  registration_accepted: 'deals',
  registration_rejected: 'warn',
  registration_resubmitted: 'approve',
  registration_stage: 'deals',
  registration_message: 'send',
  registration_expiring: 'hg',
  registration_expired: 'hg',
  extension_requested: 'clk',
  extension_decided: 'clk',
  document_new: 'file',
  access_requested: 'team',
  application_new: 'bld',
  team_joined: 'team',
  team_removed: 'team',
  role_changed: 'team',
  material_request_update: 'file',
  chat_mention: 'send',
};

export const notificationIcon = (kind: NotificationKind): IconName => ICON[kind];

/** "Today", "3 days ago", then "30 Oct". `today` is the server date so the label is the same on every device. */
export function notificationWhen(createdAt: string, today: string): string {
  const date = createdAt.slice(0, 10);
  const days = daysBetween(date, today);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  return fmtShort(date);
}

/** Only paths inside this app are links. A stored link is our own, but a bell must never become an open redirect. */
export const isAppLink = (link: string | null): link is string => {
  if (link === null || !link.startsWith('/') || link[1] === '/' || link[1] === '\\') return false;
  return [...link].every((char) => char !== '\\' && char.charCodeAt(0) > 31);
};
