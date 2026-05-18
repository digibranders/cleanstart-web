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
      breadcrumb={[
        { label: "Events", href: "/events" },
        { label: title },
      ]}
      meta={
        <>
          <div className="flex items-center gap-[8px] shrink-0 text-white">
            <LocationIcon />
            <span className="whitespace-nowrap text-[clamp(0.875rem,1.4vw,1.25rem)] font-medium leading-none tracking-[-0.05em]">
              {venue}
            </span>
          </div>

          {longDate && <DetailHeroMetaSeparator />}

          {longDate && (
            <div className="flex items-center gap-[8px] shrink-0 text-white">
              <CalendarIcon />
              <span className="whitespace-nowrap text-[clamp(0.875rem,1.4vw,1.25rem)] font-medium leading-none tracking-[-0.05em]">
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
                  fontSize: "0.75rem",
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
