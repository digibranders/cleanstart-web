import type React from 'react';
import styles from './SaasVerifiedCore.module.css';

type DeliveryStageId = 'code' | 'build' | 'test' | 'deploy';

interface DeliveryStage {
  readonly id: DeliveryStageId;
  readonly label: 'Code' | 'Build' | 'Test' | 'Deploy';
}

interface SecurityScannerProps {
  readonly state: 'open' | 'closed';
  readonly compact?: boolean;
  readonly vertical?: boolean;
}

const DELIVERY_STAGES: readonly DeliveryStage[] = [
  { id: 'code', label: 'Code' },
  { id: 'build', label: 'Build' },
  { id: 'test', label: 'Test' },
  { id: 'deploy', label: 'Deploy' },
];

export function SaasVerifiedCore(): React.ReactElement {
  return (
    <div className={styles.stage}>
      <DesktopVerifiedCore />
      <MobileVerifiedCore />
    </div>
  );
}

function DesktopVerifiedCore(): React.ReactElement {
  return (
    <div data-verified-core="desktop" aria-hidden="true" className={styles.desktopSurface}>
      <SurfaceChrome />
      <div className={styles.routeStack}>
        <LateReviewRoute />
        <VerifiedRoute />
      </div>
    </div>
  );
}

function SurfaceChrome(): React.ReactElement {
  return (
    <div className={styles.surfaceChrome}>
      <span className={styles.cornerTopLeft} />
      <span className={styles.cornerTopRight} />
      <span className={styles.cornerBottomLeft} />
      <span className={styles.cornerBottomRight} />
      <span className={styles.measureTop} />
      <span className={styles.measureBottom} />
    </div>
  );
}

function LateReviewRoute(): React.ReactElement {
  return (
    <div className={styles.lateRoute}>
      <svg
        data-late-review-path="return"
        className={styles.returnPath}
        viewBox="0 0 1000 150"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
      >
        <defs>
          <marker
            id="cs-verified-core-return-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="#FF8795" />
          </marker>
        </defs>
        <path
          d="M 918 102 C 918 25, 304 25, 304 82"
          className={styles.returnGuide}
          markerEnd="url(#cs-verified-core-return-arrow)"
        />
        <path
          d="M 918 102 C 918 25, 304 25, 304 82"
          className={styles.returnPulse}
        />
      </svg>

      <span className={styles.lateRail} />
      <div className={styles.lateGrid}>
        <span />
        {DELIVERY_STAGES.map((stage) => (
          <LateStage key={stage.id} stage={stage} />
        ))}
        <SecurityScanner state="closed" compact />
      </div>
    </div>
  );
}

function LateStage({ stage }: { readonly stage: DeliveryStage }): React.ReactElement {
  return (
    <div className={styles.lateStage}>
      <span className={styles.lateNode}>
        <span className={styles.lateNodeCore} />
      </span>
      <span className={styles.lateLabel}>{stage.label}</span>
    </div>
  );
}

function VerifiedRoute(): React.ReactElement {
  return (
    <div className={styles.verifiedRoute}>
      <span data-trust-ribbon="continuous" className={styles.trustRibbon} />
      <span className={styles.verifiedPulse} />
      <div className={styles.verifiedGrid}>
        <VerifiedSource />
        {DELIVERY_STAGES.map((stage) => (
          <StageHousing key={stage.id} stage={stage} />
        ))}
        <SecurityScanner state="open" />
      </div>
    </div>
  );
}

function VerifiedSource(): React.ReactElement {
  return (
    <div data-verified-source="verified-components" className={styles.sourceShell}>
      <div className={styles.sourceInner}>
        <span className={styles.sourceSeal}>
          <CheckIcon />
        </span>
        <span className={styles.sourceLabel}>Verified Components</span>
      </div>
    </div>
  );
}

function StageHousing({ stage }: { readonly stage: DeliveryStage }): React.ReactElement {
  return (
    <div data-core-stage={stage.id} className={styles.stageShell}>
      <div className={styles.stageInner}>
        <span className={styles.stageLabel}>{stage.label}</span>
        <span className={styles.coreWindow}>
          <span className={styles.coreLine} />
          <span className={styles.coreNode} />
        </span>
      </div>
    </div>
  );
}

function SecurityScanner({
  state,
  compact = false,
  vertical = false,
}: SecurityScannerProps): React.ReactElement {
  const isOpen = state === 'open';
  const className = [
    styles.scanner,
    isOpen ? styles.scannerOpen : styles.scannerClosed,
    compact ? styles.scannerCompact : '',
    vertical ? styles.scannerVertical : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div data-security-review={state} className={className}>
      <div className={styles.scannerFrame}>
        <span className={styles.scannerBeam} />
        <span className={styles.scannerBarrier} />
        <span className={styles.scannerStateIcon}>
          {isOpen ? <CheckIcon /> : <CrossIcon />}
        </span>
      </div>
      <span className={styles.scannerLabel}>Security Review</span>
      {isOpen ? (
        <span data-release-exit="approved" className={styles.releaseExit}>
          <span className={styles.releaseLine} />
          <span data-release-arrow="forward" className={styles.releaseArrow} />
          <span className={styles.releaseCheck}>
            <CheckIcon />
          </span>
        </span>
      ) : null}
    </div>
  );
}

function MobileVerifiedCore(): React.ReactElement {
  return (
    <div data-verified-core="mobile" aria-hidden="true" className={styles.mobileSurface}>
      <MobileLateRoute />
      <MobileVerifiedRoute />
    </div>
  );
}

function MobileLateRoute(): React.ReactElement {
  return (
    <div className={styles.mobileLateCard}>
      <div className={styles.mobileLateStages}>
        {DELIVERY_STAGES.map((stage) => (
          <span key={stage.id} className={styles.mobileLateStage}>
            {stage.label}
          </span>
        ))}
      </div>
      <span className={styles.mobileLateConnector} />
      <SecurityScanner state="closed" compact />
      <svg
        data-late-review-path="return"
        className={styles.mobileReturnPath}
        viewBox="0 0 300 54"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
      >
        <defs>
          <marker
            id="cs-mobile-return-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="#FF8795" />
          </marker>
        </defs>
        <path
          d="M 276 8 C 244 45, 72 45, 24 14"
          className={styles.returnGuide}
          markerEnd="url(#cs-mobile-return-arrow)"
        />
      </svg>
    </div>
  );
}

function MobileVerifiedRoute(): React.ReactElement {
  return (
    <div className={styles.mobileVerifiedCard}>
      <div className={styles.mobileCoreTrack}>
        <span data-trust-ribbon="continuous" className={styles.mobileTrustRibbon} />
        <VerifiedSource />
        {DELIVERY_STAGES.map((stage) => (
          <StageHousing key={stage.id} stage={stage} />
        ))}
        <SecurityScanner state="open" vertical />
      </div>
    </div>
  );
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

function CrossIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 5 L15 15 M15 5 L5 15"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
