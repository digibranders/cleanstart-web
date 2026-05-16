import Link from "next/link";
import {
  type Resource,
  resourceTypeLabel,
  resourceCtaLabel,
  resourceCoverPoster,
} from "@/lib/resources";

interface ResourceCardProps {
  resource: Resource;
}

export function ResourceCard({ resource }: ResourceCardProps): React.ReactElement {
  const typeLabel = resourceTypeLabel(resource.type);
  const ctaLabel = resourceCtaLabel(resource.type, resource.ctaButtonText);
  const coverPoster = resourceCoverPoster(resource.type);

  return (
    <article
      className="relative bg-white overflow-hidden flex flex-col"
      style={{
        width: "295px",
        height: "354px",
        borderRadius: "32px",
        boxShadow:
          "0px 81px 23px 0px rgba(0,0,0,0), 0px 52px 21px 0px rgba(0,0,0,0), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 3px 7px 0px rgba(0,0,0,0.02)",
      }}
    >
      {/* Cover — booklet poster mapped by type, with the resource title rendered over the dark inner area. */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: "15px",
          left: "15px",
          width: "265px",
          height: "138px",
          borderRadius: "16px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverPoster}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          loading="lazy"
          decoding="async"
        />
        <span
          className="absolute font-display font-medium text-white overflow-hidden"
          style={{
            top: "38px",
            left: "56px",
            right: "76px",
            fontSize: "10px",
            lineHeight: "1.25",
            letterSpacing: "-0.02em",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {resource.title}
        </span>
      </div>


      {/* Type badge — overlaps image bottom */}
      <div
        className="absolute flex items-center justify-center overflow-hidden"
        style={{
          top: "133px",
          left: "26px",
          padding: "6px 12px",
          borderRadius: "8px",
          boxShadow: "0px 3px 0px 0px #4a3bf1",
          zIndex: 1,
        }}
      >
        {/* Badge background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/resource-center/card-badge-bg.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-[8px]"
        />
        <span
          className="relative text-base font-medium leading-[1.3] whitespace-nowrap"
          style={{ color: "#4a3bf1" }}
        >
          {typeLabel}
        </span>
      </div>

      {/* Content area */}
      <div
        className="absolute flex flex-col justify-between"
        style={{
          top: "183px",
          left: "24px",
          right: "24px",
          bottom: "24px",
        }}
      >
        {/* Title */}
        <h3
          className="font-display font-medium overflow-hidden"
          style={{
            fontSize: "clamp(0.875rem, 1.25vw, 1.5rem)",
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

        {/* CTA link */}
        <Link
          href={`/resource/${resource.slug}`}
          className="flex items-center gap-2"
          aria-label={`${ctaLabel} — ${resource.title}`}
        >
          <span
            className="font-sans font-medium whitespace-nowrap"
            style={{
              fontSize: "clamp(0.875rem, 1.04vw, 1.25rem)",
              lineHeight: "1.5",
              color: "#4a3bf1",
            }}
          >
            {ctaLabel}
          </span>
          {/* Rotated arrow icon */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/resource-center/card-arrow.svg"
            alt=""
            aria-hidden
            width={24}
            height={24}
            className="pointer-events-none select-none"
            style={{ transform: "rotate(90deg)" }}
            loading="lazy"
            decoding="async"
          />
        </Link>
      </div>
    </article>
  );
}
