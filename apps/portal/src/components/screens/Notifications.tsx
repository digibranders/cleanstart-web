"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icon";
import type { NotificationDto, NotificationsPageDto } from "@/lib/dto";
import { isAppLink, notificationIcon, notificationWhen } from "@/lib/notification-view";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/server/actions/notifications";

interface NotificationsProps {
  data: NotificationsPageDto;
  unreadOnly: boolean;
  /** This screen's path, so the filter and pager links stay on the right side of the portal. */
  basePath: string;
  /** The server's UTC date, so "Today" reads the same on every device. */
  today: string;
}

const href = (basePath: string, page: number, unreadOnly: boolean): string => {
  const params = new URLSearchParams();
  if (unreadOnly) params.set("filter", "unread");
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
};

/** The full notification list: all or unread, 25 a page, mark one or all read. Shared by the partner and staff portals. */
export function Notifications({ data, unreadOnly, basePath, today }: NotificationsProps): React.JSX.Element {
  const router = useRouter();
  const [readHere, setReadHere] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const isUnread = (n: NotificationDto): boolean => n.readAt === null && !readHere.has(n.id);

  const markOne = async (n: NotificationDto): Promise<void> => {
    if (!isUnread(n)) return;
    setError(null);
    setReadHere((prev) => new Set(prev).add(n.id));
    const result = await markNotificationReadAction({ id: n.id }).catch(() => null);
    if (result?.ok) {
      router.refresh();
      return;
    }
    setReadHere((prev) => {
      const next = new Set(prev);
      next.delete(n.id);
      return next;
    });
    setError("We could not mark that as read. Try again.");
  };

  const markAll = async (): Promise<void> => {
    setError(null);
    const result = await markAllNotificationsReadAction({}).catch(() => null);
    if (result?.ok) router.refresh();
    else setError("We could not mark them all as read. Try again.");
  };

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Notifications</h1>
          <span className="h1-sub">{data.unread ? `${data.unread} unread` : "You are all caught up."}</span>
        </div>
        {data.unread ? (
          <button type="button" className="btn btn-s" onClick={markAll}>
            Mark all read
          </button>
        ) : null}
      </div>

      <section aria-label="Notifications" className="card clip">
        <div className="toolbar">
          <div className="filters" role="group" aria-label="Show">
            <Link
              href={href(basePath, 1, false)}
              className={`btn ${unreadOnly ? "btn-g" : "btn-s"}`}
              aria-current={unreadOnly ? undefined : "true"}
            >
              All
            </Link>
            <Link
              href={href(basePath, 1, true)}
              className={`btn ${unreadOnly ? "btn-s" : "btn-g"}`}
              aria-current={unreadOnly ? "true" : undefined}
            >
              Unread
            </Link>
          </div>
        </div>
        {error ? (
          <div className="card-b">
            <span className="err" role="alert">
              {error}
            </span>
          </div>
        ) : null}
        {data.items.length === 0 ? (
          <div className="empty">{unreadOnly ? "Nothing unread." : "No notifications yet."}</div>
        ) : (
          data.items.map((n) => {
            const unread = isUnread(n);
            const body = (
              <>
                <span className="li-ic">
                  <Icon name={notificationIcon(n.kind)} />
                </span>
                <span className="li-t">
                  <span className="li-n" style={{ whiteSpace: "normal" }}>
                    {n.title}
                  </span>
                  <span className="li-s">
                    {n.body ? `${n.body}. ` : ""}
                    {notificationWhen(n.createdAt, today)}
                  </span>
                </span>
                {unread ? <span className="unread" role="img" aria-label="Unread" /> : null}
              </>
            );
            return (
              <div key={n.id} className="li" style={{ alignItems: "flex-start" }}>
                {isAppLink(n.link) ? (
                  <Link
                    href={n.link}
                    style={{ display: "flex", flex: 1, minWidth: 0, gap: 10, alignItems: "flex-start", color: "inherit", textDecoration: "none" }}
                    onClick={() => void markOne(n)}
                  >
                    {body}
                  </Link>
                ) : (
                  <div style={{ display: "flex", flex: 1, minWidth: 0, gap: 10, alignItems: "flex-start" }}>{body}</div>
                )}
                {unread ? (
                  <button type="button" className="btn btn-t" onClick={() => void markOne(n)}>
                    Mark read
                  </button>
                ) : null}
              </div>
            );
          })
        )}
        {pages > 1 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              borderTop: "1px solid #F0EFF4",
            }}
          >
            <span className="card-meta">
              Page {data.page} of {pages}
            </span>
            <span style={{ display: "flex", gap: 6 }}>
              {data.page > 1 ? (
                <Link href={href(basePath, data.page - 1, unreadOnly)} className="btn btn-s">
                  Previous
                </Link>
              ) : null}
              {data.page < pages ? (
                <Link href={href(basePath, data.page + 1, unreadOnly)} className="btn btn-s">
                  Next
                </Link>
              ) : null}
            </span>
          </div>
        ) : null}
      </section>
    </div>
  );
}
