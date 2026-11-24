import { EventRegistrationForm } from "@/components/event/EventRegistrationForm";
import { EventShell } from "@/components/event/EventShell";
import { LogoBar } from "@/components/event/LogoBar";
import type { EventDefinition } from "@/content/events";

export function EventView({ event }: { event: EventDefinition }): React.ReactElement {
  return (
    <EventShell logos={<LogoBar partners={event.partners} />} title={event.title}>
      <EventRegistrationForm formSlug={event.formSlug} eventTitle={event.title} />
    </EventShell>
  );
}
