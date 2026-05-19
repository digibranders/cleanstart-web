/**
 * CSS-only animated audio waveform. Each bar pulses with a scaleY animation, and the
 * animation-delay is a function of the bar index so the wave travels horizontally — like
 * a real audio signal "playing through" left-to-right and back.
 *
 * Bar heights combine two sines (fast + slow) plus a slight DC offset, so the silhouette
 * looks like a real waveform with peaks, valleys, and quieter regions instead of a tidy
 * sine. The vertical fill is a multi-stop gradient (sky → indigo → deep purple) that
 * gives the bars a sense of depth.
 */

const BAR_COUNT = 88;
const BAR_WIDTH_PX = 3;
const MIN_BAR_HEIGHT = 6;
const MAX_BAR_HEIGHT = 110;
const ANIMATION_DURATION_S = 2.4;
const TRAVEL_CYCLES = 1.5; // how many full waves fit across the bar count

const BAR_GRADIENT =
  "linear-gradient(180deg, #b9c8ff 0%, #7e9bff 22%, #5a3df0 55%, #3614aa 80%, #1f0d6e 100%)";

function barHeight(i: number): number {
  // Combine two sines at different frequencies — the result has natural-looking
  // peaks and quieter sections without obvious periodicity.
  const slow = Math.sin(i * 0.18) * 0.55;
  const fast = Math.sin(i * 0.72 + 1.3) * 0.35;
  const burst = Math.sin(i * 0.045) * 0.25 + 0.6; // overall envelope
  const t = (slow + fast) * burst + 0.5; // 0..1ish
  const clamped = Math.max(0.06, Math.min(1, Math.abs(t)));
  return MIN_BAR_HEIGHT + clamped * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT);
}

export function Waveform(): React.ReactElement {
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const h = barHeight(i);
    // animation-delay sweeps from 0 to -duration so all bars are in different phases.
    // The (i * TRAVEL_CYCLES / BAR_COUNT) factor sets how many wave-fronts ride across.
    const phase = (i * TRAVEL_CYCLES) / BAR_COUNT;
    const delay = -(phase * ANIMATION_DURATION_S);
    return { i, h, delay };
  });

  return (
    <div
      aria-hidden
      className="podcast-waveform pointer-events-none absolute inset-x-0 flex items-center justify-between"
      style={{
        bottom: 0,
        transform: "translateY(50%)",
        height: `${MAX_BAR_HEIGHT}px`,
        paddingInline: "16px",
      }}
    >
      {bars.map(({ i, h, delay }) => (
        <span
          key={i}
          className="podcast-waveform__bar"
          style={{
            width: `${BAR_WIDTH_PX}px`,
            height: `${h}px`,
            background: BAR_GRADIENT,
            borderRadius: "999px",
            transformOrigin: "center",
            animationDelay: `${delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes podcastWaveformPulse {
          0%, 100% { transform: scaleY(0.42); opacity: 0.85; }
          50%      { transform: scaleY(1);    opacity: 1; }
        }
        @media (prefers-reduced-motion: no-preference) {
          .podcast-waveform__bar {
            animation: podcastWaveformPulse ${ANIMATION_DURATION_S}s ease-in-out infinite;
            will-change: transform, opacity;
          }
        }
      `}</style>
    </div>
  );
}
