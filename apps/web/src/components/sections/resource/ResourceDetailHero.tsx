import Link from "next/link";
import type { ResourceDetail } from "@/lib/resources";
import { resourceTypeLabel, mediaUrl } from "@/lib/resources";

interface ResourceDetailHeroProps {
  resource: ResourceDetail;
}

export function ResourceDetailHero({
  resource,
}: ResourceDetailHeroProps): React.ReactElement {
  const typeLabel = resourceTypeLabel(resource.type);
  const assetHref = resource.asset?.url ? (mediaUrl(resource.asset.url) ?? "#") : "#";

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 25.7%, #10123e 37.8%, #131e8f 66.9%, #471ec0 79.7%, #471fc3 92.2%, rgba(70,30,191,0.85) 97.9%, rgba(66,30,188,0.4) 107.7%, rgba(66,30,188,0) 113.5%)",
        minHeight: "519px",
      }}
      aria-labelledby="rd-hero-title"
    >
      {/* Background dot grid */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/resource-center/hero-bg-grid.svg"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        loading="eager"
        decoding="async"
      />

      {/* 3D Cube — color-dodge, top-right */}
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
            src="/images/resource-center/hero-cube.png"
            alt=""
            style={{ width: "294px", height: "298px", opacity: 0.4 }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* Left glow — hard-light blend */}
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
          src="/images/resource-center/hero-glow-left.png"
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
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center"
          style={{ paddingTop: "138px" }}
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
            className="text-xs font-normal truncate"
            style={{
              padding: "0 8px",
              height: "32px",
              lineHeight: "32px",
              color: "#bfccda",
              maxWidth: "320px",
            }}
            aria-current="page"
          >
            {resource.title}
          </span>
        </nav>

        {/* Title */}
        <div
          className="flex flex-col items-center"
          style={{ marginTop: "16px" }}
        >
          <h1
            id="rd-hero-title"
            className="font-display font-semibold text-center text-white"
            style={{
              fontSize: "clamp(2rem, 3.75vw, 4.5rem)",
              lineHeight: 1,
              letterSpacing: "-0.05em",
              maxWidth: "829px",
            }}
          >
            {resource.title}
          </h1>
        </div>

        {/* Download button */}
        <div
          className="flex justify-center"
          style={{ marginTop: "30px", paddingBottom: "80px" }}
        >
          <a
            href={assetHref}
            download={assetHref !== "#"}
            className="cs-btn-blue gap-3 font-bold"
            style={{
              width: "840px",
              maxWidth: "100%",
              height: "64px",
              fontSize: "clamp(1.25rem, 1.25vw, 1.5rem)",
              letterSpacing: "-0.05em",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/resource-center/detail-download-icon.svg"
              alt=""
              aria-hidden
              width={40}
              height={40}
              className="pointer-events-none select-none"
              loading="eager"
              decoding="async"
            />
            Download
          </a>
        </div>
      </div>
    </section>
  );
}
