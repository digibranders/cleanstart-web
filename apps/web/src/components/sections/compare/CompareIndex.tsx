import Link from "next/link";
import { Section, Container } from "@/components/layout";
import { HeroReveal } from "@/components/ui/Reveal";
import { RevealStagger, RevealItem } from "@/components/ui/Reveal";
import {
  matrixDifferenceCount,
  matrixRowCount,
  type CompareContent,
} from "./compare-types";
import {
  BRAND,
  cornerAt,
  CornerTile,
  Glow,
  LightBandDecor,
  VendorMark,
  WASH_LIGHT,
} from "./compare-visuals";

/**
 * `/compare` — the hub the three comparison pages hang off.
 *
 * Every card is composed from the comparison's own `CompareContent`: its
 * headline is `titleParts`, its sentence is the `standfirst` its source
 * document wrote, its counts are derived from its own matrix, and its link is
 * its own `path`. Nothing here restates a comparison in words of the hub's
 * own, so a card can never drift from the page it points at, and adding a
 * fourth comparison is adding it to the array the route passes in.
 *
 * The two strings this file does own are UI chrome and are named in `INDEX_UI`
 * below. The hero's own headline and sentence come from the route, because
 * they are the page's copy and want SEO's review like any other.
 */

/** Chrome the comparison documents do not write. */
const INDEX_UI = {
  cardCta: "See the comparison",
  /** Screen-reader label for the derived counts under each headline. */
  statsLabel: "At a glance",
} as const;

export interface CompareIndexCopy {
  readonly titleLead: string;
  readonly titleAccent: string;
  readonly standfirst: string;
}

/**
 * The rival's mark and CleanStart's, with the page's "vs" marker between them.
 * The same pairing the comparison pages set at the top of their capability
 * table, so a card is recognisable as the page it opens.
 */
function MarkPair({ rivalMark }: { rivalMark: string }): React.ReactElement {
  return (
    <span className="flex items-center gap-2.5">
      <VendorMark tone="rival" rivalMark={rivalMark} size={34} />
      <span
        aria-hidden
        className="font-display"
        style={{
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
          letterSpacing: "var(--fs-badge-ls)",
          textTransform: "uppercase",
          color: "rgba(17,17,17,0.45)",
        }}
      >
        vs
      </span>
      <VendorMark tone="cleanstart" rivalMark={rivalMark} size={34} />
    </span>
  );
}

function Stat({ value, label }: { value: number; label: string }): React.ReactElement {
  return (
    <span className="flex items-baseline gap-1.5">
      <span
        className="font-display"
        style={{
          fontSize: "var(--fs-h5)",
          fontWeight: 600,
          lineHeight: 1,
          color: BRAND.violet,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-caption)",
          lineHeight: "var(--fs-caption-lh)",
          color: "rgba(17,17,17,0.62)",
        }}
      >
        {label}
      </span>
    </span>
  );
}

