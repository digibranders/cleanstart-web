import Link from "next/link";

import { CLEANSTART } from "@/lib/brand";
import type { SiteEvent } from "@/lib/cms";

const LOGO_HEIGHT = 20;

/**
 * One event as a card, in the shape of the main site's event card: an image
 * panel on top, the title, then a full-width button. The panel carries the
 * co-hosts' logos, because who hosts is what tells these events apart.
 * The whole card is one link, stretched from the button.
 */
export function EventCard({ event }: { event: SiteEvent }): React.ReactElement {
  return (
    <article className="ev-card relative flex h-full min-h-[360px] flex-col rounded-2xl border border-[#F1F5F9] bg-white p-[15px]">
      <div
        className="flex min-h-[170px] flex-wrap content-center items-center justify-center gap-x-5 gap-y-4 rounded-lg px-5 py-6"
        style={{
          background:
            "radial-gradient(90% 120% at 100% 0%, rgba(71,30,192,0.65) 0%, rgba(71,30,192,0) 70%), radial-gradient(80% 100% at 0% 100%, rgba(44,193,235,0.22) 0%, rgba(44,193,235,0) 70%), #151021",
        }}
      >
        {[CLEANSTART, ...event.partners].map((partner) =>
          partner.logoUrl ? (
            <img key={partner.name} src={partner.logoUrl} alt={partner.name} height={LOGO_HEIGHT} className="h-5 w-auto max-w-[140px]" />
          ) : (
            <span key={partner.name} className="font-display text-lg font-semibold text-white">
              {partner.name}
            </span>
          ),
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-3 pb-3 pt-6">
        {event.dateLabel ? (
          <span className="w-fit rounded-full bg-[#F1EDFC] px-3 py-1 text-[length:var(--fs-caption)] font-medium text-[#2B0F80]">
            {event.dateLabel}
          </span>
        ) : null}
        <h3 className="font-display text-[length:var(--fs-h4)] font-medium leading-[1.3] tracking-[-0.01em] text-[#0F172A]">
          {event.title}
        </h3>
        {event.venue ? (
          <p className="text-[length:var(--fs-body-sm)] font-medium text-[#475569]">{event.venue}</p>
        ) : null}
        <Link
          href={`/${event.slug}`}
          className="ev-btn mt-auto w-full after:absolute after:inset-0 after:rounded-2xl"
        >
          Register
          <span className="sr-only">for {event.title}</span>
        </Link>
      </div>
    </article>
  );
}
