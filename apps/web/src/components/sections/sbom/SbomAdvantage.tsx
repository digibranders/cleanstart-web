import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';

const CARDS = [
  {
    id: 'cicd',
    title: 'CI/CD Pipelines',
    body: 'Integrate continuously verifiable SBOMs into existing delivery workflows.',
    cornerRadius: '8px 8px 62px 8px',
    mobileBg: 'a',
  },
  {
    id: 'container',
    title: 'Container Environments',
    body: 'Track software inventories across container images and deployments.',
    cornerRadius: '8px 8px 8px 62px',
    mobileBg: 'c',
  },
  {
    id: 'compliance',
    title: 'Compliance Programs',
    body: 'Support audit readiness and modern compliance requirements.',
    cornerRadius: '8px 62px 8px 8px',
    mobileBg: 'b',
  },
  {
    id: 'security',
    title: 'Security & Compliance Teams',
    body: 'Improve software supply chain visibility and integrity.',
    cornerRadius: '62px 8px 8px 8px',
    mobileBg: 'a',
  },
] as const;

export function SbomAdvantage(): React.ReactElement {
  return (
    <section
      data-section="SbomAdvantage"
      className="relative overflow-hidden bg-[#f7f7f7] w-full"
      style={{ minHeight: 'calc(250px + 42vw)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          right: '-220px',
          bottom: '-140px',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background:
            'radial-gradient(closest-side, rgba(44,193,235,0.18) 0%, rgba(44,193,235,0) 70%)',
        }}
      />

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: 'clamp(56px, 6vw, 100px)',
          paddingBottom: 'max(var(--spacing-section-cta), 175px)',
        }}
      >
        <div className="text-center mb-10 md:mb-14">
          <Reveal header>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.2,
                color: '#111',
              }}
            >
              <span className="block">Built for Modern Software</span>
              <span className="cs-text-gradient-impact block">Supply Chains</span>
            </h2>
          </Reveal>
        </div>

        <div className="hidden lg:grid grid-cols-[512fr_708fr] gap-8 items-stretch">
          <div
            className="relative overflow-hidden w-full"
            style={{
              borderRadius: '20px',
              border: '1.5px solid #076eff',
              aspectRatio: '512/384',
              minHeight: '260px',
            }}
          >
            <Image
              src="/images/sbom/infinity-circuit.webp"
              alt="CleanStart SBOM continuous delivery loop"
              fill
              sizes="(min-width: 1024px) 512px, 100vw"
              className="object-cover"
              loading="lazy"
            />
          </div>

          <div className="relative grid grid-cols-2 gap-6">
            {CARDS.map((card) => (
              <article
                key={card.id}
                className="bg-white w-full"
                style={{
                  borderRadius: card.cornerRadius,
                  border: '1.5px solid rgba(0,0,0,0.06)',
                  padding: 'clamp(20px, 1.67vw, 32px)',
                  minHeight: 'clamp(150px, 11.5vw, 180px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <p
                  className="text-[#111]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-h3)',
                    fontWeight: 600,
                    letterSpacing: '-0.04em',
                    lineHeight: 1.1,
                  }}
                >
                  {card.title}
                </p>
                <p
                  className="text-[#333]"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-body)',
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.4,
                  }}
                >
                  {card.body}
                </p>
              </article>
            ))}

            <div
              aria-hidden
              className="hidden sm:flex absolute items-center justify-center"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #239cff 0%, #005be3 100%)',
                boxShadow:
                  '0 4.63px 10.9px rgba(28,60,142,0.33), inset 0 -0.17px 0.22px rgba(0,44,179,0.5), inset 0 0.09px 0.44px rgba(255,255,255,0.81)',
                zIndex: 2,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sbom/icon-infinity.svg"
                alt=""
                style={{ width: '34px', height: '40px', display: 'block' }}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>

        <div className="hidden sm:grid lg:hidden grid-cols-[1fr_1fr] gap-6 items-start">
          <div
            className="relative overflow-hidden w-full col-span-2"
            style={{
              borderRadius: '20px',
              border: '1.5px solid #076eff',
              aspectRatio: '512/384',
            }}
          >
            <Image
              src="/images/sbom/infinity-circuit.webp"
              alt="CleanStart SBOM continuous delivery loop"
              fill
              sizes="100vw"
              className="object-cover"
              loading="lazy"
            />
          </div>
          {CARDS.map((card) => (
            <article
              key={card.id}
              className="bg-white"
              style={{
                borderRadius: '16px',
                border: '1.5px solid rgba(0,0,0,0.06)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <p
                className="text-[#111]"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--fs-h5)',
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.1,
                }}
              >
                {card.title}
              </p>
              <p
                className="text-[#333]"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--fs-body-sm)',
                  fontWeight: 400,
                  lineHeight: 1.4,
                }}
              >
                {card.body}
              </p>
            </article>
          ))}
        </div>

        <div className="sm:hidden flex flex-col items-center" style={{ gap: '0' }}>
          <div
            className="relative overflow-hidden"
            style={{
              width: '328px',
              height: '183px',
              borderRadius: '24px',
              border: '0.961px solid #076eff',
              backgroundImage:
                'linear-gradient(90deg, rgba(44,193,235,0.4) 0%, rgba(44,193,235,0.4) 100%), linear-gradient(90deg, #fff 0%, #fff 100%)',
              marginBottom: '16px',
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/sbom/mobile-builtfor-ellipse.svg"
              alt=""
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                left: '-78px',
                top: '-72px',
                width: '263px',
                height: '256px',
                transform: 'rotate(35deg)',
              }}
              loading="lazy"
            />
            <Image
              src="/images/sbom/infinity-circuit.webp"
              alt="CleanStart SBOM built for modern supply chains"
              fill
              sizes="328px"
              className="object-cover"
              loading="lazy"
            />
          </div>

          {/* The central ball overlaps the two adjacent cards by 20px each; with
              the 16px gap, its -36px vertical margins net to that 20px overlap. */}
          <div className="flex flex-col items-center" style={{ width: '328px', gap: '16px' }}>
            <MobileBuiltForCard
              title="CI/CD Pipelines"
              body="Integrate continuously verifiable SBOMs into existing delivery workflows."
              bgSvg="/images/sbom/mobile-builtfor-card-a.svg"
              height={150}
              titleW={169}
              bodyW={264}
            />

            <MobileBuiltForCard
              title="Compliance Programs"
              body="Support audit readiness and modern compliance requirements."
              bgSvg="/images/sbom/mobile-builtfor-card-c.svg"
              height={150}
              titleW={243}
              bodyW={264}
            />

            <div
              aria-hidden
              className="flex items-center justify-center self-center shrink-0"
              style={{
                position: 'relative',
                zIndex: 2,
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #239cff 0%, #005be3 100%)',
                boxShadow:
                  '0px 3.6px 8.48px 0px rgba(28,60,142,0.33), inset 0px -0.136px 0.17px 0px rgba(0,44,179,0.5), inset 0px 0.068px 0.339px 0px rgba(255,255,255,0.81)',
                marginTop: '-36px',
                marginBottom: '-36px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sbom/mobile-builtfor-ball-icon.svg"
                alt=""
                aria-hidden
                style={{ width: '26.62px', height: '30.91px' }}
                loading="lazy"
              />
            </div>

            <MobileBuiltForCard
              title="Container Environments"
              body="Track software inventories across container images and deployments."
              bgSvg="/images/sbom/mobile-builtfor-card-b.svg"
              height={150}
              titleW={249}
              bodyW={264}
            />

            <MobileBuiltForCard
              title="Security & Compliance Teams"
              body="Improve software supply chain visibility and integrity."
              bgSvg="/images/sbom/mobile-builtfor-card-a.svg"
              height={150}
              titleW={264}
              bodyW={264}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function MobileBuiltForCard({
  title,
  body,
  bgSvg,
  height,
  titleW,
  bodyW,
}: {
  title: string;
  body: string;
  bgSvg: string;
  height: number;
  titleW: number;
  bodyW: number;
}): React.ReactElement {
  return (
    <div
      className="relative flex flex-col items-center justify-center text-center"
      style={{ width: '328px', height: `${height}px` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgSvg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        loading="lazy"
      />
      <div className="relative flex flex-col items-center gap-[12px] text-center">
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h4)',
            fontWeight: 600,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: '#000',
            width: `${titleW}px`,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-body-sm)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.5,
            color: '#111',
            opacity: 0.8,
            width: `${bodyW}px`,
          }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}
