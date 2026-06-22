import { DetailHero, DetailHeroMetaSeparator } from "@/components/sections/_shared/DetailHero";
import { CalendarIcon, LocationIcon } from "@/components/sections/_shared/DetailHeroIcons";

interface EventDetailHeroProps {
  title: string;
  venue: string;
  longDate?: string | null;
  eventStatus: string;
  isPast?: boolean;
}

export function EventDetailHero({
  title,
  venue,
  longDate,
  eventStatus,
  isPast = false,
}: EventDetailHeroProps): React.ReactElement {
  const showStatusPill = eventStatus !== "scheduled" || isPast;
  const statusLabel =
    eventStatus !== "scheduled" ? eventStatus : isPast ? "past event" : "";
  return (
    <DetailHero
      title={title}
      // Not the page <h1>: event detail renders a single viewport-independent
      // sr-only <h1> in the page, because it also has a separate mobile-card
      // title. Both visible titles (this hero + the mobile card) are <p>.
      as="p"
      breadcrumb={[
        { label: "Events", href: "/events" },
        { label: title },
      ]}
      meta={
        <>
          <div className="flex items-center gap-[8px] shrink-0 text-white">
            <LocationIcon />
            <span className="whitespace-nowrap font-medium leading-none tracking-[-0.05em]" style={{ fontSize: "var(--fs-body)" }}>
              {venue}
            </span>
          </div>

          {longDate && <DetailHeroMetaSeparator />}

          {longDate && (
            <div className="flex items-center gap-[8px] shrink-0 text-white">
              <CalendarIcon />
              <span className="whitespace-nowrap font-medium leading-none tracking-[-0.05em]" style={{ fontSize: "var(--fs-body)" }}>
                {longDate}
              </span>
            </div>
          )}

          {showStatusPill && (
            <>
              <DetailHeroMetaSeparator />
              <span
                className="uppercase tracking-wider text-white"
                style={{
                  fontSize: "var(--fs-badge)",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.15)",
                }}
              >
                {statusLabel}
              </span>
            </>
          )}
        </>
      }
    />
  );
}
