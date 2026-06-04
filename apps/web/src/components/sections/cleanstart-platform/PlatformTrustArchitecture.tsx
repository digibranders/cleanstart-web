/**
 * "The CleanStart Trust Architecture" — vertical trust-flow timeline.
 *
 * A central SOURCE CODE card feeds a glowing connector that drops and elbows
 * into a left-hand spine running through four numbered stage cards (01–04).
 * Ported from Figma node 1199:3974. The spine is built from per-row CSS line
 * segments (each spanning its row + the gap below) so it stays continuous and
 * pinned to the ball centres regardless of how the card text reflows.
 */

interface Stage {
  number: string;
  name: string;
  subtitle: string;
  description: string;
  features: string[];
}

const STAGES: Stage[] = [
  {
    number: "01",
    name: "Tricorder",
    subtitle: "AI Logic Engine",
    description: "Analyze software before artifacts exist.",
    features: ["Source-level intelligence", "Behavioral graph mapping", "AI-native anomaly detection"],
  },
  {
    number: "02",
    name: "CleanCompile",
    subtitle: "Deterministic Reconstruction",
    description: "Rebuild verified software in hermetic environments.",
    features: ["Hermetic build pipelines", "Reproducible outputs", "Cryptographic attestation"],
  },
  {
    number: "03",
    name: "CleanImage",
    subtitle: "Trusted Runtime Assembly",
    description: "Assemble minimal, hardened runtime environments.",
    features: ["Minimal runtime images", "BusyBox replacement", "CleanStart OS foundations"],
  },
  {
    number: "04",
    name: "The Vault",
    subtitle: "Trusted Runtime Foundations",
    description: "Deliver continuously rebuilt and verifiable outputs.",
    features: ["Zero known CVE foundations", "Shell-less environments", "Continuously verifiable outputs"],
  },
];

const CARD_BG = "linear-gradient(180deg, rgba(255,255,255,0) 13%, rgba(154,81,255,0.30) 85%)";
const SOURCE_BG = "linear-gradient(180deg, rgba(255,255,255,0) 13%, rgba(154,81,255,0.12) 85%)";

/**
 * Glassy neon connector segment — a bright gradient core with a soft blurred
 * halo (Figma: 12px Linear stroke + Layer blur + "Plus lighter" blend). The
 * caller positions/sizes the track via `className` (a thin band along the run);
 * the core + halo fill it. `cap` rounds the run's ends so segments meeting at a
 * corner read as a smooth rounded bend.
 */
function GlassLine({ orientation, className }: { orientation: "v" | "h"; className: string }) {
  const v = orientation === "v";
  const core = v ? "inset-y-0 left-1/2 w-[3px] -translate-x-1/2" : "inset-x-0 top-1/2 h-[3px] -translate-y-1/2";
  const halo = v ? "inset-y-0 left-1/2 w-2.5 -translate-x-1/2" : "inset-x-0 top-1/2 h-2.5 -translate-y-1/2";
  return (
    <span aria-hidden className={`pointer-events-none absolute ${className}`}>
      {/* Uniform (non-directional) colours so per-row segments tile seamlessly
          into one continuous line with no dim band at the joins. */}
      <span className={`absolute rounded-full blur-[6px] ${halo}`} style={{ background: "#9a51ff", opacity: 0.85 }} />
      <span
        className={`absolute rounded-full ${core}`}
        style={{
          background: "#f3e9ff",
          boxShadow: "0 0 5px rgba(233,213,255,0.95), 0 0 12px rgba(178,62,255,0.8), 0 0 22px rgba(154,81,255,0.5)",
        }}
      />
    </span>
  );
}

function NumberBall({ number }: { number: string }) {
  return (
    <div
      className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full sm:size-[72px]"
      style={{
        background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
        boxShadow:
          "0 5px 11px rgba(28,60,142,0.33), inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(0,44,179,0.4)",
      }}
    >
      <span
        className="font-bold text-white"
        style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h5)", lineHeight: 1.3 }}
      >
        {number}
      </span>
    </div>
  );
}

function Check({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/cleanstart-platform/tick-circle.svg"
        alt=""
        aria-hidden
        className="size-6 shrink-0 select-none"
        loading="lazy"
        decoding="async"
      />
      <span
        className="text-white"
        style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-body)", letterSpacing: "-0.01em", lineHeight: 1.3 }}
      >
        {label}
      </span>
    </li>
  );
}

