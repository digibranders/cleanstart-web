import type { Partner } from "@/lib/brand";

function PartnerMark({ partner }: { partner: Partner }): React.ReactElement {
  if (partner.logoUrl) {
    return <img src={partner.logoUrl} alt={partner.name} height={32} className="h-7 w-auto max-w-[180px] sm:h-8" />;
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
 * event's partner list, so a two or five partner event needs no layout change.
 */
export function LogoBar({ partners }: { partners: readonly Partner[] }): React.ReactElement {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-5 sm:gap-x-6">
      {partners.map((partner, index) => (
        <li key={partner.name} className="flex items-center gap-4 sm:gap-6">
          {index > 0 ? (
            <span aria-hidden className="ev-link" style={{ animationDelay: `${0.25 + index * 0.35}s` }} />
          ) : null}
          <a
            href={partner.url}
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
