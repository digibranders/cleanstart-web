import Link from "next/link";
import type { ResourceDetail } from "@/lib/resources";
import { resourceTypeLabel, mediaUrl } from "@/lib/resources";
import type { Form } from "@/lib/forms";
import { DETAIL_HERO_TITLE_STYLE } from "@/components/sections/_shared/DetailHero";
import { ResourceDownloadButton } from "@/components/resource/ResourceDownloadButton";
import { HeroReveal } from "@/components/ui/Reveal";

interface ResourceDetailHeroProps {
  resource: ResourceDetail;
  gateForm?: Form | null;
}

export function ResourceDetailHero({
  resource,
  gateForm,
}: ResourceDetailHeroProps): React.ReactElement {
  const typeLabel = resourceTypeLabel(resource.type);
  const assetHref = resource.asset?.url ? (mediaUrl(resource.asset.url) ?? "#") : "#";
  const gated = resource.gated === true;

  return (
    <section
      className="relative overflow-hidden min-h-[440px] lg:min-h-[519px]"
      aria-labelledby="rd-hero-title"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/resource-center/hero-bg-grid.svg"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        loading="eager"
        decoding="async"
      />

      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          left: "1647px",
          top: "-1px",
          width: "418.955px",
          height: "418.793px",
          mixBlendMode: "color-dodge",
        }}
      >
        <div
          style={{
            transform: "rotate(-46.54deg)",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/resource-center/hero-cube.webp"
            alt=""
            style={{ width: "294px", height: "298px", opacity: 0.4 }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          left: "-130px",
          top: "286px",
          width: "332px",
          height: "313px",
          mixBlendMode: "hard-light",
          opacity: 0.3,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/resource-center/hero-glow-left.webp"
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div
        className="relative mx-auto"
        style={{ maxWidth: "1276px", paddingLeft: "24px", paddingRight: "24px" }}
      >
        {/* On mobile (<sm) the intermediate "Resources" and "<Type>" crumbs
            collapse to save vertical space and avoid an orphan-chevron wrap on
            long titles. The full chain stays in the DOM for screen readers via
            `hidden sm:flex`. */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-nowrap items-center overflow-x-auto pt-[120px] lg:pt-[138px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible"
        >
          <Link
            href="/"
            aria-label="Home"
            className="flex items-center justify-center shrink-0"
            style={{ padding: "0 8px", height: "32px", borderRadius: "1000px" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/resource-center/breadcrumb-home.svg"
              alt=""
              aria-hidden
              width={16}
              height={16}
              className="pointer-events-none select-none"
              loading="lazy"
              decoding="async"
            />
          </Link>
          <span className="hidden sm:flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/resource-center/breadcrumb-arrow.svg"
              alt=""
              aria-hidden
              width={20}
              height={20}
              className="pointer-events-none select-none shrink-0"
              loading="lazy"
              decoding="async"
            />
            <Link
              href="/resource-center"
              className="flex items-center justify-center text-xs font-normal leading-[1.4] shrink-0"
              style={{
                padding: "0 8px",
                height: "32px",
                color: "#98acc3",
                textDecoration: "none",
                borderRadius: "1000px",
              }}
            >
              Resources
            </Link>
          </span>
          <span className="hidden sm:flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/resource-center/breadcrumb-arrow.svg"
              alt=""
              aria-hidden
              width={20}
              height={20}
              className="pointer-events-none select-none shrink-0"
              loading="lazy"
              decoding="async"
            />
            <Link
              href={`/resource-center?type=${encodeURIComponent(resource.type ?? "")}`}
              className="flex items-center justify-center text-xs font-normal leading-[1.4] shrink-0"
              style={{
                padding: "0 8px",
                height: "32px",
                color: "#98acc3",
                textDecoration: "none",
                borderRadius: "1000px",
              }}
            >
              {typeLabel}
            </Link>
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/resource-center/breadcrumb-arrow.svg"
            alt=""
            aria-hidden
            width={20}
            height={20}
            className="pointer-events-none select-none shrink-0"
            loading="lazy"
            decoding="async"
          />
          <span
            className="text-xs font-normal truncate min-w-0 max-w-[220px] sm:max-w-[320px]"
            style={{
              padding: "0 8px",
              height: "32px",
              lineHeight: "32px",
              color: "#bfccda",
            }}
            aria-current="page"
          >
            {resource.title}
          </span>
        </nav>

        <div
          className="flex flex-col items-center"
          style={{ marginTop: "16px" }}
        >
          <HeroReveal y={50} duration={1.0}>
            <h1
              id="rd-hero-title"
              className="font-display font-semibold text-center text-white"
              style={{ ...DETAIL_HERO_TITLE_STYLE, maxWidth: "829px" }}
            >
              {resource.title}
            </h1>
          </HeroReveal>
        </div>

        <div
          className="flex justify-center mt-6 lg:mt-[30px] pb-12 lg:pb-20"
        >
          <ResourceDownloadButton
            resourceId={resource.id}
            resourceTitle={resource.title}
            resourceSlug={resource.slug}
            gated={gated}
            assetHref={assetHref}
            gateForm={gateForm ?? null}
            className="cs-btn-blue gap-3 font-bold h-11 lg:h-[64px]"
            style={{
              width: "840px",
              maxWidth: "100%",
              fontSize: "var(--fs-lead)",
              letterSpacing: "-0.05em",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/resource-center/detail-download-icon.svg"
              alt=""
              aria-hidden
              className="pointer-events-none select-none w-6 h-6 lg:w-10 lg:h-10"
              loading="eager"
              decoding="async"
            />
            Download
          </ResourceDownloadButton>
        </div>
      </div>
    </section>
  );
}
