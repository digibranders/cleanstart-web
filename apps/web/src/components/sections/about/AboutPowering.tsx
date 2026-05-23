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

type Card = { title: string; description: string };

const CARDS: Card[] = [
  {
    title: "Accelerates Development",
    description:
      "Security no longer slows innovation. CleanStart automates compliance and hardens builds from the source, giving developers freedom to move fast without risk.",
  },
  {
    title: "End-to-End Transparency",
    description:
      "Every artifact tells its story. With CleanStart, every software component from source to production carries full provenance and cryptographic proof of trust.",
  },
  {
    title: "Secure by Design",
    description:
      "Security is strongest when it starts at the foundation. CleanStart embeds trust and compliance deeply into every build, making every release inherently secure by default.",
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
          className="pointer-events-none absolute hidden select-none xl:block"
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
          className="pointer-events-none absolute hidden select-none xl:block"
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
          className="pointer-events-none absolute top-[180px] hidden h-[1335px] w-px xl:block"
          style={{
            left: `calc(${x}px / 1920 * 100%)`,
            opacity: 0.9,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0) 13.67%, #ffffff 39.101%, rgba(255,255,255,0) 64.532%)",
          }}
        />
      ))}

      {/* ── Foreground content ─────────────────────────────────────── */}

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-[100px] pb-[20px]">
        {/* Title group — 248:2152 (centered, max-w 969px) */}
        <div className="mx-auto flex max-w-[969px] flex-col items-center gap-6 text-center text-white">
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            Powering Trusted Software Delivery for Global Leaders.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(18px, 1.7vw, 24px)",
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-0.02em",
              opacity: 0.8,
              maxWidth: "835px",
            }}
          >
            Tailored solutions for every role in your organization — from
            security leaders to engineering teams.
          </p>
        </div>

        {/* Cards row — Figma top=412 → 80px gap below title block */}
        <div className="mt-20 grid grid-cols-1 items-stretch gap-y-16 gap-x-[clamp(24px,6vw,91px)] md:grid-cols-2 xl:grid-cols-3 place-items-center">
          {CARDS.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>
      </div>

    </section>
  );
}

function FeatureCard({ title, description }: Card) {
  return (
    <div
      className="relative w-full"
      style={{ maxWidth: "346px", minHeight: "clamp(360px, 30vw, 420px)" }}
    >
      {/* Outer shadow — 248:2159 (404×478, 29px halo, top-rounded glow PNG) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/about/powering-card-glow.svg"
        alt=""
        className="pointer-events-none absolute -inset-x-[29px] -top-[29px] h-[calc(100%+58px)] w-[calc(100%+58px)] max-w-none select-none"
        loading="lazy"
        decoding="async"
      />

      {/* Cyan glow ring — 248:2161 (362×440, #2CC1EB @ 0.3, rounded-24) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-[24px]"
        style={{ backgroundColor: "#2CC1EB", opacity: 0.3 }}
      />

      {/* White card — flex column, no absolute internals */}
      <div className="relative flex h-full w-full flex-col gap-[clamp(28px,3vw,56px)] overflow-hidden rounded-[24px] bg-white p-card-md">
        {/* Ball — 248:2163 (96×96, blue gradient, inset highlight) */}
        <div
          className="flex shrink-0 items-center justify-center overflow-hidden"
          style={{
            width: "clamp(72px, 7vw, 96px)",
            aspectRatio: "1 / 1",
            borderRadius: "160px",
            background: "linear-gradient(180deg, #239CFF 0%, #005BE3 100%)",
            boxShadow:
              "0px 6.171px 14.537px rgba(28,60,142,0.33), inset 0px -0.233px 0.291px rgba(0,44,179,0.5), inset 0px 0.116px 0.582px rgba(255,255,255,0.81)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/about/powering-ball-icon.svg"
            alt=""
            width={54}
            height={54}
            className="object-contain"
            style={{ width: "56%", height: "56%" }}
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="flex flex-col gap-3">
          <h3
            className="font-display text-[#111]"
            style={{
              fontSize: "clamp(22px, 2.4vw, 32px)",
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
              fontSize: "clamp(15px, 1.4vw, 20px)",
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
