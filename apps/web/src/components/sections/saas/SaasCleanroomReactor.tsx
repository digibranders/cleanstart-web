import type React from 'react';
import styles from './SaasCleanroomReactor.module.css';

type ReactorLayerId = 'code' | 'build' | 'test' | 'deploy';

interface ReactorLayer {
  readonly id: ReactorLayerId;
  readonly label: 'Code' | 'Build' | 'Test' | 'Deploy';
}

interface LayerProps {
  readonly layer: ReactorLayer;
  readonly index: number;
}

const REACTOR_LAYERS: readonly ReactorLayer[] = [
  { id: 'code', label: 'Code' },
  { id: 'build', label: 'Build' },
  { id: 'test', label: 'Test' },
  { id: 'deploy', label: 'Deploy' },
];

export function SaasCleanroomReactor(): React.ReactElement {
  return (
    <div className={styles.stage}>
      <DesktopReactor />
      <MobileReactor />
    </div>
  );
}

function DesktopReactor(): React.ReactElement {
  return (
    <svg
      data-cleanroom-reactor="desktop"
      aria-hidden="true"
      className={styles.desktopReactor}
      viewBox="0 0 1240 620"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
    >
      <DesktopDefinitions />
      <rect x="1" y="1" width="1238" height="618" rx="34" fill="url(#cs-reactor-stage)" />
      <rect
        x="1"
        y="1"
        width="1238"
        height="618"
        rx="34"
        stroke="url(#cs-reactor-border)"
        strokeWidth="1.5"
      />
      {/* No full-width frame rules. They were inset symmetrically for a shorter
          perimeter (y=72 and y=553 against a card of 1..619), but the perimeter
          now runs to y=574, so the lower rule sliced straight through its
          bevelled bottom corners. Moving it clear would need y~590, which puts
          it 29 from the card edge against its twin's 71 and reads as a stray
          line. The card border and gradient already frame the composition. */}
      <path d="M77 36 H176" stroke="rgba(138,190,247,0.28)" strokeDasharray="4 8" />
      <path d="M1060 36 H1164" stroke="rgba(138,190,247,0.28)" strokeDasharray="4 8" />
      <FloorGrid />
      <VerifiedSource />
      <IntakeConduit />
      <ReactorChamber />
      <SecurityPerimeter />
      <RejectedLateArtifact />
    </svg>
  );
}

