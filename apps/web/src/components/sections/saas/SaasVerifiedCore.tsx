import type React from 'react';
import styles from './SaasVerifiedCore.module.css';

/*
 * "Move Beyond Shift Left" diagram.
 *
 * The claim: security is not a gate at the end of delivery, it arrives with the
 * components you start from. So Verified Components sits above and left of the
 * pipeline and joins it through a curve ahead of Code — visibly a separate
 * thing merging in, not the first box in a row. From that junction on it is one
 * pipeline in one neutral treatment: Code, Build, Test, Deploy, Security
 * Review, and the trusted release they produce. Green is rationed to what the
 * verified components bring, and to the release that inherits it.
 *
 * The sequence: the hub locks, the merge curve draws down into the rail, the
 * rail fills, each stage lights and stays marked as the front crosses it, and
 * the release resolves. Then it holds and repeats.
 *
 * GEOMETRY IS LOAD-BEARING. A stage lights on POSITION, so the rail runs on a
 * fixed pitch and these constants are the same ones the stylesheet uses. Two
 * bugs came from breaking that: `flex: 1` let the rail grow past its declared
 * width, and `space-between` made stage positions depend on the container.
 * Both desynchronised the halos from the fill.
 */

type StageId = 'code' | 'build' | 'test' | 'deploy' | 'review' | 'release';

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
  { id: 'release', label: 'Trusted Release' },
];

/* Must match .railWrap in the stylesheet. */
const NODE_W = 104;
const NODE_GAP = 6;

/*
 * The line does NOT span the whole node row. It starts at the row's left edge,
 * so there is a lead-in from the merge junction to Code, and it stops dead on
 * the last node's CENTRE. Run to the row's right edge instead and ~22px of rail
 * hangs off the end of Trusted Release with nothing to arrive at.
 *
 * Both halves of that decision live here: the stylesheet insets the line by
 * half a node on the right, and the fractions below are measured against the
 * same shortened span. So stage 5 sits at exactly 1.0 and the fill completes on
 * the release rather than past it.
 */
const railSpan = (nodeW: number, gap: number): number =>
  STAGES.length * nodeW + (STAGES.length - 1) * gap - nodeW / 2;

/** Centre of stage i along the horizontal rail, as a 0..1 fraction. */
const fracH = (i: number): number =>
  (i * (NODE_W + NODE_GAP) + NODE_W / 2) / railSpan(NODE_W, NODE_GAP);

/* Stacked: tile 60 + gap 11 + label 16.25 + underline 9, measured. */
const NODE_H = 96;
const NODE_GAP_V = 24;

/** Centre of stage i along the vertical rail, as a 0..1 fraction. */
const fracV = (i: number): number =>
  (i * (NODE_H + NODE_GAP_V) + NODE_H / 2) / railSpan(NODE_H, NODE_GAP_V);

export function SaasVerifiedCore(): React.ReactElement {
  return (
    <div className={styles.stage}>
      <div aria-hidden="true" className={styles.deck}>
        <span className={styles.deckGlow} />

        <div className={styles.diagram}>
          <div data-verified-source="verified-components" className={styles.hub}>
            <span className={styles.hubTile}>
              <span className={styles.hubRing} />
              <HubMark />
            </span>
            <span className={styles.hubLabel}>Verified Components</span>
          </div>

          <svg
            data-trust-ribbon="continuous"
            className={styles.merge}
            viewBox="0 0 92 52"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className={styles.mergeTrack} d="M2 2 C 48 2, 44 50, 90 50" />
            <path className={styles.mergeFlow} d="M2 2 C 48 2, 44 50, 90 50" />
          </svg>

          <div className={styles.railWrap}>
            <span className={styles.railBase} />
            <span className={styles.railFill} />
            <span className={styles.junction} />

            {STAGES.map((stage, i) => (
              <div
                key={stage.id}
                className={`${styles.node} ${stage.id === 'release' ? styles.nodeRelease : ''}`}
                style={
                  {
                    '--frac': fracH(i).toFixed(4),
                    '--frac-v': fracV(i).toFixed(4),
                  } as React.CSSProperties
                }
                {...(stage.id === 'release'
                  ? { 'data-release-exit': 'approved' }
                  : stage.id === 'review'
                    ? { 'data-security-review': 'open' }
                    : { 'data-core-stage': stage.id })}
              >
                <span className={styles.tile}>
                  <span className={styles.tileHalo} />
                  <StageIcon stage={stage.id} />
                </span>
                <span className={styles.label}>{stage.label}</span>
                <span className={styles.underline} />
              </div>
            ))}
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
    case 'release':
      return (
        <svg {...props}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
          <path d="M3.5 9h17" />
          <path d="m9.5 14 2 2 4.5-4.5" />
        </svg>
      );
  }
}

/*
 * The seal on the incoming components.
 *
 * A hexagon, because in developer tooling that shape already means package or
 * module — and because every pipeline stage is a rounded square, so the thing
 * arriving from outside should not share their silhouette. Inside it, stacked
 * plates: a component is layers, not a single object. Around it, a dashed orbit
 * that never stops turning, since verification is continuous rather than a
 * state something was left in. The badge is the attestation, and it is a badge
 * ON the component rather than the whole mark, which is the actual claim.
 */
function HubMark(): React.ReactElement {
  return (
    <svg className={styles.hubMark} viewBox="0 0 76 76" fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id="cs-hub-plate"
          x1="38"
          y1="14"
          x2="38"
          y2="62"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#6BF0C4" />
          <stop offset="1" stopColor="#16B47E" />
        </linearGradient>
      </defs>

      <g className={styles.hubOrbit}>
        <circle className={styles.hubOrbitRing} cx="38" cy="38" r="32.5" />
        <circle className={styles.hubSat} cx="38" cy="5.5" r="2.3" />
        <circle className={styles.hubSat} cx="66.15" cy="54.25" r="2.3" />
        <circle className={styles.hubSat} cx="9.85" cy="54.25" r="2.3" />
      </g>

      <polygon
        className={styles.hubPlate}
        points="38,14 17.22,26 17.22,50 38,62 58.78,50 58.78,26"
        fill="url(#cs-hub-plate)"
      />

      <g className={styles.hubGlyph}>
        <path d="m38 29 9 4.5-9 4.5-9-4.5 9-4.5Z" />
        <path d="m29 38 9 4.5 9-4.5" />
        <path d="m29 42.5 9 4.5 9-4.5" />
      </g>

      <g className={styles.hubBadge}>
        <circle className={styles.hubBadgeDisc} cx="60.5" cy="57.5" r="9.5" />
        <path className={styles.hubBadgeTick} d="m56.2 57.7 3 3 5.6-6.2" />
      </g>
    </svg>
  );
}
