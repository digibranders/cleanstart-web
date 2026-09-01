import type React from 'react';
import styles from './SaasVerifiedCore.module.css';

type DeliveryStageId = 'code' | 'build' | 'test' | 'deploy';

interface DeliveryStage {
  readonly id: DeliveryStageId;
  readonly label: 'Code' | 'Build' | 'Test' | 'Deploy';
}

interface SecurityScannerProps {
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
        <SecurityScanner />
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
          <StageIcon stage={stage.id} />
        </span>
      </div>
    </div>
  );
}

function StageIcon({ stage }: { readonly stage: DeliveryStageId }): React.ReactElement {
  const commonProps = {
    'aria-hidden': true,
    className: styles.stageIcon,
    'data-stage-icon': stage,
    fill: 'none',
    viewBox: '0 0 24 24',
  } as const;

  switch (stage) {
    case 'code':
      return (
        <svg {...commonProps}>
          <path d="M8 6.5 3 12l5 5.5M16 6.5l5 5.5-5 5.5M14.5 4 9.5 20" />
        </svg>
      );
    case 'build':
      return (
        <svg {...commonProps}>
          <path d="m12 3 8.5 4.75L12 12.5 3.5 7.75 12 3Z" />
          <path d="M3.5 7.75v8.5L12 21l8.5-4.75v-8.5M12 12.5V21" />
        </svg>
      );
    case 'test':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m7.75 12.25 2.65 2.65 5.85-6" />
        </svg>
      );
    case 'deploy':
      return (
        <svg {...commonProps}>
          <path d="M12 16V4M7.5 8.5 12 4l4.5 4.5M5 15v5h14v-5" />
        </svg>
      );
  }
}

function SecurityScanner({ vertical = false }: SecurityScannerProps): React.ReactElement {
  const className = [
    styles.scanner,
    styles.scannerOpen,
    vertical ? styles.scannerVertical : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div data-security-review="open" className={className}>
      <div className={styles.scannerFrame}>
        <span className={styles.scannerBeam} />
        <span className={styles.scannerBarrier} />
        <span className={styles.scannerStateIcon}>
          <CheckIcon />
        </span>
      </div>
      <span className={styles.scannerLabel}>Security Review</span>
      <span data-release-exit="approved" className={styles.releaseExit}>
        <span className={styles.releaseLine} />
        <span data-release-arrow="forward" className={styles.releaseArrow} />
        <span className={styles.releaseCheck}>
          <CheckIcon />
        </span>
      </span>
    </div>
  );
}

function MobileVerifiedCore(): React.ReactElement {
  return (
    <div data-verified-core="mobile" aria-hidden="true" className={styles.mobileSurface}>
      <MobileVerifiedRoute />
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
        <SecurityScanner vertical />
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
