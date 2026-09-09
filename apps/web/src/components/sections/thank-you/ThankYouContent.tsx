import Link from "next/link";

import { Container, Section } from "@/components/layout";
import type { ThankYouContent as Content } from "@/lib/thank-you/content";

/**
 * The post-conversion page body.
 *
 * This is the most valuable unused space on the site: someone who has just
 * converted is at peak intent, and the inline banner it replaces vanished after
 * five seconds. So it leads with confirmation, says plainly what happens next,
 * then offers the two next steps most likely to matter.
 */
export function ThankYouContent({ content }: { content: Content }): React.ReactElement {
  return (
    <Section padding="lg">
      <Container variant="prose">
        <div className="flex flex-col items-start gap-5">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1"
            style={{
              background: "rgba(18, 183, 106, 0.10)",
              color: "#0E7C4F",
              fontFamily: "var(--font-display), 'Manrope', sans-serif",
              fontSize: "var(--fs-caption)",
              fontWeight: 600,
              letterSpacing: "0.01em",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {content.eyebrow}
          </span>

          {/* tabIndex so the tracker can move focus here after a soft
              navigation, which otherwise announces nothing. */}
          <h1
            id="thank-you-heading"
            tabIndex={-1}
            className="font-display text-[#0F123E] outline-none"
            style={{
              fontSize: "var(--text-hero-utility)",
              fontWeight: 600,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
            }}
          >
            {content.headline}
          </h1>

          <p
            className="text-[#3A3F63]"
            style={{ fontSize: "var(--fs-lead)", lineHeight: 1.55 }}
          >
            {content.body}
          </p>

          <div
            className="w-full rounded-[14px] p-5"
            style={{
              background: "#F5F6FB",
              boxShadow: "inset 0 0 0 1px rgba(9,6,63,0.05)",
            }}
          >
            <p
              className="mb-1.5 font-display text-[#0F123E]"
              style={{ fontSize: "var(--fs-caption)", fontWeight: 600, letterSpacing: "0.04em" }}
            >
              WHAT HAPPENS NEXT
            </p>
            <p className="text-[#3A3F63]" style={{ fontSize: "var(--fs-body)", lineHeight: 1.6 }}>
              {content.whatHappensNext}
            </p>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Link
              href={content.primary.href}
              className="cs-btn-blue"
              style={
                {
                  ["--cs-btn-h" as string]: "48px",
                  ["--cs-btn-px" as string]: "24px",
                  ["--cs-btn-fs" as string]: "var(--fs-button)",
                } as React.CSSProperties
              }
            >
              <span>{content.primary.label}</span>
            </Link>
            <Link
              href={content.secondary.href}
              className="cs-link-cta"
              style={{ fontSize: "var(--fs-button)" }}
            >
              {content.secondary.label}
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
