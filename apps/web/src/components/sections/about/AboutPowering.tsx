/**
 * AboutPowering — Figma node 248:2141
 * Frame: 1920×1017, gradient bg, 3 feature cards on a starfield-grid background.
 *
 * Card geometry (per Figma):
 *  - outer shadow box: 404×478 (29px halo around white card)
 *  - cyan glow ring:   362×440 (8px halo around white card)
 *  - white card:       346×420 (rounded-16)
 *  - cards laid out in a 1276px container, white-card pitch = 437px, gap = 91px
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

// 6 white guide-line x-positions in the 1920px Figma frame (248:2145–2150).
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
      {/* ── Decorative background layer ─────────────────────────────── */}

      {/* Purple ellipse blobs — 248:2142/2143, rotated 8.58deg */}
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

      {/* Background grid vectors — 248:2144 / 248:2151 */}
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

      {/* Vertical white guide lines — 248:2145–2150 (6 lines, opacity 0.9) */}
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

      {/* ── Foreground content ─────────────────────────────────────── */}

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[100px] pb-16 lg:pb-[20px]">
        {/* Title group — 248:2152 (centered, max-w 969px) */}
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

        {/* Cards row — Figma top=412 → 80px gap below title block.
            Tablet + mobile stack vertically (single column) with rectangle cards.
            3-up grid only kicks in at lg+. */}
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
      {/* Outer shadow — 248:2159 (404×478, 29px halo, top-rounded glow PNG).
          Desktop only — tablet/mobile show a single dark inner border instead. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/about/powering-card-glow.svg"
        alt=""
        className="pointer-events-none absolute -inset-x-[29px] -top-[29px] hidden h-[calc(100%+58px)] w-[calc(100%+58px)] max-w-none select-none lg:block"
        loading="lazy"
        decoding="async"
      />

      {/* Cyan glow ring — 248:2161 (362×440, #2CC1EB @ 0.3, rounded-24).
          Shown at every breakpoint — acts as the single inner border on tablet/mobile. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-[24px]"
        style={{ backgroundColor: "#2CC1EB", opacity: 0.3 }}
      />

      {/* White card — flex column, no absolute internals.
          Mobile: ball + text centered. sm+: original left-aligned. */}
      <div className="relative flex h-full w-full flex-col items-center text-center sm:items-start sm:text-left gap-[clamp(28px,3vw,56px)] overflow-hidden rounded-[24px] bg-white p-card-md">
        {/* Ball — per-card PNG sphere with embedded glyph (Ball1/Ball2/Ball3). */}
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
            // Source PNG is 196×196 — supports up to ~98 px display at 2× DPR.
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
