/**
 * AboutPowering — three feature cards on a starfield-grid background.
 */

import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";

type Card = {
  title: string;
  description: string;
  iconSrc: string;
};

const CARDS: Card[] = [
  {
    title: "Accelerates Development",
    description:
      "Security should accelerate innovation, not slow it down. CleanStart automates compliance and hardens builds at source, helping teams move faster confidently..",
    iconSrc: "/images/about/n1.png",
  },
  {
    title: "End-to-End Transparency",
    description:
      "Every build is fully verifiable. CleanStart delivers complete provenance and cryptographic trust from source to production across open source and AI infrastructure. ",
    iconSrc: "/images/about/n2.png",
  },
  {
    title: "Secure by Design",
    description:
      "Trust starts at the foundation. CleanStart embeds security, compliance, and provenance into every build, making every release secure by default.",
    iconSrc: "/images/about/n3.png",
  },
];

// Six white guide-line x-positions, proportional to the 1920px design frame.
const GUIDE_LINES_X = [323, 726, 759, 1164, 1195, 1599] as const;

export function AboutPowering() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
      }}
    >
      {[130.75, 1306.73].map((leftPx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={leftPx}
          aria-hidden
          src="/images/about/powering-ellipse-blob.svg"
          alt=""
          className="pointer-events-none absolute hidden select-none lg:block"
          style={{
            left: `calc(${leftPx}px / 1920 * 100%)`,
            top: "246px",
            width: "432px",
            height: "432px",
            transform: "rotate(8.58deg) scale(2.0687)",
          }}
          loading="lazy"
          decoding="async"
        />
      ))}

      {(
        [
          [-525, 394],
          [1521, -210],
        ] as const
      ).map(([x, y]) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${x}-${y}`}
          aria-hidden
          src="/images/about/powering-bg-vector.svg"
          alt=""
          className="pointer-events-none absolute hidden select-none lg:block"
          style={{
            left: `calc(${x}px / 1920 * 100%)`,
            top: `${y}px`,
            width: "979px",
            height: "979px",
          }}
          loading="lazy"
          decoding="async"
        />
      ))}

      {GUIDE_LINES_X.map((x) => (
        <div
          key={x}
          aria-hidden
          className="pointer-events-none absolute top-[180px] hidden h-[1335px] w-px lg:block"
          style={{
            left: `calc(${x}px / 1920 * 100%)`,
            opacity: 0.9,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0) 13.67%, #ffffff 39.101%, rgba(255,255,255,0) 64.532%)",
          }}
        />
      ))}

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[100px] pb-16 lg:pb-[20px]">
        <div className="mx-auto flex max-w-[969px] flex-col items-center gap-6 text-center text-white">
          <Reveal header>
            <h2
              className="font-display"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              Powering Trusted Software Delivery for Global Leaders.
            </h2>
          </Reveal>
          <Reveal header delay={0.15} y={20}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                lineHeight: 1.4,
                letterSpacing: "-0.02em",
                opacity: 0.8,
                maxWidth: "835px",
              }}
            >
              Tailored solutions for every role in your organization — from security leaders to engineering teams.
            </p>
          </Reveal>
        </div>

        {/* Tablet + mobile stack vertically (single column); the 3-up grid
            only kicks in at lg+. */}
        <RevealStagger className="mt-20 grid grid-cols-1 items-stretch gap-y-10 lg:gap-y-16 gap-x-[clamp(24px,6vw,91px)] lg:grid-cols-3 place-items-center">
          {CARDS.map((card) => (
            <RevealItem key={card.title}>
              <FeatureCard {...card} />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>

    </section>
  );
}

function FeatureCard({ title, description, iconSrc }: Card) {
  return (
    <div
      className="relative w-full max-w-[560px] lg:max-w-[346px] lg:min-h-[clamp(360px,30vw,420px)]"
    >
      {/* Outer glow halo — desktop only; tablet/mobile show a single dark
          inner border instead. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/about/powering-card-glow.svg"
        alt=""
        className="pointer-events-none absolute -inset-x-[29px] -top-[29px] hidden h-[calc(100%+58px)] w-[calc(100%+58px)] max-w-none select-none lg:block"
        loading="lazy"
        decoding="async"
      />

      {/* Cyan glow ring — shown at every breakpoint; acts as the single inner
          border on tablet/mobile. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-[24px]"
        style={{ backgroundColor: "#2CC1EB", opacity: 0.3 }}
      />

      {/* White card — flex column, no absolute internals.
          Mobile: ball + text centered. sm+: left-aligned. */}
      <div className="relative flex h-full w-full flex-col items-center text-center sm:items-start sm:text-left gap-[clamp(28px,3vw,56px)] overflow-hidden rounded-[24px] bg-white p-card-md">
        {/* Per-card PNG sphere with embedded glyph. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt=""
          aria-hidden
          width={96}
          height={96}
          loading="lazy"
          decoding="async"
          className="shrink-0 pointer-events-none select-none"
          style={{
            // Source PNG is 196×196 — supports up to ~98px display at 2× DPR.
            width: "clamp(88px, 8vw, 96px)",
            aspectRatio: "1 / 1",
            objectFit: "contain",
          }}
        />

        <div className="flex flex-col gap-3">
          <h3
            className="font-display text-[#111]"
            style={{
              fontSize: "var(--fs-h3)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            {title}
          </h3>
          <p
            className="text-[#555]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body)",
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-0.02em",
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
