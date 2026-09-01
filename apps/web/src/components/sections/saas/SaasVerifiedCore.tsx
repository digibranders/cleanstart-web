import type React from 'react';
import styles from './SaasVerifiedCore.module.css';

/*
 * "Move Beyond Shift Left" diagram.
 *
 * A standard delivery pipeline — Code, Build, Test, Deploy, Security Review —
 * with Verified Components arriving from the LEFT as a separate piece and
 * docking into it. Everything from the junction rightwards is one pipeline and
 * is styled identically, so the eye reads a single track rather than six
 * competing objects. Green belongs to the incoming components, to the junction
 * they lock into, and to the assurance that then travels the track. Nothing else
 * is green.
 *
 * ONE container, not three. The version this replaces nested an outer surface, a
 * route stack and a per-stage housing, each with its own border and background,
 * which is what made it read as boxes inside boxes. There is a single deck now,
 * and the stages sit directly on it.
 *
 * Rendered ONCE, not twice. The previous component emitted a full desktop
 * diagram and a full mobile diagram side by side, so every icon existed twice in
 * the DOM. Orientation is a CSS concern, so the single tree flips from a row to
 * a column at the breakpoint instead.
 *
 * The whole diagram is aria-hidden: SaasShiftLeft renders the same sequence as
 * an ordered list, which is a better reading of a pipeline than a row of
 * decorative tiles.
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
 * One shared cycle drives every part of the sequence, and each part carries its
 * own delay rather than its own duration. Same period everywhere is what keeps
 * the arrival, the lock, the travelling pulse and the release from drifting out
 * of phase over time — with mixed durations they resynchronise only at the
 * lowest common multiple, which looks like a fault.
 *
 * Order: the component arrives, locks at the junction, its assurance travels
 * stage to stage, and the release is approved. Then it holds and repeats.
 */
const DOCK_MS = 900;
const STEP_MS = 420;
const TRAVEL_MS = 700;

const linkDelay = (i: number): string => `${DOCK_MS + i * STEP_MS}ms`;
const stageLitDelay = (i: number): string => `${DOCK_MS + i * STEP_MS + TRAVEL_MS - 120}ms`;

export function SaasVerifiedCore(): React.ReactElement {
  return (
    <div className={styles.stage}>
      <div aria-hidden="true" className={styles.deck}>
        <span className={styles.deckGrid} />
        <span className={styles.deckSheen} />
        <span className={`${styles.corner} ${styles.cornerTl}`} />
        <span className={`${styles.corner} ${styles.cornerTr}`} />
        <span className={`${styles.corner} ${styles.cornerBl}`} />
        <span className={`${styles.corner} ${styles.cornerBr}`} />

        <div className={styles.track}>
          {/* Arrives from the left and docks. It is the only element that moves
              in space; everything else responds to it. */}
          <div data-verified-source="verified-components" className={styles.source}>
            <span className={styles.sourceTile}>
              <CheckIcon />
              <span className={styles.sourceRing} />
            </span>
            <span className={styles.sourceLabel}>
              Verified
              <br />
              Components
            </span>
          </div>

          <span
            data-trust-ribbon="continuous"
            className={`${styles.link} ${styles.linkMerge}`}
            style={{ ['--flow-delay' as string]: linkDelay(0) }}
          >
            <span className={styles.junction} />
          </span>

          {STAGES.map((stage, i) => (
            <div className={styles.segment} key={stage.id}>
              <div
                className={styles.node}
                {...(stage.id === 'review'
                  ? { 'data-security-review': 'open' }
                  : { 'data-core-stage': stage.id })}
              >
                <span className={styles.tile}>
                  <StageIcon stage={stage.id} />
                  <span
                    className={styles.tileDot}
                    style={{ ['--lit-delay' as string]: stageLitDelay(i) }}
                  />
                </span>
                <span className={styles.label}>{stage.label}</span>
              </div>

              {i < STAGES.length - 1 && (
                <span
                  className={styles.link}
                  style={{ ['--flow-delay' as string]: linkDelay(i + 1) }}
                />
              )}
            </div>
          ))}

          <span
            data-release-exit="approved"
            className={`${styles.link} ${styles.linkExit}`}
            style={{ ['--flow-delay' as string]: linkDelay(STAGES.length) }}
          >
            <span className={styles.exitCheck}>
              <CheckIcon />
            </span>
          </span>
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
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