function Card({
  content,
  corner,
}: {
  content: CompareContent;
  corner: ReturnType<typeof cornerAt>;
}): React.ReactElement {
  const rows = matrixRowCount(content.matrix);
  const differences = matrixDifferenceCount(content.matrix);

  return (
    <CornerTile
      corner={corner}
      // `group` drives the arrow nudge and the border lift from the card's own
      // hover, so the whole tile is one target rather than a tile with a link
      // somewhere inside it.
      className="group transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[rgba(106,61,240,0.35)] hover:shadow-[0_1px_2px_rgba(17,17,17,0.04),0_28px_56px_-40px_rgba(70,30,190,0.45)] focus-within:border-[rgba(106,61,240,0.35)]"
    >
      <MarkPair rivalMark={content.rivalMark} />

      {/* Two lines of headline are reserved wherever the cards sit side by
          side, so every card's paragraph starts on the same line. "Chainguard
          vs CleanStart" fits on one line while the other two wrap, and without
          this its body floated a line above its neighbours'. A floor, not a
          fixed height: a longer rival name still takes the lines it needs.
          Below `md` the cards stack and a reserved empty line is just a gap. */}
      <h2
        className="mt-5 font-display text-[#111111] md:min-h-[2lh]"
        style={{
          fontSize: "var(--fs-h4)",
          fontWeight: "var(--fs-h4-weight)",
          letterSpacing: "var(--fs-h4-ls)",
          lineHeight: "var(--fs-h4-lh)",
        }}
      >
        {/* The card is the whole tile: this link is stretched over it, so the
            headline stays the accessible name of the one link. */}
        <Link
          href={content.path}
          className="after:absolute after:inset-0 after:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33BAEC]"
        >
          {content.titleParts.lead}
          <span className="cs-text-gradient-impact">
            {content.titleParts.accent}
          </span>
        </Link>
      </h2>

      <p
        className="mt-3"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body-sm)",
          lineHeight: "var(--fs-body-sm-lh)",
          letterSpacing: "var(--fs-body-ls)",
          color: "#333333",
        }}
      >
        {content.standfirst}
      </p>

      {/* Derived from the comparison's own matrix, so the card cannot
          advertise a count the table then contradicts. */}
      <dl
        aria-label={INDEX_UI.statsLabel}
        className="mt-auto flex flex-wrap items-baseline gap-x-6 gap-y-2 pt-6"
      >
        <div>
          <dt className="sr-only">Capabilities compared</dt>
          <dd>
            <Stat value={rows} label="capabilities compared" />
          </dd>
        </div>
        <div>
          <dt className="sr-only">Differences</dt>
          <dd>
            <Stat value={differences} label="differences" />
          </dd>
        </div>
      </dl>

      <span
        aria-hidden
        className="mt-5 inline-flex items-center gap-2 font-display"
        style={{
          fontSize: "var(--fs-button-sm)",
          fontWeight: "var(--fs-button-weight)",
          letterSpacing: "var(--fs-button-ls)",
          color: BRAND.violet,
        }}
      >
        {INDEX_UI.cardCta}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="transition-transform duration-200 group-hover:translate-x-1"
        >
          <path
            d="M3.5 8h9M9 4.5 12.5 8 9 11.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </CornerTile>
  );
}

export function CompareIndexHero({
  copy,
}: {
  copy: CompareIndexCopy;
}): React.ReactElement {
  return (
    <section
      data-section="CompareIndexHero"
      className="relative overflow-hidden bg-cs-hero"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/for-developers/hero-grid.svg"
        alt=""
        className="pointer-events-none absolute left-0 top-0 hidden w-full select-none md:block"
        style={{ height: "520px", objectFit: "cover", opacity: 0.6 }}
        loading="eager"
        decoding="async"
      />
      <Glow
        color="rgba(169,116,255,0.28)"
        size="min(760px, 52%)"
        right="-6%"
        top="-18%"
      />
      <Glow
        color="rgba(7,110,255,0.22)"
        size="min(560px, 42%)"
        left="-10%"
        bottom="-14%"
      />

      <div
        className="relative z-20 mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: "calc(clamp(104px, 9vw, 136px) + var(--cs-header-extra))",
          paddingBottom: "clamp(72px, 8vw, 116px)",
        }}
      >
        <div className="flex flex-col items-center text-center">
          <HeroReveal y={50} duration={1} lcp>
            <h1
              className="font-display text-white"
              style={{
                fontSize: "var(--fs-display)",
                fontWeight: "var(--fs-display-weight)",
                letterSpacing: "var(--fs-display-ls)",
                lineHeight: "var(--fs-display-lh)",
                maxWidth: "20ch",
                textWrap: "balance",
              }}
            >
              {copy.titleLead}
              <span className="cs-text-gradient-impact">{copy.titleAccent}</span>
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.15} duration={0.8}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: "var(--fs-lead-weight)",
                letterSpacing: "var(--fs-lead-ls)",
                lineHeight: "var(--fs-lead-lh)",
                color: "rgba(255,255,255,0.78)",
                maxWidth: "62ch",
                marginTop: "clamp(20px, 2vw, 28px)",
              }}
            >
              {copy.standfirst}
            </p>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}

export function CompareIndexList({
  comparisons,
}: {
  comparisons: readonly CompareContent[];
}): React.ReactElement {
  return (
    // `padding="md"` and a bare `<Footer />`, the pattern the site's other
    // listing pages use (`CaseStudiesGrid`, the resource centre). No CTA card
    // means no overlap to reserve, so `--spacing-section-cta` here would just
    // leave a band of empty wash above the footer.
    <Section
      padding="md"
      data-section="CompareIndexList"
      className="relative overflow-hidden"
      style={{ background: WASH_LIGHT }}
    >
      <LightBandDecor />

      <Container className="relative">
        <RevealStagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {comparisons.map((content, index) => (
            <RevealItem key={content.path} className="h-full">
              <Card content={content} corner={cornerAt(index)} />
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
