import Image from 'next/image';
import type React from 'react';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/Reveal';

const ASSET_BASE = '/images/for-developers/workflows';

interface PipelineStep {
  label: string;
  icon: string;
  /** Per-icon override for the default 60 px size. */
  iconSize?: number;
}

const PIPELINE_STEPS_LEFT: PipelineStep[] = [
  { label: 'Code', icon: `${ASSET_BASE}/logo-code.webp`, iconSize: 60 },
  { label: 'Git', icon: `${ASSET_BASE}/logo-git.webp`, iconSize: 56 },
  { label: 'CI/CD', icon: `${ASSET_BASE}/logo-cicd.svg`, iconSize: 56 },
  { label: 'Build', icon: `${ASSET_BASE}/logo-build.svg`, iconSize: 60 },
];

const PIPELINE_STEPS_RIGHT: PipelineStep[] = [
  { label: 'Registry', icon: `${ASSET_BASE}/logo-registry.webp`, iconSize: 60 },
  { label: 'Deploy', icon: `${ASSET_BASE}/logo-deploy.svg`, iconSize: 56 },
  { label: 'Runtime', icon: `${ASSET_BASE}/logo-runtime.svg`, iconSize: 56 },
];

interface FeatureCard {
  title: string;
  body: string;
  /** Per-card glyph SVG rendered inside the blue ball. */
  icon: string;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    title: 'Existing CI/CD Pipelines',
    body: 'Works with current development workflows.',
    icon: `${ASSET_BASE}/icon-cicd-pipelines.svg`,
  },
  {
    title: 'Registry Compatible',
    body: 'Integrates with existing registries and tooling.',
    icon: `${ASSET_BASE}/icon-registry.svg`,
  },
  {
    title: 'Faster Builds',
    body: 'Smaller images improve pull and deployment times.',
    icon: `${ASSET_BASE}/icon-faster-builds.svg`,
  },
  {
    title: 'Cleaner SBOMs',
    body: 'Reduce dependency complexity across environments.',
    icon: `${ASSET_BASE}/icon-sboms.svg`,
  },
];