function DesktopDefinitions(): React.ReactElement {
  return (
    <defs>
      <linearGradient id="cs-reactor-stage" x1="40" y1="20" x2="1170" y2="602">
        <stop stopColor="#101A35" />
        <stop offset="0.5" stopColor="#070C1C" />
        <stop offset="1" stopColor="#071827" />
      </linearGradient>
      <linearGradient id="cs-reactor-border" x1="0" y1="0" x2="1240" y2="620">
        <stop stopColor="rgba(170,205,255,0.34)" />
        <stop offset="0.48" stopColor="rgba(105,149,228,0.12)" />
        <stop offset="1" stopColor="rgba(154,81,255,0.3)" />
      </linearGradient>
      <linearGradient id="cs-reactor-shell" x1="330" y1="96" x2="928" y2="548">
        <stop stopColor="rgba(70,111,191,0.25)" />
        <stop offset="0.5" stopColor="rgba(10,25,51,0.56)" />
        <stop offset="1" stopColor="rgba(60,60,160,0.19)" />
      </linearGradient>
      <linearGradient id="cs-reactor-plate" x1="410" y1="0" x2="890" y2="0">
        <stop stopColor="rgba(45,117,174,0.28)" />
        <stop offset="0.48" stopColor="rgba(44,193,235,0.2)" />
        <stop offset="1" stopColor="rgba(29,93,132,0.12)" />
      </linearGradient>
      <linearGradient id="cs-reactor-plate-edge" x1="420" y1="0" x2="900" y2="0">
        <stop stopColor="#5AA9E6" stopOpacity="0.34" />
        <stop offset="0.56" stopColor="#7FE3FF" stopOpacity="0.9" />
        <stop offset="1" stopColor="#4C8FD8" stopOpacity="0.32" />
      </linearGradient>
      <linearGradient id="cs-reactor-intake" x1="164" y1="0" x2="365" y2="0">
        <stop stopColor="#7FE3FF" stopOpacity="0.92" />
        <stop offset="1" stopColor="#9A51FF" stopOpacity="0.46" />
      </linearGradient>
      <linearGradient id="cs-reactor-scan" x1="0" y1="0" x2="0" y2="80">
        <stop stopColor="#7FE3FF" stopOpacity="0" />
        <stop offset="0.48" stopColor="#7FE3FF" stopOpacity="0.42" />
        <stop offset="0.52" stopColor="#E8FBFF" stopOpacity="0.9" />
        <stop offset="1" stopColor="#7FE3FF" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="cs-reactor-reject-halo" cx="50%" cy="50%" r="50%">
        <stop stopColor="rgba(255,107,107,0.24)" />
        <stop offset="0.55" stopColor="rgba(255,107,107,0.08)" />
        <stop offset="1" stopColor="rgba(255,107,107,0)" />
      </radialGradient>
      <radialGradient id="cs-reactor-reject-core" cx="50%" cy="38%" r="65%">
        <stop stopColor="#FFD0D5" />
        <stop offset="0.35" stopColor="#FF9DA8" />
        <stop offset="1" stopColor="#E0566B" />
      </radialGradient>
      <radialGradient id="cs-reactor-halo" cx="50%" cy="50%" r="50%">
        <stop stopColor="rgba(44,193,235,0.30)" />
        <stop offset="0.55" stopColor="rgba(44,193,235,0.10)" />
        <stop offset="1" stopColor="rgba(44,193,235,0)" />
      </radialGradient>
      <radialGradient id="cs-reactor-core" cx="50%" cy="38%" r="65%">
        <stop stopColor="#EAFBFF" />
        <stop offset="0.35" stopColor="#7FE3FF" />
        <stop offset="1" stopColor="#2CC1EB" />
      </radialGradient>
      <filter id="cs-reactor-cyan-glow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="10" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="cs-reactor-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="18" />
      </filter>
      <filter id="cs-reactor-coral-glow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="7" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <pattern id="cs-reactor-grid" width="42" height="42" patternUnits="userSpaceOnUse">
        <path d="M42 0 H0 V42" stroke="rgba(148,182,232,0.08)" strokeWidth="1" />
      </pattern>
      <clipPath id="cs-reactor-chamber-clip">
        <path d="M376 128 L842 128 L922 188 V482 L842 542 H376 L316 486 V184 Z" />
      </clipPath>
    </defs>
  );
}

function FloorGrid(): React.ReactElement {
  return (
    <g opacity="0.62">
      <path d="M48 540 L1192 540 L1052 430 H192 Z" fill="url(#cs-reactor-grid)" />
      <path d="M48 540 L1192 540" stroke="rgba(99,191,217,0.14)" />
      <path d="M192 430 H1052" stroke="rgba(99,191,217,0.08)" />
      <path d="M620 430 V540" stroke="rgba(127,227,255,0.08)" />
    </g>
  );
}

function VerifiedSource(): React.ReactElement {
  return (
    <g data-reactor-source="verified-components" className={styles.sourcePulse}>
      {/* Halo, as a radial falloff rather than flat-filled ellipses. Two solid
          ellipses plus a blur-merge filter on the opaque core below rendered as
          a hard-edged disc that swallowed both the hexagon and its label. */}
      <ellipse cx="140" cy="318" rx="104" ry="110" fill="url(#cs-reactor-halo)" />
      <path
        d="M140 229 L206 267 V343 L140 381 L74 343 V267 Z"
        fill="rgba(12,38,57,0.96)"
        stroke="rgba(127,227,255,0.46)"
        strokeWidth="2"
      />
      <path d="M140 247 L190 276 V334 L140 363 L90 334 V276 Z" fill="url(#cs-reactor-core)" />
      <path
        d="M116 305 L135 324 L169 286"
        stroke="#0B1F3A"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M99 270 L140 247 L181 270" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
      <text x="140" y="452" textAnchor="middle" className={styles.sourceLabel}>
        Verified Components
      </text>
    </g>
  );
}

