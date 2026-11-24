import type { EventPartner } from "@/content/events";

function PartnerMark({ partner }: { partner: EventPartner }): React.ReactElement {
  if (partner.logo) {
    return (
      <img
        src={partner.logo}
        alt={partner.name}
        height={32}
        width={partner.logoWidth ?? 120}
        className="h-7 w-auto sm:h-8"
      />
    );
  }
  return (
    <span className="font-display text-[22px] font-semibold tracking-tight text-white sm:text-[26px]">
      {partner.name}
    </span>
  );
}

/**
 * Co-branding strip. Every logo links to its owner and sits at one optical
 * height, joined by a line that draws itself once on load. It reads from the
 * event's `partners` list, so a two or five partner event needs no layout change.
 */
export function LogoBar({ partners }: { partners: readonly EventPartner[] }): React.ReactElement {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-5 sm:gap-x-6">
      {partners.map((partner, index) => (
        <li key={partner.name} className="flex items-center gap-4 sm:gap-6">
          {index > 0 ? (
            <span
              aria-hidden
              className="ev-link"
              style={{ animationDelay: `${0.25 + index * 0.35}s` }}
            />
          ) : null}
          <a
            href={partner.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-cs-cyan"
            aria-label={`${partner.name} (opens in a new tab)`}
          >
            <PartnerMark partner={partner} />
          </a>
        </li>
      ))}
    </ul>
  );
}