function StageRow({ stage, isLast }: { stage: Stage; isLast: boolean }) {
  return (
    <div className="relative flex items-center gap-4">
      {/* Soft purple glow (Figma 光斑) hugging the spine, behind the ball */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-7 top-1/2 hidden size-56 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen sm:left-9 lg:block"
        style={{ background: "radial-gradient(closest-side, rgba(178,62,255,0.34) 0%, rgba(154,81,255,0.12) 50%, transparent 74%)" }}
      />
      {/* Spine segment — spans this row (and the gap below, except the last) so
          stacked rows form one continuous glowing line through the ball centres. */}
      <GlassLine orientation="v" className={`left-7 w-2.5 -translate-x-1/2 sm:left-9 ${isLast ? "top-0 bottom-1/2" : "top-0 -bottom-6"}`} />
      {/* Ball → card connector stub (Figma Vector) — plugs the ball into the card */}
      <GlassLine orientation="h" className="left-12 top-1/2 h-2.5 w-7 -translate-y-1/2 sm:left-16 sm:w-7" />
      <NumberBall number={stage.number} />
      <div
        className="relative flex flex-1 flex-col gap-4 overflow-hidden rounded-[24px] border border-[#9a51ff] p-6 md:flex-row md:items-center md:gap-8"
        style={{ background: CARD_BG }}
      >
        {/* Right-edge lens flare (Figma "Flare") — a vertically-elongated streak
            hugging the right border, brightest (mint-white) at mid-height and
            blooming only slightly inward. Focal pinned to the card's edge. */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-1/2 h-48 w-40 -translate-y-1/2 mix-blend-screen"
          style={{ background: "radial-gradient(52% 60% at 100% 50%, rgba(178,62,255,0.5) 0%, rgba(154,81,255,0.18) 46%, transparent 72%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-1/2 h-28 w-20 -translate-y-1/2 mix-blend-screen blur-[1px]"
          style={{ background: "radial-gradient(60% 60% at 100% 50%, rgba(233,255,250,0.95) 0%, rgba(201,139,255,0.55) 36%, transparent 72%)" }}
        />
        <div className="relative flex shrink-0 flex-col gap-1.5 md:w-[260px]">
          <h3
            className="font-bold text-white"
            style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)", letterSpacing: "-0.03em", lineHeight: 1.2 }}
          >
            {stage.name}
          </h3>
          <p
            className="font-medium"
            style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h4)", letterSpacing: "-0.02em", lineHeight: 1.2, color: "#b23eff" }}
          >
            {stage.subtitle}
          </p>
          <p
            className="text-white"
            style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", letterSpacing: "-0.01em", lineHeight: 1.3 }}
          >
            {stage.description}
          </p>
        </div>
        <ul className="relative grid flex-1 grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 md:gap-y-4">
          {stage.features.map((feat) => (
            <Check key={feat} label={feat} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PlatformTrustArchitecture() {
  return (
    <section
      aria-label="The CleanStart Trust Architecture"
      className="relative w-full overflow-hidden"
      style={{ background: "linear-gradient(180deg, #151021 0%, #131e8f 62.5%, #471ec0 100%)" }}
    >
      {/* Cyan flare, top-right corner (Figma 光斑) */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-[10%] hidden size-64 translate-x-1/3 rounded-full mix-blend-lighten lg:block"
        style={{ background: "radial-gradient(closest-side, rgba(180,235,255,0.45) 0%, rgba(33,173,250,0.28) 42%, rgba(1,102,204,0.12) 66%, transparent 80%)" }}
      />

      {/* Header */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="mx-auto flex flex-col items-center gap-4 text-center text-white"
          style={{ maxWidth: "949px", paddingTop: "clamp(64px, 6.9vw, 100px)", paddingBottom: "clamp(40px, 4.2vw, 60px)" }}
        >
          <h2
            className="w-full font-bold"
            style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-display)", letterSpacing: "-0.05em", lineHeight: 1.1 }}
          >
            The CleanStart Trust{" "}
            <span
              className="bg-clip-text"
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundImage: "linear-gradient(119deg, #9a51ff 71.3%, #2cc1eb 98.8%)",
              }}
            >
              Architecture
            </span>
          </h2>
          <p
            className="opacity-80"
            style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-lead)", letterSpacing: "-0.04em", lineHeight: 1.4 }}
          >
            AI-native trust reconstruction. Deterministic by design.
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative mx-auto max-w-[920px] px-6 pb-[clamp(64px,6.9vw,100px)] sm:px-10">
        {/* SOURCE CODE card */}
        <div
          className="mx-auto max-w-[560px] rounded-[24px] border border-[#9a51ff] p-3 text-center"
          style={{ background: SOURCE_BG }}
        >
          <p
            className="font-bold text-white"
            style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h3)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
          >
            SOURCE CODE
          </p>
          <p
            className="mt-1.5 text-white"
            style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", letterSpacing: "-0.01em", lineHeight: 1.3 }}
          >
            Verified repositories and trusted upstream software sources.
          </p>
        </div>

        {/* Connector elbow: drop from source centre, turn left to the spine.
            The glassy lines carry a flare burst at the source junction. */}
        <div className="relative h-16" aria-hidden>
          {/* Flare burst + streak where the line leaves the SOURCE CODE card */}
          <span
            className="absolute left-1/2 top-0 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
            style={{ background: "radial-gradient(closest-side, rgba(243,232,255,0.95) 0%, rgba(178,62,255,0.5) 40%, transparent 70%)" }}
          />
          <span
            className="absolute left-1/2 top-0 h-1.5 w-72 max-w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[2px] mix-blend-screen"
            style={{ background: "linear-gradient(90deg, transparent 0%, rgba(233,213,255,0.9) 50%, transparent 100%)" }}
          />
          {/* drop (centre) → turn left → down into the spine */}
          <GlassLine orientation="v" className="left-1/2 top-0 h-9 w-2.5 -translate-x-1/2" />
          <GlassLine orientation="h" className="left-7 right-1/2 top-9 h-2.5 -translate-y-1/2 sm:left-9" />
          <GlassLine orientation="v" className="left-7 top-9 bottom-0 w-2.5 -translate-x-1/2 sm:left-9" />
        </div>

        {/* Stage rows */}
        <div className="flex flex-col gap-6">
          {STAGES.map((stage, i) => (
            <StageRow key={stage.name} stage={stage} isLast={i === STAGES.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