function IntakeConduit(): React.ReactElement {
  return (
    <g>
      <path
        d="M207 306 H282 L330 342"
        stroke="rgba(92,155,190,0.18)"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <path
        d="M207 306 H282 L330 342"
        stroke="url(#cs-reactor-intake)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="8 8"
        className={styles.intakeFlow}
      />
      <circle cx="246" cy="306" r="4" fill="#BFF3FF" className={styles.intakeParticle} />
      <circle cx="290" cy="312" r="3" fill="#7FE3FF" className={styles.intakeParticleSecondary} />
    </g>
  );
}

function ReactorChamber(): React.ReactElement {
  return (
    <g data-reactor-chamber="application">
      <path
        d="M376 128 L842 128 L922 188 V482 L842 542 H376 L316 486 V184 Z"
        fill="url(#cs-reactor-shell)"
        stroke="rgba(144,184,242,0.2)"
        strokeWidth="1.5"
      />
      <path
        d="M376 128 L842 128 L922 188 L842 210 H394 L316 184 Z"
        fill="rgba(70,116,187,0.13)"
        stroke="rgba(149,192,247,0.17)"
      />
      <path d="M376 128 V542" stroke="rgba(135,180,236,0.16)" />
      <path d="M842 128 V542" stroke="rgba(135,180,236,0.16)" />
      <path d="M316 184 L394 210 V510" stroke="rgba(135,180,236,0.11)" />
      <path d="M922 188 L842 210" stroke="rgba(135,180,236,0.11)" />
      <g clipPath="url(#cs-reactor-chamber-clip)">
        <rect
          x="326"
          y="104"
          width="596"
          height="470"
          fill="url(#cs-reactor-grid)"
          opacity="0.45"
        />
        <rect
          x="328"
          y="115"
          width="590"
          height="88"
          fill="url(#cs-reactor-scan)"
          className={styles.scanBeam}
        />
        <path
          d="M560 457 V211"
          stroke="rgba(127,227,255,0.14)"
          strokeWidth="38"
          strokeLinecap="round"
          filter="url(#cs-reactor-soft-glow)"
        />
        <path
          d="M560 457 V211"
          stroke="rgba(191,243,255,0.7)"
          strokeWidth="3"
          strokeDasharray="7 12"
          strokeLinecap="round"
          className={styles.energyColumn}
        />
        {REACTOR_LAYERS.map((layer, index) => (
          <DesktopLayer key={layer.id} layer={layer} index={index} />
        ))}
      </g>
      <path
        d="M376 128 L842 128 L922 188 V482 L842 542 H376 L316 486 V184 Z"
        stroke="rgba(197,221,255,0.09)"
        strokeWidth="8"
      />
      <circle cx="338" cy="207" r="4" fill="#7FE3FF" opacity="0.5" />
      <circle cx="900" cy="211" r="4" fill="#7FE3FF" opacity="0.5" />
      <circle cx="338" cy="464" r="4" fill="#7FE3FF" opacity="0.5" />
      <circle cx="900" cy="462" r="4" fill="#7FE3FF" opacity="0.5" />
    </g>
  );
}

function DesktopLayer({ layer, index }: LayerProps): React.ReactElement {
  const y = 473 - index * 82;
  const animationClass = getLayerAnimationClass(layer.id);

  return (
    <g data-reactor-layer={layer.id} className={`${styles.layerPlate} ${animationClass}`}>
      <path
        d={`M404 ${y} L807 ${y} L872 ${y - 31} L468 ${y - 31} Z`}
        fill="url(#cs-reactor-plate)"
        stroke="url(#cs-reactor-plate-edge)"
        strokeWidth="1.5"
      />
      <path
        d={`M404 ${y} L468 ${y - 31} M807 ${y} L872 ${y - 31}`}
        stroke="rgba(127,227,255,0.2)"
      />
      <circle cx="560" cy={y - 16} r="17" fill="rgba(9,35,53,0.92)" stroke="#7FE3FF" />
      <circle cx="560" cy={y - 16} r="5" fill="#BFF3FF" filter="url(#cs-reactor-cyan-glow)" />
      <text x="700" y={y - 11} textAnchor="middle" className={styles.layerLabel}>
        {layer.label}
      </text>
    </g>
  );
}

