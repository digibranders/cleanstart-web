import { EventRegistrationForm } from "@/components/event/EventRegistrationForm";
import { EventShell } from "@/components/event/EventShell";
import { LogoBar } from "@/components/event/LogoBar";
import type { SiteEvent } from "@/lib/cms";
import { CLEANSTART } from "@/lib/brand";

export function EventView({ event }: { event: SiteEvent }): React.ReactElement {
  return (
    <EventShell
      logos={<LogoBar partners={[CLEANSTART, ...event.partners]} />}
      title={event.title}
      dateLabel={event.dateLabel}
      venue={event.venue}
    >
      {event.registrationOpen ? (
        <EventRegistrationForm event={event} />
      ) : (
        <div className="ev-pass">
          <div className="rounded-2xl bg-white px-7 py-10 text-center sm:px-10">
            <h2 className="font-display text-[length:var(--fs-h4)] font-semibold text-[#111111]">Registration is closed</h2>
            <p className="mx-auto mt-3 max-w-[40ch] text-[length:var(--fs-body)] text-[#444444]">
              This event is no longer taking registrations.
            </p>
          </div>
        </div>
      )}
    </EventShell>
  );
}
