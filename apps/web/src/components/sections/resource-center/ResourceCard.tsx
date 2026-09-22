import Link from "next/link";
import type { Resource } from "@/lib/resources";
import {
  resolveResourceTypeLabel,
  resolveResourceTypeSlug,
  resourceCtaLabel,
  resourceCoverPoster,
} from "@/lib/resources-utils";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

interface ResourceCardProps {
  resource: Resource;
}

export function ResourceCard({ resource }: ResourceCardProps): React.ReactElement {
  const typeSlug = resolveResourceTypeSlug(resource);
  const typeLabel = resolveResourceTypeLabel(resource);
  const ctaLabel = resourceCtaLabel(typeSlug, resource.ctaButtonText);
  const coverPoster = resourceCoverPoster(typeSlug);

  // Scale the overlay title down for longer copy so it stays within the cover's
  // dark area. Uses cqw so it tracks the fluid card width.
  const titleLen = resource.title.length;
  const coverTitleFontSize =
    titleLen <= 28
      ? "clamp(0.75rem, 5cqw, 1rem)"
      : titleLen <= 44
        ? "clamp(0.7rem, 4.4cqw, 0.9rem)"
        : titleLen <= 64
          ? "clamp(0.65rem, 3.8cqw, 0.8rem)"
          : "clamp(0.6rem, 3.4cqw, 0.72rem)";
  const coverTitleClamp = titleLen <= 44 ? 3 : 4;

  return (
    <article
      className="relative bg-white overflow-hidden flex flex-col w-full mx-auto"
      style={{
        maxWidth: "328px",
        // Flat, not `clamp(300px, 26vw, 354px)`. The card is a fixed-width
        // grid cell whose content is absolutely positioned, so min-height IS
        // its height. Tying that to the viewport shrank the card to the 300px
        // floor below ~1154px, exactly where the narrower column makes the
        // title wrap onto more lines: the 3-line clamp then had no room and
        // the last line was cut mid-glyph against the CTA. 354px is the height
        // the card already had at desktop, so this only stops the shrinking.
        minHeight: "354px",
        borderRadius: "32px",
        boxShadow:
          "0px 81px 23px 0px rgba(0,0,0,0), 0px 52px 21px 0px rgba(0,0,0,0), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 3px 7px 0px rgba(0,0,0,0.02)",
      }}
    >
      <div
        className="absolute"
        style={{
          top: "15px",
          left: "15px",
          right: "15px",
          height: "138px",
          borderRadius: "16px",
          containerType: "inline-size",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverPoster}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none block"
          style={{ borderRadius: "16px" }}
          loading="lazy"
          decoding="async"
        />
        <span
          className="absolute font-display font-semibold text-white overflow-hidden"
          style={{
            top: "44%",
            left: "22%",
            right: "30%",
            fontSize: coverTitleFontSize,
            lineHeight: "1.18",
            letterSpacing: "-0.03em",
            display: "-webkit-box",
            WebkitLineClamp: coverTitleClamp,
            WebkitBoxOrient: "vertical",
            textShadow: "0 1px 2px rgba(0,0,0,0.25)",
            overflowWrap: "anywhere",
          }}
        >
          {resource.title}
        </span>
      </div>


      <div
        className="absolute"
        style={{ top: "133px", left: "26px", zIndex: 1 }}
      >
        <CategoryBadge label={typeLabel} />
      </div>

      <div
        className="absolute flex flex-col justify-between"
        style={{
          top: "183px",
          left: "24px",
          right: "24px",
          bottom: "24px",
        }}
      >
        <h3
          className="font-display font-medium overflow-hidden"
          style={{
            fontSize: "var(--fs-h4)",
            lineHeight: "1.3",
            color: "#111",
            letterSpacing: "-0.05em",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {resource.title}
        </h3>

        {/* Small CTA variant: the ~256px content area overflows at --fs-body
            with a 20×14 arrow, so use --fs-body-sm and a 16×11 arrow to keep
            long labels on one line. */}
        <Link
          href={`/resources/${resource.slug}`}
          className="flex items-center gap-1.5"
          aria-label={`${ctaLabel}: ${resource.title}`}
        >
          <span
            className="font-sans font-medium whitespace-nowrap"
            style={{
              fontSize: "var(--fs-body-sm)",
              lineHeight: "1.5",
              color: "#4a3bf1",
            }}
          >
            {ctaLabel}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/resource-center/card-arrow.svg"
            alt=""
            aria-hidden
            width={16}
            height={11}
            className="pointer-events-none select-none"
            loading="lazy"
            decoding="async"
          />
        </Link>
      </div>
    </article>
  );
}