function getLayerAnimationClass(layer: ReactorLayerId): string {
  switch (layer) {
    case 'code':
      return styles.layerCode ?? '';
    case 'build':
      return styles.layerBuild ?? '';
    case 'test':
      return styles.layerTest ?? '';
    case 'deploy':
      return styles.layerDeploy ?? '';
  }
}

function SecurityPerimeter(): React.ReactElement {
  return (
    <>
      <g data-security-review="perimeter" className={styles.securityPerimeter}>
        <path
          d="M352 96 H866 L956 166 V506 L866 574 H352 L282 508 V164 Z"
          stroke="rgba(127,227,255,0.18)"
          strokeWidth="16"
          filter="url(#cs-reactor-soft-glow)"
        />
        <path
          d="M352 96 H866 L956 166 V506 L866 574 H352 L282 508 V164 Z"
          stroke="url(#cs-reactor-intake)"
          strokeWidth="2"
          strokeDasharray="18 9 3 9"
          className={styles.perimeterTrace}
        />
        <path d="M352 96 H512" stroke="#BFF3FF" strokeWidth="3" strokeLinecap="round" />
        <path d="M706 96 H866" stroke="#BFF3FF" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Chip deliberately OUTSIDE the perimeter group. That group animates its
          opacity (0.44 -> 1), and a label nested inside inherits it — going
          translucent for most of the cycle and letting the chamber border show
          straight through the text. A label is not part of the animated
          boundary, so it keeps its own full opacity. */}
      <g transform="translate(512 75)">
        <path
          d="M22 0 H180 L194 21 L180 42 H22 L8 21 Z"
          fill="#0B1F3A"
          stroke="rgba(127,227,255,0.48)"
        />
        <path
          d="M28 21 L37 30 L54 12"
          stroke="#7FE3FF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="119" y="27" textAnchor="middle" className={styles.perimeterLabel}>
          Security Review
        </text>
      </g>
    </>
  );
}

/*
 * The refused artifact — the other half of the comparison, and the piece that
 * was hardest to read.
 *
 * It used to be an irregular blob carrying a jagged crack glyph, which scanned
 * as a broken clock face rather than as software, and it faded in from off-stage
 * and back out again every cycle so it looked like a stray fragment drifting
 * past. Neither the object nor its motion said anything.
 *
 * It is now the mirror of the verified source: the same regular hexagon, at the
 * same size, on the same centre line, so the two read as one object type with
 * two outcomes. One is admitted with a check; this one is refused with a cross.
 * That symmetry is what makes the comparison legible without a caption.
 *
 * It never leaves. It presses toward the perimeter, is repelled, and settles —
 * a short shove and recoil rather than an entrance and an exit.
 */
function RejectedLateArtifact(): React.ReactElement {
  return (
    <g data-late-artifact="rejected" transform="translate(1092 305)">
      <g className={styles.lateArtifact}>
        <ellipse cx="0" cy="13" rx="104" ry="110" fill="url(#cs-reactor-reject-halo)" />

        <path
          d="M0 -76 L66 -38 V38 L0 76 L-66 38 V-38 Z"
          fill="rgba(46,12,26,0.96)"
          stroke="rgba(255,135,149,0.5)"
          strokeWidth="2"
        />
        <path d="M0 -58 L50 -29 V29 L0 58 L-50 29 V-29 Z" fill="url(#cs-reactor-reject-core)" />

        {/* Cross, at the same weight as the source's check. */}
        <path
          d="M-19 -19 L19 19 M19 -19 L-19 19"
          stroke="#4A0F1C"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path d="M-41 -38 L0 -61 L41 -38" stroke="rgba(255,255,255,0.32)" strokeWidth="2" />

        {/* Permanent approach line to the perimeter, and the stop it runs into.
            The mirror of the verified source's intake conduit: that one enters,
            this one is turned back at the boundary. Drawn at all times so the
            relationship survives the quiet part of the cycle. */}
        <path
          d="M-104 0 H-132"
          stroke="rgba(255,135,149,0.45)"
          strokeWidth="2"
          strokeDasharray="6 7"
        />
        <path
          d="M-136 -22 V22"
          stroke="#FF8795"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Repelled: chevrons on the perimeter-facing side, flashing on impact. */}
        <g className={styles.fractureShard}>
          <path
            d="M-86 -22 L-98 0 L-86 22"
            stroke="#FF9DA8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M-70 -14 L-79 0 L-70 14"
            stroke="#FF9DA8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.6"
          />
        </g>

        <text x="0" y="147" textAnchor="middle" className={styles.rejectLabel}>
          Unverified Components
        </text>
      </g>
    </g>
  );
}

