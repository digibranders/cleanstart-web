import Image from "next/image";

import type { ResourceDetail } from "@/lib/resources";

import { DOWNLOAD } from "./content";
import { ReportDownloadButton } from "./ReportDownloadButton";

const TITLE_STYLE = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--cta-card-title)",
  fontWeight: 600,
  letterSpacing: "-0.04em",
  lineHeight: 1.1,
  textWrap: "balance",
  color: "#111",
} as const;

const DESC_STYLE = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--cta-card-desc)",
  fontWeight: 400,
  letterSpacing: "-0.02em",
  lineHeight: 1.4,
  textWrap: "balance",
  color: "rgba(17, 17, 17, 0.8)",
} as const;

/**
 * The download call to action, in the footer's CTA slot like every other page's
 * closing card: white card, soft purple corner glows, the report cover where
 * the other cards carry a cube.
 */
export function ReportCta({ resource }: { resource: ResourceDetail }): React.ReactElement {
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: "#ffffff" }}>
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "rgba(223, 155, 255, 0.35)",
          filter: "blur(90px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none sm:block"
        style={{
          right: "-120px",
          bottom: "-150px",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          background: "rgba(223, 155, 255, 0.28)",
          filter: "blur(110px)",
        }}
      />

      {/* Mobile: stacked and centered, no decorative image. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center sm:hidden">
        <p style={TITLE_STYLE}>{DOWNLOAD.heading}</p>
        <p style={DESC_STYLE}>{DOWNLOAD.body}</p>
        <ReportDownloadButton resource={resource} label={DOWNLOAD.cta} tone="blue" />
      </div>

      <div
        className="absolute inset-0 hidden flex-row items-start overflow-hidden sm:flex"
        style={{
          padding: "clamp(28px, 4vw, 48px) clamp(32px, 6.35vw, 122px)",
          gap: "clamp(24px, 2.2vw, 32px)",
        }}
      >
        <Image
          aria-hidden
          src="/images/resources/dependency-trust/report-cover.webp"
          alt=""
          width={910}
          height={1287}
          sizes="140px"
          className="pointer-events-none absolute right-8 hidden w-[130px] select-none rounded-[6px] shadow-[0_18px_40px_-12px_rgba(71,30,192,0.45)] ring-1 ring-black/[0.06] lg:block"
          style={{ bottom: "-62px", transform: "rotate(7deg)" }}
        />
        <p className="relative flex-shrink-0" style={{ ...TITLE_STYLE, maxWidth: "min(360px, 100%)" }}>
          {DOWNLOAD.heading}
        </p>
        <div className="relative flex flex-col" style={{ maxWidth: "min(480px, 100%)", gap: "clamp(16px, 1.25vw, 24px)" }}>
          <p style={DESC_STYLE}>{DOWNLOAD.body}</p>
          <div className="self-start">
            <ReportDownloadButton resource={resource} label={DOWNLOAD.cta} tone="blue" />
          </div>
        </div>
      </div>
    </div>
  );
}
