"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { NotificationDto, NotificationsDto } from "@/lib/dto";
import { isAppLink, notificationIcon, notificationWhen } from "@/lib/notification-view";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/server/actions/notifications";
import { Icon } from "../icon";

const BELL =
  "M220.07,176.94C214.41,167.2,206,139.73,206,104a78,78,0,1,0-156,0c0,35.74-8.42,63.2-14.08,72.94A14,14,0,0,0,48,198H90.48a38,38,0,0,0,75,0H208a14,14,0,0,0,12.06-21.06ZM128,218a26,26,0,0,1-25.29-20h50.58A26,26,0,0,1,128,218Zm81.71-33a1.9,1.9,0,0,1-1.7,1H48a1.9,1.9,0,0,1-1.7-1,2,2,0,0,1,0-2C53.87,170,62,139.69,62,104a66,66,0,1,1,132,0c0,35.68,8.14,65.95,15.71,79A2,2,0,0,1,209.71,185Z";

function NoteBody({ n, today, unread }: { n: NotificationDto; today: string; unread: boolean }): React.JSX.Element {
  return (
    <>
      <span className="li-ic">
        <Icon name={notificationIcon(n.kind)} />
      </span>
      <span className="li-t">
        <span className="li-n" style={{ whiteSpace: "normal" }}>
          {n.title}
        </span>
        <span className="li-s">{notificationWhen(n.createdAt, today)}</span>
      </span>
      {unread ? <span className="unread" role="img" aria-label="Unread" /> : null}
    </>
  );
}

interface NotificationsPopoverProps {
  notifications: NotificationsDto;
  /** The server's UTC date, so "Today" reads the same on every device. */
  today: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

/** The bell in the top bar and its popover. Reads the viewer's own notifications; the layout supplies and refreshes them. */
export function NotificationsPopover({ notifications, today, open, onToggle, onClose }: NotificationsPopoverProps): React.JSX.Element {
  const router = useRouter();
  const [readHere, setReadHere] = useState<ReadonlySet<string>>(new Set());
  const [allRead, setAllRead] = useState(false);

  // a fresh list from the server replaces what was marked read locally
  // biome-ignore lint/correctness/useExhaustiveDependencies: the list identity is the trigger
  useEffect(() => {
    setReadHere(new Set());
    setAllRead(false);
  }, [notifications]);

  // the layout does not re-run on client navigation, so ask it for fresh data whenever the popover opens
  useEffect(() => {
    if (open) router.refresh();
  }, [open, router]);

  const isUnread = (n: NotificationDto): boolean => n.readAt === null && !allRead && !readHere.has(n.id);
  const locallyRead = notifications.items.filter((n) => n.readAt === null && readHere.has(n.id)).length;
  const unreadCount = allRead ? 0 : Math.max(0, notifications.unread - locallyRead);

  const markAll = async (): Promise<void> => {
    setAllRead(true);
    const result = await markAllNotificationsReadAction({});
    if (result.ok) router.refresh();
  };

  const markOne = (n: NotificationDto): void => {
    if (isUnread(n)) {
      setReadHere((prev) => new Set(prev).add(n.id));
      void markNotificationReadAction({ id: n.id });
    }
    onClose();
  };

  return (
    <div className="pop-wrap">
      <button
        type="button"
        className="ibtn"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={onToggle}
      >
        <Icon d={BELL} />
        {unreadCount ? <span className="ping" aria-hidden="true" /> : null}
      </button>
      {open ? (
        <>
          <div className="dd-scrim" onClick={onClose} aria-hidden="true" />
          <div className="pop" role="dialog" aria-label="Notifications">
            <div className="pop-h">
              <h2 className="pop-t">Notifications</h2>
              {unreadCount ? (
                <button type="button" className="btn btn-t" onClick={markAll}>
                  Mark all read
                </button>
              ) : null}
            </div>
            {notifications.items.length === 0 ? <div className="empty">No notifications yet.</div> : null}
            {notifications.items.map((n) =>
              isAppLink(n.link) ? (
                <Link key={n.id} href={n.link} className="li" style={{ alignItems: "flex-start" }} onClick={() => markOne(n)}>
                  <NoteBody n={n} today={today} unread={isUnread(n)} />
                </Link>
              ) : (
                <div key={n.id} className="li" style={{ alignItems: "flex-start" }}>
                  <NoteBody n={n} today={today} unread={isUnread(n)} />
                </div>
              ),
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
