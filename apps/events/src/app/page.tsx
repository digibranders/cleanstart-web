import Link from "next/link";

import { EventShell } from "@/components/event/EventShell";
import { LogoBar } from "@/components/event/LogoBar";
import { EVENTS } from "@/content/events";

export default function EventsIndexPage(): React.ReactElement {
  const brand = EVENTS[0]?.partners.slice(0, 1) ?? [];
  return (
    <EventShell logos={<LogoBar partners={brand} />} title="Events">
      <ul className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-[0_24px_60px_-30px_rgba(60,30,150,0.35)] sm:p-10">
        {EVENTS.map((event) => (
          <li key={event.slug}>
            <Link
              href={`/${event.slug}`}
              className="flex min-h-12 items-center justify-between rounded-lg border-[1.5px] border-[#DDDDDD] bg-[#FBFBFB] px-4 py-3 font-medium text-[#111111] transition-colors hover:border-[#471EC0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3960f9]"
            >
              {event.title}
              <span aria-hidden>Register</span>
            </Link>
          </li>
        ))}
      </ul>
    </EventShell>
  );
}
