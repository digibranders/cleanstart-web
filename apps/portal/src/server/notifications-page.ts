import { systemClock } from '@/lib/clock';
import type { NotificationsPageDto } from '@/lib/dto';
import type { UserKind } from '@/lib/domain';
import { requireKind } from '@/server/auth/viewer';
import { withViewer } from '@/server/repo/context';
import { listNotificationsPage } from '@/server/repo/notifications';

export interface NotificationsPageData {
  data: NotificationsPageDto;
  unreadOnly: boolean;
  today: string;
}

/** Shared by /partner/notifications and /admin/notifications: `?filter=unread` and `?page=N`, bad values fall back. */
export async function loadNotificationsPage(
  kind: UserKind,
  searchParams: Promise<Record<string, string | string[] | undefined>>,
): Promise<NotificationsPageData> {
  const viewer = await requireKind(kind);
  const params = await searchParams;
  const unreadOnly = params.filter === 'unread';
  const parsed = Number.parseInt(typeof params.page === 'string' ? params.page : '1', 10);
  const page = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  const data = await withViewer(viewer, (tx) => listNotificationsPage(tx, viewer, { page, unreadOnly }));
  return { data, unreadOnly, today: systemClock.today() };
}