function PipelineStepCard({ label, icon, iconSize = 60 }: PipelineStep): React.ReactElement {
  return (
    <div
      className="relative flex shrink-0 flex-col items-center justify-between"
      style={{
        width: '112px',
        height: '126px',
        borderRadius: '16px',
        background:
          'linear-gradient(90deg, rgba(44,193,235,0.23), rgba(44,193,235,0.23))',
        padding: '2px',
      }}
    >
      <div
        className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden bg-white"
        style={{ borderRadius: '14px', padding: '14px 10px 12px' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: 0,
            bottom: 0,
            right: 0,
            width: '0.73px',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0) 0%, #ffffff 50.77%, rgba(255,255,255,0) 100%)',
            opacity: 0.8,
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={icon}
          alt=""
          aria-hidden
          width={iconSize}
          height={iconSize}
          style={{ width: `${iconSize}px`, height: `${iconSize}px`, objectFit: 'contain' }}
          loading="lazy"
          decoding="async"
        />
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-h5)',
            fontWeight: 400,
            letterSpacing: '-0.04em',
            lineHeight: 1.2,
            color: '#555',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function CleanStartCard(): React.ReactElement {
  return (
    <div
      className="relative flex shrink-0 flex-col items-center justify-center overflow-hidden"
      style={{
        width: '146px',
        height: '154px',
        borderRadius: '13.5px',
        border: '1.688px solid #dab6f3',
        background: 'linear-gradient(180deg, #151021 0%, #131E8F 71.2%, #551ECE 100%)',
        boxShadow: [
          '-115.368px 57.403px 36.017px 0 rgba(0,0,0,0)',
          '-73.723px 36.580px 33.203px 0 rgba(0,0,0,0.03)',
          '-41.645px 20.822px 27.576px 0 rgba(0,0,0,0.12)',
          '-18.571px 9.004px 20.822px 0 rgba(0,0,0,0.20)',
          '-4.502px 2.251px 11.255px 0 rgba(0,0,0,0.23)',
        ].join(', '),
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          width: '158.5px',
          height: '227.4px',
          left: '-34px',
          top: '-90px',
          background: '#5D04D7',
          opacity: 0.34,
          filter: 'blur(40px)',
          borderRadius: '50%',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          width: '254.5px',
          height: '365.1px',
          left: '-9.4px',
          top: '-120px',
          background: '#04C7F2',
          opacity: 0.6,
          filter: 'blur(40px)',
          borderRadius: '50%',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          width: '102px',
          height: '180px',
          right: '-30px',
          top: '-10px',
          mixBlendMode: 'color-dodge',
          opacity: 0.6,
          background:
            'radial-gradient(50% 50% at 50% 50%, #D3FFF8 0%, #15ADFA 10%, #0166CC 50%, rgba(2,17,47,0) 100%)',
        }}
      />

      {/* Inline feTurbulence grain avoids an extra network request; overlay blend keeps the glows intact. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          mixBlendMode: 'overlay',
          opacity: 0.18,
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/><feColorMatrix values=\'0 0 0 0 1   0 0 0 0 1   0 0 0 0 1   0 0 0 1 0\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
          backgroundSize: '160px 160px',
        }}
      />

      <Image
        src={`${ASSET_BASE}/cube-image.webp`}
        alt=""
        aria-hidden
        width={77}
        height={84}
        priority
        className="relative z-10 select-none"
        style={{ marginTop: '12px', objectFit: 'contain' }}
      />

      <p
        className="relative z-10 text-center"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-caption)',
          fontWeight: 400,
          letterSpacing: '-0.04em',
          lineHeight: 1.2,
          color: '#ffffff',
          marginTop: '6px',
          padding: '0 8px',
        }}
      >
        CleanStart
        <br />
        Hardened Image
      </p>
    </div>
  );
}

function PipelineArrow(): React.ReactElement {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${ASSET_BASE}/arrow-straight.svg`}
      alt=""
      aria-hidden
      width={30}
      height={16}
      style={{ width: '30px', height: '16px', flexShrink: 0, opacity: 0.6 }}
    />
  );
}

/** Same dashed arrow asset rotated 90deg to point down for the mobile column. */
function MobilePipelineArrow(): React.ReactElement {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${ASSET_BASE}/arrow-straight.svg`}
      alt=""
      aria-hidden
      width={30}
      height={16}
      style={{
        width: '30px',
        height: '16px',
        flexShrink: 0,
        opacity: 0.6,
        transform: 'rotate(90deg)',
      }}
    />
  );
}

function MobilePipelineCard({ label, icon, iconSize = 56 }: PipelineStep): React.ReactElement {
  return (
    <div
      className="relative flex items-center"
      style={{
        width: '244px',
        height: '80px',
        borderRadius: '16px',
        background:
          'linear-gradient(90deg, rgba(44,193,235,0.23), rgba(44,193,235,0.23))',
        padding: '2px',
      }}
    >
      <div
        className="relative flex h-full w-full items-center overflow-hidden bg-white"
        style={{ borderRadius: '14px', padding: '12px 20px' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: 0,
            bottom: 0,
            left: '50%',
            width: '0.73px',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0) 0%, #ffffff 50.77%, rgba(255,255,255,0) 100%)',
            opacity: 0.6,
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={icon}
          alt=""
          aria-hidden
          width={iconSize}
          height={iconSize}
          style={{
            width: `${iconSize}px`,
            height: `${iconSize}px`,
            objectFit: 'contain',
            flexShrink: 0,
          }}
          loading="lazy"
          decoding="async"
        />
        <span
          className="ml-auto"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-h5)',
            fontWeight: 400,
            letterSpacing: '-0.04em',
            lineHeight: 1.2,
            color: '#555',
            whiteSpace: 'nowrap',
            paddingRight: '12px',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function MobileCleanStartCard(): React.ReactElement {
  return (
    <div
      className="relative flex shrink-0 items-center overflow-hidden"
      style={{
        width: '244px',
        height: '80px',
        borderRadius: '13.5px',
        border: '1.688px solid #dab6f3',
        background: 'linear-gradient(180deg, #151021 0%, #131E8F 71.2%, #551ECE 100%)',
        boxShadow: [
          '-73.723px 36.580px 33.203px 0 rgba(0,0,0,0.03)',
          '-41.645px 20.822px 27.576px 0 rgba(0,0,0,0.12)',
          '-18.571px 9.004px 20.822px 0 rgba(0,0,0,0.20)',
          '-4.502px 2.251px 11.255px 0 rgba(0,0,0,0.23)',
        ].join(', '),
        padding: '12px 18px',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          width: '158.5px',
          height: '160px',
          left: '-34px',
          top: '-50px',
          background: '#5D04D7',
          opacity: 0.34,
          filter: 'blur(40px)',
          borderRadius: '50%',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          width: '254.5px',
          height: '200px',
          left: '-9.4px',
          top: '-80px',
          background: '#04C7F2',
          opacity: 0.55,
          filter: 'blur(40px)',
          borderRadius: '50%',
        }}
      />

      <Image
        src={`${ASSET_BASE}/cube-image.webp`}
        alt=""
        aria-hidden
        width={48}
        height={52}
        priority
        className="relative z-10 select-none shrink-0"
        style={{ objectFit: 'contain' }}
      />

      <p
        className="relative z-10 ml-auto text-right"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-body-sm)',
          fontWeight: 500,
          letterSpacing: '-0.04em',
          lineHeight: 1.15,
          color: '#ffffff',
          paddingRight: '4px',
        }}
      >
        CleanStart
        <br />
        Hardened Image
      </p>
    </div>
  );
}

function FeatureBall({ icon }: { icon: string }): React.ReactElement {
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        width: '96px',
        height: '96px',
        borderRadius: '50%',
        background: 'linear-gradient(180deg, #239cff 0%, #005be3 100%)',
        boxShadow:
          '0 6.17px 14.54px rgba(28,60,142,0.33), inset 0 -0.23px 0.29px rgba(0,44,179,0.5), inset 0 0.12px 0.58px rgba(255,255,255,0.81)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          inset: '0',
          background:
            'radial-gradient(60% 50% at 50% 20%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%)',
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt=""
        aria-hidden
        width={54}
        height={54}
        className="relative z-10"
        style={{ width: '54px', height: '54px' }}
      />
    </div>
  );
}

function FeatureCardView({ title, body, icon }: FeatureCard): React.ReactElement {
  return (
    <div
      className="relative flex shrink-0 w-[320px] lg:w-[295px] rounded-[20px] lg:rounded-[40px] p-[6px] lg:p-[4px]"
      style={{
        height: '324px',
        background:
          'linear-gradient(90deg, rgba(44,193,235,0.30), rgba(44,193,235,0.30))',
      }}
    >
      <div
        className="relative h-full w-full overflow-hidden bg-white rounded-[14px] lg:rounded-[36px]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            width: '262.87px',
            height: '153px',
            left: '50%',
            transform: 'translateX(-50%)',
            top: '28px',
            background: '#df9bff',
            opacity: 0.3,
            filter: 'blur(66.5px)',
          }}
        />

        {[48.47, 120.03, 162.38, 233.94].map((left) => (
          <div
            key={left}
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              top: 0,
              left: `${left}px`,
              width: '0.73px',
              height: '264px',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0) 0%, #ffffff 50.77%, rgba(255,255,255,0) 100%)',
              opacity: 0.8,
            }}
          />
        ))}

        {[67.5, 183.5].map((top) => (
          <div
            key={top}
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: '-68px',
              right: '-68px',
              top: `${top}px`,
              height: '1px',
              background:
                'linear-gradient(90deg, rgba(255,255,255,0) 0%, #ffffff 50.77%, rgba(255,255,255,0) 100%)',
              opacity: 0.3,
            }}
          />
        ))}

        <div className="absolute" style={{ top: '32px', left: '24px' }}>
          <FeatureBall icon={icon} />
        </div>

        <div
          className="absolute flex flex-col"
          style={{ top: '152px', left: '24px', width: '251px', gap: '12px' }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h3)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: '#111',
              margin: 0,
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--fs-h5)',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              lineHeight: 1.4,
              color: '#555',
              margin: 0,
            }}
          >
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DeveloperWorkflows(): React.ReactElement {
  return (
    <section
      data-section="DeveloperWorkflows"
      className="relative overflow-hidden"
      style={{
        background: '#f6f6f6',
        paddingTop: 'clamp(56px, 6.25vw, 120px)',
        paddingBottom: 'clamp(56px, 6.25vw, 120px)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${ASSET_BASE}/arc-pattern.svg`}
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[10px] -translate-x-1/2 select-none"
        style={{ width: '701px', height: '680px', opacity: 0.5 }}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${ASSET_BASE}/corner-blob.svg`}
        alt=""
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          width: '488px',
          height: '496px',
          left: '-218px',
          top: '-139px',
          transform: 'scaleY(-1) rotate(141.39deg)',
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${ASSET_BASE}/corner-blob.svg`}
        alt=""
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          width: '488px',
          height: '496px',
          right: '-218px',
          top: '-139px',
          transform: 'scaleY(-1) rotate(141.39deg) scaleX(-1)',
        }}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${ASSET_BASE}/ellipse-glow.svg`}
        alt=""
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{ width: '500px', height: '500px', left: '-103px', top: '-20px' }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${ASSET_BASE}/ellipse-glow.svg`}
        alt=""
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{ width: '500px', height: '500px', right: '-103px', top: '-74px' }}
      />

      <div className="relative mx-auto w-full max-w-[1276px] px-6 sm:px-10">
        <Reveal header>
          <h2
            className="mx-auto text-center"
            style={{
              maxWidth: '720px',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              fontWeight: 700,
              letterSpacing: '-0.05em',
              lineHeight: 1.15,
              color: '#111',
              marginBottom: 'clamp(40px, 4.17vw, 80px)',
            }}
          >
            Designed for Developer{' '}
            <span className="cs-text-gradient-impact">Workflows</span>
          </h2>
        </Reveal>

        <div className="relative mb-20 flex flex-col items-center">
          <div className="hidden md:flex items-center justify-center" style={{ gap: '14px' }}>
            {PIPELINE_STEPS_LEFT.map((step, i) => (
              <PipelineRow key={step.label} step={step} showArrowAfter={i < PIPELINE_STEPS_LEFT.length - 1} />
            ))}
            <PipelineArrow />
            <CleanStartCard />
            <PipelineArrow />
            {PIPELINE_STEPS_RIGHT.map((step, i) => (
              <PipelineRow key={step.label} step={step} showArrowAfter={i < PIPELINE_STEPS_RIGHT.length - 1} />
            ))}
          </div>

          <div className="md:hidden flex flex-col items-center gap-2">
            {[
              { label: 'Code', icon: `${ASSET_BASE}/logo-code.webp`, iconSize: 52 },
              { label: 'Git', icon: `${ASSET_BASE}/logo-git.webp`, iconSize: 48 },
              { label: 'CI/CD', icon: `${ASSET_BASE}/logo-cicd.svg`, iconSize: 48 },
              { label: 'Build', icon: `${ASSET_BASE}/logo-build.svg`, iconSize: 52 },
            ].map((step) => (
              <div key={`m-${step.label}`} className="flex flex-col items-center gap-2">
                <MobilePipelineCard {...step} />
                <MobilePipelineArrow />
              </div>
            ))}
            <MobileCleanStartCard />
            <MobilePipelineArrow />
            {[
              { label: 'Registry', icon: `${ASSET_BASE}/logo-registry.webp`, iconSize: 52 },
              { label: 'Deploy', icon: `${ASSET_BASE}/logo-deploy.svg`, iconSize: 48 },
              { label: 'Runtime', icon: `${ASSET_BASE}/logo-runtime.svg`, iconSize: 48 },
            ].map((step, i, arr) => (
              <div key={`m-${step.label}`} className="flex flex-col items-center gap-2">
                <MobilePipelineCard {...step} />
                {i < arr.length - 1 ? <MobilePipelineArrow /> : null}
              </div>
            ))}
          </div>

          <div
            className="relative mt-6 flex items-center justify-center"
            style={{
              height: '36px',
              padding: '0 25px',
              borderRadius: '40px',
              background: 'rgba(44,193,235,0.40)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-h5)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.4,
                color: '#333',
                whiteSpace: 'nowrap',
              }}
            >
              Minimal . Hardened . Verifiable
            </span>
          </div>
        </div>

        <RevealStagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 justify-items-center gap-4 lg:gap-8"
        >
          {FEATURE_CARDS.map((card) => (
            <RevealItem key={card.title}>
              <FeatureCardView {...card} />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}

/** Renders a step card optionally followed by an arrow, keeping the pipeline JSX flat. */
function PipelineRow({
  step,
  showArrowAfter,
}: {
  step: PipelineStep;
  showArrowAfter: boolean;
}): React.ReactElement {
  return (
    <>
      <PipelineStepCard {...step} />
      {showArrowAfter ? <PipelineArrow /> : null}
    </>
  );
}
