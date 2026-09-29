import { breadcrumbTrail } from "@cleanstart/schema/builders";
import { DetailHero, DetailHeroMetaSeparator } from "@/components/sections/_shared/DetailHero";
import { CalendarIcon, ClockIcon } from "@/components/sections/_shared/DetailHeroIcons";
import { WEBINAR_TYPE_LABEL, regionLabel } from "@/lib/webinars-utils";
import type { WebinarRegion, WebinarType } from "@/lib/webinars";

interface WebinarDetailHeroProps {
  title: string;
  webinarType: WebinarType;
  region: WebinarRegion;
  longDate?: string | null;
  eventStatus: string;
  isPast?: boolean;
}

/**
 * Unlike the event hero this carries the page's real `<h1>`: webinar detail
 * renders one hero at every breakpoint, so there is no second visible title to
 * compete with it.
 */
export function WebinarDetailHero({
  title,
  webinarType,
  region,
  longDate,
  eventStatus,
  isPast = false,
}: WebinarDetailHeroProps): React.ReactElement {
  // A cancelled or postponed webinar says so; otherwise a past live session is
  // labelled so nobody reads a finished date as an upcoming one.
  const statusLabel =
    eventStatus !== "scheduled" ? eventStatus : isPast ? "ended" : "";

  return (
    <DetailHero
      title={title}
      breadcrumb={breadcrumbTrail("webinar", { title }).slice(1)}
      meta={
        <>
          <div className="flex items-center gap-[8px] shrink-0 text-white">
            <ClockIcon />
            <span
              className="whitespace-nowrap font-medium leading-none tracking-[-0.05em]"
              style={{ fontSize: "var(--fs-body)" }}
            >
              {WEBINAR_TYPE_LABEL[webinarType]}
            </span>
          </div>

          {longDate && (
            <>
              <DetailHeroMetaSeparator />
              <div className="flex items-center gap-[8px] shrink-0 text-white">
                <CalendarIcon />
                <span
                  className="whitespace-nowrap font-medium leading-none tracking-[-0.05em]"
                  style={{ fontSize: "var(--fs-body)" }}
                >
                  {longDate}
                </span>
              </div>
            </>
          )}

          <DetailHeroMetaSeparator />
          <span
            className="whitespace-nowrap font-medium leading-none tracking-[-0.05em] text-white"
            style={{ fontSize: "var(--fs-body)" }}
          >
            {regionLabel(region)}
          </span>

          {statusLabel && (
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
