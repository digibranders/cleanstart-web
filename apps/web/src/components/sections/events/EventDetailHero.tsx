import { DetailHero, DetailHeroMetaSeparator } from "@/components/sections/_shared/DetailHero";

interface EventDetailHeroProps {
  title: string;
  venue: string;
  longDate?: string | null;
  eventStatus: string;
}

export function EventDetailHero({
  title,
  venue,
  longDate,
  eventStatus,
}: EventDetailHeroProps): React.ReactElement {
  return (
    <DetailHero
      title={title}
      breadcrumb={[
        { label: "Events", href: "/events" },
        { label: title },
      ]}
      meta={
        <>
          {longDate && (
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="font-medium leading-[1.3] text-white whitespace-nowrap"
                style={{ fontSize: "20px" }}
              >
                📅
              </span>
              <span
                className="font-medium leading-[1.3] text-white whitespace-nowrap"
                style={{ fontSize: "20px", letterSpacing: "-0.01em" }}
              >
                {longDate}
              </span>
            </div>
          )}

          {longDate && <DetailHeroMetaSeparator />}

          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="font-medium leading-[1.3] text-white whitespace-nowrap"
              style={{ fontSize: "20px" }}
            >
              📍
            </span>
            <span
              className="font-medium leading-[1.3] text-white whitespace-nowrap"
              style={{ fontSize: "20px", letterSpacing: "-0.01em" }}
            >
              {venue}
            </span>
          </div>

          {eventStatus !== "scheduled" && (
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
                {eventStatus}
              </span>
            </>
          )}
        </>
      }
    />
  );
}
