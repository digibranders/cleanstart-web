import Image from "next/image";

import { Section } from "@/components/layout";
import { FadeUp } from "@/components/ui/FadeUp";
import type { ResourceDetail } from "@/lib/resources";

import { DOWNLOAD } from "./content";
import { ReportDownloadButton } from "./ReportDownloadButton";

const PAGE_CLASS =
  "absolute overflow-hidden rounded-[8px] bg-white ring-1 ring-white/25 shadow-[0_-18px_48px_-14px_rgba(7,6,40,0.6)]";

/**
 * The last call to action. The report's pages rise from the bottom edge of the
 * band and are cut off by it, so the report reads as something still to open.
 */
export function DownloadBand({ resource }: { resource: ResourceDetail }): React.ReactElement {
  return (
    <Section
      padding="none"
      data-section="DownloadBand"
      className="overflow-hidden pt-20 lg:pt-28"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #10123E 34%, #131E8F 74%, #471EC0 100%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/for-developers/why/deco-glow-top-right.svg"
        alt=""
        className="pointer-events-none absolute right-0 top-0 hidden w-[720px] max-w-none select-none opacity-70 lg:block"
        loading="lazy"
        decoding="async"
      />
      <FadeUp>
        <div className="relative mx-auto flex max-w-[var(--container-default)] flex-col items-center px-6 text-center sm:px-10">
          <h2
            className="max-w-[16ch] text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h1)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: "var(--fs-h1-lh)",
              textWrap: "balance",
            }}
          >
            {DOWNLOAD.heading}
          </h2>
          <p
            className="mt-5 max-w-[56ch] text-white"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-lead-sm)",
              lineHeight: 1.5,
              letterSpacing: "-0.01em",
              opacity: 0.82,
              textWrap: "balance",
            }}
          >
            {DOWNLOAD.body}
          </p>
          <div className="mt-8">
            <ReportDownloadButton resource={resource} label={DOWNLOAD.cta} tone="glass" />
          </div>
        </div>

        <div
          aria-hidden
          className="relative mx-auto mt-14 h-[230px] w-full max-w-[920px] sm:h-[290px] lg:h-[340px]"
        >
          <div className={`${PAGE_CLASS} left-[6%] top-[9%] w-[31%] -rotate-[8deg]`}>
            <Image
              src="/images/resources/dependency-trust/report-page-summary.webp"
              alt=""
              width={910}
              height={1287}
              sizes="(min-width: 1024px) 290px, 31vw"
              className="h-auto w-full"
            />
          </div>
          <div className={`${PAGE_CLASS} right-[6%] top-[9%] w-[31%] rotate-[8deg]`}>
            <Image
              src="/images/resources/dependency-trust/report-page-part2.webp"
              alt=""
              width={910}
              height={1287}
              sizes="(min-width: 1024px) 290px, 31vw"
              className="h-auto w-full"
            />
          </div>
          <div className={`${PAGE_CLASS} left-1/2 top-0 z-10 w-[36%] -translate-x-1/2`}>
            <Image
              src="/images/resources/dependency-trust/report-cover.webp"
              alt=""
              width={910}
              height={1287}
              sizes="(min-width: 1024px) 330px, 36vw"
              className="h-auto w-full"
            />
          </div>
        </div>
      </FadeUp>
    </Section>
  );
}
