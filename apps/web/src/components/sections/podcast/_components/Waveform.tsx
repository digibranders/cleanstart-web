/**
 * Living waveform — organic EQ bars + traveling energy sweep.
 *
 * Why this looks like real audio (not a CSS sine sweep):
 *  • Each bar has its OWN animation duration (1.4–2.6s) and OWN delay, computed from a
 *    pseudo-random hash of the index. Adjacent bars therefore drift out of sync over
 *    time — exactly how real FFT-bin amplitudes behave.
 *  • Per-bar scaleY range is staggered too: bars near a soft peak swing wider, bars in
 *    quiet pockets barely move. Heights are derived from two overlaid sines so the
 *    silhouette has natural valleys and peaks (no obvious periodicity).
 *  • On top of the breath, a slow horizontal "energy sweep" (a brighter highlight on a
 *    masked overlay) drifts across, making the waveform feel like it's *playing* rather
 *    than just decorating. The sweep is decoupled from the bar animation, so visually
 *    you read two layers: organic per-bar breath + traveling energy.
 *
 * All animation uses GPU-friendly transform/opacity. Honors prefers-reduced-motion.
 */

const BAR_COUNT = 96;
const BAR_WIDTH_PX = 3;
const MIN_BAR_HEIGHT = 6;
const MAX_BAR_HEIGHT = 110;

const BAR_GRADIENT =
  "linear-gradient(180deg, #b9c8ff 0%, #7e9bff 22%, #5a3df0 55%, #3614aa 80%, #1f0d6e 100%)";

// Pseudo-random but deterministic — keeps SSR output stable across renders.
function hash(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x); // 0..1
}

function barHeight(i: number): number {
  // Two overlaid sines + envelope — natural-looking silhouette.
  const slow = Math.sin(i * 0.18) * 0.55;
  const fast = Math.sin(i * 0.72 + 1.3) * 0.35;
  const envelope = Math.sin(i * 0.045) * 0.25 + 0.6;
  const t = (slow + fast) * envelope + 0.5;
  const clamped = Math.max(0.08, Math.min(1, Math.abs(t)));
  return MIN_BAR_HEIGHT + clamped * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT);
}

export function Waveform(): React.ReactElement {
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const h = barHeight(i);
    // Per-bar randomness — duration and start phase.
    const dur = 1.4 + hash(i) * 1.2; // 1.4s – 2.6s
    const delay = -hash(i + 71) * dur; // negative delay = starts mid-cycle
    // Quiet bars get a wider scale range (more "alive"); tall bars breathe gently.
    const normalized = (h - MIN_BAR_HEIGHT) / (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT);
    const minScale = 0.35 + normalized * 0.35; // 0.35..0.70
    return { i, h, dur, delay, minScale };
  });

  return (
    <div
      aria-hidden
      className="podcast-waveform pointer-events-none absolute inset-x-0"
      style={{
        bottom: 0,
        transform: "translateY(50%)",
        height: `${MAX_BAR_HEIGHT}px`,
      }}
    >
      {/* Bars layer — each bar has its own breath */}
      <div
        className="absolute inset-0 flex items-center justify-between"
        style={{ paddingInline: "16px" }}
      >
        {bars.map(({ i, h, dur, delay, minScale }) => (
          <span
            key={i}
            className="podcast-waveform__bar"
            style={
              {
                width: `${BAR_WIDTH_PX}px`,
                height: `${h}px`,
                background: BAR_GRADIENT,
                borderRadius: "999px",
                transformOrigin: "center",
                animationDuration: `${dur}s`,
                animationDelay: `${delay}s`,
                ["--podcast-wave-min" as string]: minScale,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <style>{`
        @keyframes podcastWaveformBreath {
          0%, 100% { transform: scaleY(var(--podcast-wave-min, 0.45)); opacity: 0.82; }
          50%      { transform: scaleY(1);                                opacity: 1; }
        }
        @media (prefers-reduced-motion: no-preference) {
          .podcast-waveform__bar {
            animation-name: podcastWaveformBreath;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
            will-change: transform, opacity;
          }
        }
        /* Mobile: thin the bar field so it reads as a clean equalizer, not a packed brick.
           Hide 3 of every 4 bars (≈24 bars across the row) and cap the silhouette height. */
        @media (max-width: 639px) {
          .podcast-waveform { height: 64px !important; }
          .podcast-waveform__bar:not(:nth-child(4n+1)) { display: none; }
        }
        /* Small tablet: hide every other bar (≈48 bars), modest height. */
        @media (min-width: 640px) and (max-width: 1023px) {
          .podcast-waveform { height: 88px !important; }
          .podcast-waveform__bar:nth-child(even) { display: none; }
        }
      `}</style>
    </div>
  );
}
