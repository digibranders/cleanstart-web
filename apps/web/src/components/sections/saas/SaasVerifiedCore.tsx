import type React from 'react';
import styles from './SaasVerifiedCore.module.css';

/*
 * "Move Beyond Shift Left" diagram.
 *
 * The claim: security is not a gate at the end of delivery, it arrives with the
 * components you start from. So Verified Components sits ABOVE and LEFT of the
 * pipeline and joins it through a curve, ahead of Code — it is visibly a
 * separate thing merging in, not simply the first box in a row. Everything from
 * that junction onward is one pipeline in one neutral treatment, and the
 * assurance it brings then fills the whole rail.
 *
 * What went wrong in the version before this, all of it visible only once
 * rendered at full width:
 *
 *   - The container was 1360x160 of mostly empty space with a thin strip of
 *     content adrift in it. The deck is now capped and hugs its contents.
 *   - Two node grammars in one row: the source was a circle with its label
 *     beside it, the stages were tiles with labels beneath. Nothing shared a
 *     baseline. Every node now has identical anatomy — tile, then label.
 *   - `flex: 1` connectors stretched across the full width, so the pipeline read
 *     as scattered dots rather than a track. One continuous rail runs behind the
 *     stages now, and it cannot be pulled apart by the container's width.
 *   - "Security Review" wrapped to two lines while every other label was one,
 *     leaving a ragged bottom edge. Node width now fits the longest label.
 *
 * Rendered once. Orientation is a CSS concern: the row becomes a column at the
 * breakpoint rather than a second copy of the markup being emitted.
 *
 * The diagram is aria-hidden. SaasShiftLeft renders the same sequence as an
 * ordered list, which is a better reading of a pipeline than a row of tiles.
 */

type StageId = 'code' | 'build' | 'test' | 'deploy' | 'review';

interface Stage {
  readonly id: StageId;
  readonly label: string;
}

const STAGES: readonly Stage[] = [
  { id: 'code', label: 'Code' },
  { id: 'build', label: 'Build' },
  { id: 'test', label: 'Test' },
  { id: 'deploy', label: 'Deploy' },
  { id: 'review', label: 'Security Review' },
];

/*
 * One clock. Every part of the sequence shares --cycle and differs only by
 * delay: mixed durations resynchronise at their lowest common multiple, which
 * reads as a fault rather than a loop.
 *
 * The rail FILLS rather than passing a dot along it. The claim is that the
 * pipeline becomes verified, not that something travels through it, and a fill
 * says that where a moving pulse does not.
 */
const CYCLE_MS = 6500;
/* The rail fill runs from 22% to 74% of the cycle. A stage lights when the fill
   reaches it, so its delay is the fill's start plus its own share of that span.
   Computed rather than hand-tuned: percentages cannot be interpolated into
   keyframe stops, so the timing has to live in the delay. */
const FILL_START = 0.22;
const FILL_SPAN = 0.52;
const haloDelay = (i: number, total: number): string =>
  `${Math.round(CYCLE_MS * (FILL_START + ((i + 0.5) / total) * FILL_SPAN))}ms`;

export function SaasVerifiedCore(): React.ReactElement {
  return (
    <div className={styles.stage}>
      <div aria-hidden="true" className={styles.deck}>
        <span className={styles.deckGlow} />

        <div className={styles.diagram}>
          {/* The piece that merges in: raised above the rail, joined by a curve. */}
          <div data-verified-source="verified-components" className={styles.source}>
            <span className={styles.sourceTile}>
              <span className={styles.sourceRing} />
              <CheckIcon />
            </span>
            <span className={styles.sourceLabel}>Verified Components</span>
          </div>

          <svg
            data-trust-ribbon="continuous"
            className={styles.merge}
            viewBox="0 0 104 52"
            fill="none"
            preserveAspectRatio="none"
          >
            <title>Verified components joining the pipeline</title>
            <path className={styles.mergeTrack} d="M2 2 C 54 2, 50 50, 102 50" />
            <path className={styles.mergeFlow} d="M2 2 C 54 2, 50 50, 102 50" />
          </svg>

          <div className={styles.railWrap}>
            <span className={styles.railBase} />
            <span className={styles.railFill} />
            <span className={styles.junction} />

            {STAGES.map((stage, i) => (
              <div
                key={stage.id}
                className={styles.node}
                style={{ ['--halo-delay' as string]: haloDelay(i, STAGES.length) }}
                {...(stage.id === 'review'
                  ? { 'data-security-review': 'open' }
                  : { 'data-core-stage': stage.id })}
              >
                <span className={styles.tile}>
                  <span className={styles.tileHalo} />
                  <StageIcon stage={stage.id} />
                </span>
                <span className={styles.label}>{stage.label}</span>
              </div>
            ))}

            <span data-release-exit="approved" className={styles.exit}>
              <CheckIcon />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StageIcon({ stage }: { readonly stage: StageId }): React.ReactElement {
  const props = {
    'aria-hidden': true,
    className: styles.icon,
    'data-stage-icon': stage,
    fill: 'none',
    viewBox: '0 0 24 24',
  } as const;

  switch (stage) {
    case 'code':
      return (
        <svg {...props}>
          <path d="M8 6.5 3 12l5 5.5M16 6.5l5 5.5-5 5.5M14.5 4 9.5 20" />
        </svg>
      );
    case 'build':
      return (
        <svg {...props}>
          <path d="m12 3 8.5 4.75L12 12.5 3.5 7.75 12 3Z" />
          <path d="M3.5 7.75v8.5L12 21l8.5-4.75v-8.5M12 12.5V21" />
        </svg>
      );
    case 'test':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m7.75 12.25 2.65 2.65 5.85-6" />
        </svg>
      );
    case 'deploy':
      return (
        <svg {...props}>
          <path d="M12 16V4M7.5 8.5 12 4l4.5 4.5M5 15v5h14v-5" />
        </svg>
      );
    case 'review':
      return (
        <svg {...props}>
          <path d="M12 3.2 19 6v5.4c0 4.2-3.1 7.4-7 8.4-3.9-1-7-4.2-7-8.4V6l7-2.8Z" />
          <path d="m9 11.8 2.1 2.1 4.2-4.4" />
        </svg>
      );
  }
}

function CheckIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 L8.1 14.4 L16 5.8"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
