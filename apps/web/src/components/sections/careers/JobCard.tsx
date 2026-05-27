import Link from "next/link";
import {
  applyHref,
  DEPARTMENT_LABEL,
  EMPLOYMENT_TYPE_LABEL,
  experienceDisplay,
  JOB_STATUS_LABEL,
  jobStatusBadge,
  locationDisplay,
  type Job,
  type JobStatusBadge,
} from "@/lib/jobs";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps): React.ReactElement {
  const employmentLabel = job.employmentType
    ? EMPLOYMENT_TYPE_LABEL[job.employmentType]
    : null;
  const departmentLabel = job.department
    ? DEPARTMENT_LABEL[job.department]
    : null;
  const location = locationDisplay(job);
  const experience = experienceDisplay(job);
  const href = applyHref(job);
  const isExternal = href.startsWith("http") || href.startsWith("mailto:");
  const status = jobStatusBadge(job);
  const isClosed = status === "closed";

  return (
    <article
      className="bg-white"
      style={{
        borderRadius: "16px",
        padding: "24px",
        boxShadow:
          "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01)",
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        {/* Title + tags */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <h2
            className="font-display"
            style={{
              fontSize: "var(--fs-h5)",
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: "-0.02em",
              color: isClosed ? "rgba(17,17,17,0.55)" : "#111",
            }}
          >
            {job.title}
          </h2>
          {/* Pills row — status, employment type, department. Keeping the
              status badge in the pills row (rather than inline with the title)
              keeps the alignment stable whether the title wraps to one line
              or several. */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            {employmentLabel && <Pill tone="violet">{employmentLabel}</Pill>}
            {departmentLabel && <Pill tone="magenta">{departmentLabel}</Pill>}
          </div>
        </div>

        {/* Vertical separator — Figma Rectangle 1000001787 (1×77, gray gradient).
            Only renders at lg+ where the row layout is horizontal. */}
        <VerticalSeparator />

        {/* Location */}
        <div
          className="flex items-center gap-1.5 shrink-0 lg:w-[180px]"
          aria-label="Location"
        >
          <PinIcon />
          <span
            className="font-sans"
            style={{
              fontSize: "var(--fs-body-sm)",
              color: "rgba(17,17,17,0.7)",
              fontWeight: 400,
              lineHeight: 1.35,
            }}
          >
            {location}
          </span>
        </div>

        {/* Vertical separator — Figma Rectangle 1000001788. */}
        <VerticalSeparator />

        {/* Experience */}
        <div
          className="shrink-0 lg:w-[140px]"
          aria-label="Experience required"
        >
          <span
            className="font-sans"
            style={{
              fontSize: "var(--fs-body-sm)",
              color: "rgba(17,17,17,0.7)",
              fontWeight: 400,
              lineHeight: 1.35,
            }}
          >
            {experience ?? "—"}
          </span>
        </div>

        {/* Apply CTA — same hover-lift + active-scale press feedback the
            header CTA (cs-btn-blue / cs-btn-glass) uses. When the role is
            closed, the CTA becomes a non-interactive "Applications closed"
            label with no glow, hover, or press effect. */}
        {/* Apply CTA — full-width on mobile per Figma 817:7317 spec, auto-width at lg+. */}
        <div className="shrink-0 w-full lg:w-auto">
          {isClosed ? (
            <span
              aria-disabled
              className="inline-flex items-center justify-center font-sans select-none w-full lg:w-auto"
              style={closedButtonStyle}
            >
              Applications closed
            </span>
          ) : isExternal ? (
            <a
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`${APPLY_BUTTON_CLASS} w-full lg:w-auto`}
              style={applyButtonStyle}
              aria-label={`Apply for ${job.title}`}
            >
              <ApplyButtonGlow />
              <span className="relative z-10 inline-flex items-center gap-2">
                Apply Now
                <ArrowRight />
              </span>
            </a>
          ) : (
            <Link
              href={href}
              className={`${APPLY_BUTTON_CLASS} w-full lg:w-auto`}
              style={applyButtonStyle}
              aria-label={`Apply for ${job.title}`}
            >
              <ApplyButtonGlow />
              <span className="relative z-10 inline-flex items-center gap-2">
                Apply Now
                <ArrowRight />
              </span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

const applyButtonStyle: React.CSSProperties = {
  height: "40px",
  padding: "0 16px",
  borderRadius: "10px",
  background: "#4a3bf1",
  color: "white",
  fontSize: "var(--fs-body-sm)",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  whiteSpace: "nowrap",
  // Same easing + duration as cs-btn-blue so the press feels uniform across
  // the site. `transform-gpu` keeps the scale on the compositor.
  transition:
    "transform 200ms ease, filter 200ms ease, box-shadow 200ms ease",
  WebkitTapHighlightColor: "transparent",
  boxShadow:
    "0 0 0 1px #4a3bf1, 0 1px 2px rgba(9,6,63,0.4), inset 0 1px 0 rgba(255,255,255,0.16)",
};

const closedButtonStyle: React.CSSProperties = {
  height: "40px",
  padding: "0 16px",
  borderRadius: "10px",
  background: "rgba(17,17,17,0.06)",
  color: "rgba(17,17,17,0.55)",
  border: "1px solid rgba(17,17,17,0.10)",
  fontSize: "var(--fs-body-sm)",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  whiteSpace: "nowrap",
  cursor: "not-allowed",
};

const APPLY_BUTTON_CLASS =
  "relative inline-flex items-center justify-center gap-2 font-sans cursor-pointer overflow-hidden " +
  "transform-gpu hover:-translate-y-px hover:brightness-110 " +
  "active:translate-y-0 active:scale-[0.97] active:duration-[80ms] active:brightness-100 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#33BAEC] focus-visible:outline-offset-[3px]";

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "violet" | "magenta";
}): React.ReactElement {
  const background =
    tone === "violet" ? "rgba(74,59,241,0.08)" : "rgba(196,70,239,0.20)";
  const color = tone === "violet" ? "#4a3bf1" : "#C446EF";
  return (
    <span
      className="font-sans"
      style={{
        fontSize: "var(--fs-badge)",
        fontWeight: 500,
        lineHeight: 1,
        padding: "5px 10px",
        borderRadius: "999px",
        background,
        color,
      }}
    >
      {children}
    </span>
  );
}

function PinIcon(): React.ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.657 16.6567L13.414 20.8997C13.039 21.2743 12.5306 21.4848 12.0005 21.4848C11.4704 21.4848 10.962 21.2743 10.587 20.8997L6.343 16.6567C5.22422 15.5379 4.46234 14.1124 4.15369 12.5606C3.84504 11.0087 4.00349 9.40022 4.60901 7.93844C5.21452 6.47665 6.2399 5.22725 7.55548 4.34821C8.87107 3.46918 10.4178 3 12 3C13.5822 3 15.1289 3.46918 16.4445 4.34821C17.7601 5.22725 18.7855 6.47665 19.391 7.93844C19.9965 9.40022 20.155 11.0087 19.8463 12.5606C19.5377 14.1124 18.7758 15.5379 17.657 16.6567Z"
        stroke="#111111"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 11C9 11.7956 9.31607 12.5587 9.87868 13.1213C10.4413 13.6839 11.2044 14 12 14C12.7956 14 13.5587 13.6839 14.1213 13.1213C14.6839 12.5587 15 11.7956 15 11C15 10.2044 14.6839 9.44129 14.1213 8.87868C13.5587 8.31607 12.7956 8 12 8C11.2044 8 10.4413 8.31607 9.87868 8.87868C9.31607 9.44129 9 10.2044 9 11Z"
        stroke="#111111"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STATUS_PALETTE: Record<
  JobStatusBadge,
  { bg: string; fg: string; dot: string }
> = {
  open: {
    bg: "rgba(34,197,94,0.12)",
    fg: "#15803D",
    dot: "#22C55E",
  },
  "closing-soon": {
    bg: "rgba(245,158,11,0.14)",
    fg: "#B45309",
    dot: "#F59E0B",
  },
  closed: {
    bg: "rgba(17,17,17,0.08)",
    fg: "rgba(17,17,17,0.6)",
    dot: "rgba(17,17,17,0.45)",
  },
};

function StatusBadge({ status }: { status: JobStatusBadge }): React.ReactElement {
  const palette = STATUS_PALETTE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 font-sans"
      style={{
        fontSize: "11px",
        fontWeight: 600,
        lineHeight: 1,
        padding: "4px 9px 4px 7px",
        borderRadius: "999px",
        background: palette.bg,
        color: palette.fg,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }}
    >
      <span
        aria-hidden
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: palette.dot,
        }}
      />
      {JOB_STATUS_LABEL[status]}
    </span>
  );
}

function VerticalSeparator(): React.ReactElement {
  // Per Figma Rectangles 1000001787 / 1000001788: 1px wide, 77px tall,
  // vertical fade transparent → #D9D9D9 → transparent.
  return (
    <span
      aria-hidden
      className="hidden lg:block shrink-0 self-center"
      style={{
        width: "1px",
        height: "77px",
        background:
          "linear-gradient(179.99deg, rgba(217,217,217,0) -15.55%, #D9D9D9 41.59%, rgba(217,217,217,0) 105.55%)",
      }}
    />
  );
}

function ApplyButtonGlow(): React.ReactElement {
  // Per Figma spec: 30.07px white ellipse at 60% opacity, 10.0245px blur,
  // bottom-centered inside the button so the soft halo bleeds up into the fill.
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        width: "30px",
        height: "30px",
        left: "50%",
        bottom: "-14px",
        transform: "translateX(-50%)",
        background: "rgba(255,255,255,0.6)",
        borderRadius: "50%",
        filter: "blur(10px)",
        zIndex: 0,
      }}
    />
  );
}

function ArrowRight(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3.5 8h9M8.5 4l4 4-4 4"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
