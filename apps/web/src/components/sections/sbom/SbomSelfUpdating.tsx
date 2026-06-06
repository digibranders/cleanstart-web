import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';

const vw = (n: number): string => `${(n / 1920) * 100}vw`;

// The heading copy doesn't scale with vw, so on narrow desktop viewports
// (< ~1420px) it would crash into the labels. This shift activates once the
// image's natural top drops below 280px, keeping the image/labels group clear.
const VERT_SHIFT = `max(0px, calc(280px - ${vw(378)}))`;

// Extra breathing room below the bottom labels so the padding under them
// visually matches the padding above the heading.
const SECTION_BREATHING_ROOM = '24px';

const topShift = (y: number): string => `calc(${vw(y)} + ${VERT_SHIFT})`;

export function SbomSelfUpdating(): React.ReactElement {
  return (
    <section
      data-section="SbomSelfUpdating"
      className="relative overflow-hidden w-full"
      style={{
        background: 'linear-gradient(180deg, #151021 0%, #131e8f 67.139%, #471ec0 107.43%)',
        minHeight: `max(620px, calc(${vw(926)} + ${VERT_SHIFT} + ${SECTION_BREATHING_ROOM}))`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: vw(1228),
          top: vw(252),
          width: vw(1181),
          height: vw(1181),
          borderRadius: '50%',
          background:
            'radial-gradient(closest-side, rgba(71,30,192,0.55) 0%, rgba(71,30,192,0) 70%)',
          filter: `blur(${vw(60)})`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: vw(-659),
          top: vw(-513),
          width: vw(1181),
          height: vw(1181),
          borderRadius: '50%',
          background:
            'radial-gradient(closest-side, rgba(71,30,192,0.45) 0%, rgba(71,30,192,0) 70%)',
          filter: `blur(${vw(60)})`,
        }}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/sbom/self-update-corner-icon.svg"
        alt=""
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{ left: vw(305), top: vw(537), width: vw(41), height: vw(42) }}
        loading="lazy"
        decoding="async"
      />

      {/* Container width is wide enough that the subtitle lands on 3 lines at
          every desktop viewport instead of collapsing to 4 on narrow screens.
          H2 width follows the container so it stays on 1 line when there's room. */}
      <div
        className="hidden lg:flex absolute flex-col items-center text-center"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          top: vw(80),
          width: 'min(680px, 80vw)',
          gap: vw(24),
        }}
      >
        <Reveal header>
          <h2
            className="text-white"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
            }}
          >
            Generate. Verify. Validate.
          </h2>
        </Reveal>
        <Reveal header delay={0.15} y={20}>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--fs-lead)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.45,
              color: 'rgba(255,255,255,0.88)',
              width: '100%',
            }}
          >
            Automated SBOM generation with cryptographic signing and continuous validation across
            build and runtime environments.
          </p>
        </Reveal>
      </div>

      <div
        className="hidden lg:block absolute"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          top: topShift(378),
          width: vw(872),
          height: vw(468),
        }}
      >
        <Image
          src="/images/sbom/platforms-3d.webp"
          alt="Generate, Verify, Track, Validate: four-step SBOM lifecycle"
          width={872}
          height={468}
          sizes="(min-width: 1280px) 872px, 100vw"
          className="w-full h-full object-contain"
          style={{ display: 'block' }}
          loading="lazy"
        />
      </div>

      <FigmaCircle
        size={82}
        x={768}
        y={459}
        glowSize={63.778}
        glowOffset={9}
        num={1}
        numGradient="linear-gradient(128.05deg, #9A51FF 35.82%, #2CC1EB 78.3%)"
      />
      <FigmaCircle
        size={82}
        x={1076}
        y={457}
        glowSize={63.778}
        glowOffset={9}
        num={2}
        numGradient="linear-gradient(136.97deg, #9A51FF 35.82%, #2CC1EB 78.3%)"
      />
      <FigmaCircle
        size={76}
        x={698}
        y={567}
        glowSize={59.111}
        glowOffset={8.34}
        num={3}
        numGradient="linear-gradient(121.14deg, #9A51FF 35.82%, #2CC1EB 78.3%)"
        small
      />
      <FigmaCircle
        size={76}
        x={1148}
        y={569}
        glowSize={59.111}
        glowOffset={8.34}
        num={4}
        numGradient="linear-gradient(121.14deg, #9A51FF 35.82%, #2CC1EB 78.3%)"
        small
      />

      {/* Top-row captions are nudged outward so the body copy clears the
          platform illustration. */}
      <FeatureLabel
        x={423}
        y={394}
        title="Generate"
        body="Continuously create software inventories across environments."
        bodyWidth={266}
      />
      <FeatureLabel
        x={1233}
        y={394}
        title="Verify"
        body="Cryptographically validate software provenance."
        bodyWidth={218}
      />
      <FeatureLabel
        x={431}
        y={716}
        title="Track"
        body="Monitor dependencies and component changes over time."
      />
      <FeatureLabel
        x={1234}
        y={728}
        title="Validate"
        body="Continuously assess inventory accuracy and integrity."
      />

      <div
        className="lg:hidden flex flex-col items-center"
        style={{ paddingTop: '32px', paddingBottom: '32px' }}
      >
        <Reveal header>
          <h2
            className="text-white text-center"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              width: '257px',
              marginBottom: '0',
              textTransform: 'capitalize',
            }}
          >
            Generate. Verify. Validate.
          </h2>
        </Reveal>

        <Reveal header delay={0.15} y={20}>
          <p
            className="text-center"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--fs-lead)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.45,
              color: 'rgba(255,255,255,0.80)',
              width: '319px',
              marginTop: '17px',
              marginBottom: '24px',
            }}
          >
            Automated SBOM generation with cryptographic signing and continuous validation across
            build and runtime environments.
          </p>
        </Reveal>

        <div
          className="flex flex-col items-center"
          style={{ gap: '16px', width: '100%', paddingLeft: '16px', paddingRight: '16px' }}
        >
          {MOBILE_FEATURES.map((f) => (
            <div
              key={f.num}
              className="relative overflow-hidden"
              style={{
                width: '100%',
                maxWidth: '328px',
                height: '130px',
                borderRadius: '24px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sbom/mobile-action-card-bg.svg"
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full pointer-events-none"
                loading="lazy"
              />
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
                style={{ gap: '12px' }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-h4)',
                    fontWeight: 600,
                    letterSpacing: '-0.04em',
                    lineHeight: 1.1,
                    color: '#000',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.title}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-body-sm)',
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.4,
                    color: '#111',
                    opacity: 0.8,
                    width: '199px',
                  }}
                >
                  {f.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const MOBILE_FEATURES = [
  {
    num: 1,
    title: 'Generate',
    body: 'Continuously create software inventories across environments.',
  },
  { num: 2, title: 'Verify', body: 'Cryptographically validate software provenance.' },
  { num: 3, title: 'Track', body: 'Monitor dependencies and component changes over time.' },
  { num: 4, title: 'Validate', body: 'Continuously assess inventory accuracy and integrity.' },
];

type FigmaCircleProps = {
  size: number;
  x: number;
  y: number;
  glowSize: number;
  glowOffset: number;
  num: number;
  numGradient: string;
  small?: boolean;
};

function FigmaCircle({
  size,
  x,
  y,
  glowSize,
  glowOffset,
  num,
  numGradient,
  small = false,
}: FigmaCircleProps): React.ReactElement {
  const bgAsset = small ? '/images/sbom/ellipse-small.svg' : '/images/sbom/ellipse-large.svg';
  const glowAsset = small
    ? '/images/sbom/ellipse-small-glow.svg'
    : '/images/sbom/ellipse-large-glow.svg';

  return (
    <div
      className="hidden lg:flex absolute items-center justify-center"
      style={{ left: vw(x), top: topShift(y), width: vw(size), height: vw(size), zIndex: 10 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgAsset}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={glowAsset}
        alt=""
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: vw(glowOffset),
          top: vw(glowOffset),
          width: vw(glowSize),
          height: vw(glowSize),
        }}
        loading="lazy"
        decoding="async"
      />
      {/* TODO: add a --stat-number-* token for this 15→30px decorative numeral; no matching role token exists yet. */}
      <span
        className="relative"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-lead)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          background: numGradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          zIndex: 1,
        }}
      >
        {num}
      </span>
    </div>
  );
}

type FeatureLabelProps = {
  x: number;
  y: number;
  title: string;
  body: string;
  bodyWidth?: number;
};

function FeatureLabel({ x, y, title, body, bodyWidth }: FeatureLabelProps): React.ReactElement {
  return (
    <div
      className="hidden lg:flex absolute flex-col items-center text-center text-white"
      style={{ left: vw(x), top: topShift(y), width: vw(256), gap: vw(8) }}
    >
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-h4)',
          fontWeight: 600,
          lineHeight: 'var(--text-t-heading-sm-lh)',
          letterSpacing: 'var(--text-t-heading-sm-ls)',
          width: '100%',
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-body)',
          fontWeight: 400,
          lineHeight: 'var(--text-t-body-md-lh)',
          letterSpacing: 'var(--text-t-body-md-ls)',
          color: 'rgba(255,255,255,0.80)',
          width: bodyWidth ? vw(bodyWidth) : '100%',
        }}
      >
        {body}
      </p>
    </div>
  );
}
