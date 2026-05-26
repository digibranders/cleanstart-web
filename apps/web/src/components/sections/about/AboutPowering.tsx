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

type Card = {
  title: string;
  description: string;
  Icon: () => React.ReactElement;
};

/* Per-card white-line inline SVG icons. Same approach as SCATransform's chip
 * icons + CleanSightUnified — keeps visual weight consistent across the row
 * without shipping 3 separate SVG asset files. Each icon renders at the
 * blue ball's full inner size (56% of 96px ≈ 54px). */
function IconAccelerate(): React.ReactElement {
  return (
    <svg width="54" height="54" viewBox="0 0 32 32" fill="none" aria-hidden>
      {/* Main upward arrow (chevron) */}
      <path d="M16 6l8 9h-5v9h-6v-9H8l8-9z" fill="#fff"/>
      {/* Smaller motion chevrons either side, behind the main arrow */}
      <path d="M8 19l4 4M24 19l-4 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.55"/>
      <path d="M6 23l3 3M26 23l-3 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.35"/>
    </svg>
  );
}
function IconCheckShield(): React.ReactElement {
  return (
    <svg width="54" height="54" viewBox="0 0 32 32" fill="none" aria-hidden>
      {/* Document with curled corner */}
      <path d="M8 4h12l4 4v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(255,255,255,0.1)"/>
      <path d="M20 4v4h4" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
      {/* Big check inside */}
      <path d="M11 17l3 3 6-7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconLock(): React.ReactElement {
  return (
    <svg width="54" height="54" viewBox="0 0 32 32" fill="none" aria-hidden>
      {/* Shackle */}
      <path d="M10 14V11a6 6 0 0 1 12 0v3" stroke="#fff" strokeWidth="1.9" strokeLinecap="round"/>
      {/* Lock body */}
      <rect x="7" y="14" width="18" height="14" rx="2.5" stroke="#fff" strokeWidth="1.9" fill="rgba(255,255,255,0.1)"/>
      {/* Keyhole — small circle + slot */}
      <circle cx="16" cy="20" r="1.6" fill="#fff"/>
      <path d="M16 21.4v3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

const CARDS: Card[] = [
  {
    title: "Accelerates Development",
    description:
      "Security should accelerate innovation, not slow it down. CleanStart automates compliance and hardens builds at source, helping teams move faster confidently..",
    Icon: IconAccelerate,
  },
  {
    title: "End-to-End Transparency",
    description:
      "Every build is fully verifiable. CleanStart delivers complete provenance and cryptographic trust from source to production across open source and AI infrastructure. ",
    Icon: IconCheckShield,
  },
  {
    title: "Secure by Design",
    description:
      "Trust starts at the foundation. CleanStart embeds security, compliance, and provenance into every build, making every release secure by default.",
    Icon: IconLock,
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
            Tailored solutions for every role in your organization — from security leaders to engineering teams.
          </p>
        </div>

        {/* Cards row — Figma top=412 → 80px gap below title block */}
        <div className="mt-20 grid grid-cols-1 items-stretch gap-y-16 gap-x-[clamp(24px,6vw,91px)] md:grid-cols-2 lg:grid-cols-3 place-items-center">
          {CARDS.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>
      </div>

    </section>
  );
}

function FeatureCard({ title, description, Icon }: Card) {
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

      {/* White card — flex column, no absolute internals.
          Mobile: ball + text centered. sm+: original left-aligned. */}
      <div className="relative flex h-full w-full flex-col items-center text-center sm:items-start sm:text-left gap-[clamp(28px,3vw,56px)] overflow-hidden rounded-[24px] bg-white p-card-md">
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
          <Icon />
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