/*
 * Mobile is not the desktop scene made small.
 *
 * The first attempt shrank the reactor into a 360x880 viewBox. On a 375px
 * screen that renders 799px tall — taller than the viewport — so a
 * left-to-centre-to-right choreography played while the reader could only see a
 * third of it, thirteen infinite animations ran on the weakest devices, and
 * every label was SVG text scaled by 0.908 and therefore off the --fs-* scale.
 *
 * A phone is a column you travel down, not a stage you take in at a glance. So
 * the argument is delivered as content instead of as a scene: two cards with
 * IDENTICAL middles and different ends, which is precisely what the proposal's
 * two chains are. Same four stages both times; the only difference is what sits
 * at the head, and therefore what happens at the gate. The comparison lands in
 * one glance rather than over eleven seconds.
 *
 * Deliberately static. There is nothing here whose meaning needs motion, and
 * dropping it takes thirteen running animations off phones.
 */

function MobileBadge({ refused }: { refused: boolean }): React.ReactElement {
  return (
    <svg width="40" height="44" viewBox="0 0 40 44" fill="none" aria-hidden="true">
      <path
        d="M20 2 L37 12 V32 L20 42 L3 32 V12 Z"
        fill={refused ? 'rgba(46,12,26,0.96)' : 'rgba(12,38,57,0.96)'}
        stroke={refused ? 'rgba(255,135,149,0.55)' : 'rgba(127,227,255,0.5)'}
        strokeWidth="1.6"
      />
      <path
        d="M20 7 L32.5 14.5 V29.5 L20 37 L7.5 29.5 V14.5 Z"
        fill={refused ? 'url(#cs-mobile-reject-core)' : 'url(#cs-mobile-core)'}
      />
      {refused ? (
        <path
          d="M15 17 L25 27 M25 17 L15 27"
          stroke="#4A0F1C"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M14 22 L18.5 26.5 L26.5 17.5"
          stroke="#0B1F3A"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <defs>
        <linearGradient id="cs-mobile-core" x1="8" y1="8" x2="32" y2="36">
          <stop stopColor="#BFF3FF" />
          <stop offset="0.5" stopColor="#7FE3FF" />
          <stop offset="1" stopColor="#2CC1EB" />
        </linearGradient>
        <linearGradient id="cs-mobile-reject-core" x1="8" y1="8" x2="32" y2="36">
          <stop stopColor="#FFD0D5" />
          <stop offset="0.5" stopColor="#FF9DA8" />
          <stop offset="1" stopColor="#E0566B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MobileRun({ refused }: { refused: boolean }): React.ReactElement {
  return (
    <div className={`${styles.mobileCard} ${refused ? styles.mobileCardRefused : ''}`}>
      <div className={styles.mobileHead}>
        <MobileBadge refused={refused} />
        <span className={styles.mobileHeadLabel}>
          {refused ? 'Unverified Components' : 'Verified Components'}
        </span>
      </div>

      <span aria-hidden="true" className={styles.mobileRail} />

      {/* The middles are identical on purpose. Both chains run the same four
          stages; the head is the only thing that differs, so the stages must
          not look different or the reader blames the pipeline. */}
      <div className={styles.mobileStages}>
        {REACTOR_LAYERS.map((layer) => (
          <span key={layer.id} className={styles.mobileStage}>
            {layer.label}
          </span>
        ))}
      </div>

      <span aria-hidden="true" className={styles.mobileRail} />

      <div className={`${styles.mobileGate} ${refused ? styles.mobileGateRefused : ''}`}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          {refused ? (
            <path
              d="M4 4 L12 12 M12 4 L4 12"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M3 8.5 L6.5 12 L13 4.5"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
        Security Review
      </div>
    </div>
  );
}

function MobileReactor(): React.ReactElement {
  return (
    <div data-cleanroom-reactor="mobile" aria-hidden="true" className={styles.mobileFlow}>
      <MobileRun refused={false} />
      <MobileRun refused />
    </div>
  );
}
