import type React from 'react';
import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { Container, Section } from '@/components/layout';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';
import { TelecomJourneyArt } from './TelecomJourneyArt';
import { H2_STYLE } from './type';

/*
 * "Build Modern Networks on Verified Software": Discover, Standardize, Operate
 * as three stations on one network link, not three cards.
 *
 * One stage holds all three, so the steps read as a single flow. The animated
 * scenes (TelecomJourneyArt) stand on a shared platform level, and the gaps
 * between them are fibre links: dashes flow toward the next step and a light
 * packet travels Discover to Standardize, then Standardize to Operate (the
 * second link waits half a cycle). The links echo the signal backbone in the
 * "Need More" section, so the page keeps one visual language for "network".
 *
 * Operate is the destination: a violet aura behind its scene and the gradient
 * on its title. No step numbers; the link direction carries the order.
 * Hovering a station lifts it onto a white surface and plays its scene.
 *
 * Below lg the stations stack and each link turns vertical between them.
 *
 * Copy is the brief's, verbatim ("visibility" spelled correctly; the mock's
 * "visibillty" is a typo, not copy).
 */

interface Step {
  art: 'discover' | 'standardize' | 'operate';
  title: string;
  body: string;
  destination: boolean;
}

const STEPS: readonly [Step, Step, Step] = [
  {
    art: 'discover',
    title: 'Discover',
    body: 'Gain visibility across clusters, registries, images and applications.',
    destination: false,
  },
  {
    art: 'standardize',
    title: 'Standardize',
    body: 'Replace inconsistent public software with verified components.',
    destination: false,
  },
  {
    art: 'operate',
    title: 'Operate',
    body: 'Maintain verified software foundations through continuous verification.',
    destination: true,
  },
];

/** Station top padding and art height; the links sit at 70% of the art, the platforms' level. */
const STATION_PAD = 'clamp(20px, 2vw, 28px)';
const ART_HEIGHT = 'clamp(204px, 17vw, 248px)';
const RAIL_TOP = `calc(${STATION_PAD} + ${ART_HEIGHT} * 0.7 - 5px)`;

/**
 * A fibre link between two stations: a soft glow, flowing dashes, a packet with
 * a comet tail, an arrowhead. At lg it reaches into both neighbouring stations'
 * padding so it spans platform edge to platform edge, not just the gutter.
 */
function FibreLink({ delay }: { delay: string }): React.ReactElement {
  return (
    <div
      aria-hidden
      className="relative z-[1] flex h-14 items-center justify-center lg:block lg:h-auto lg:pt-[var(--rail-top)]"
      style={{ '--rail-top': RAIL_TOP } as React.CSSProperties}
    >
      <span className="relative block h-[10px] w-14 rotate-90 lg:-mx-[clamp(24px,2.8vw,44px)] lg:w-auto lg:rotate-0">
        <span
          className="absolute inset-x-2 top-1/2 h-[6px] -translate-y-1/2 rounded-full"
          style={{
            background: 'linear-gradient(90deg, rgba(124,79,240,0.10), rgba(110,200,255,0.28))',
            filter: 'blur(3px)',
          }}
        />
        <span className="absolute inset-x-1 top-1/2 h-[2px] -translate-y-1/2 overflow-hidden rounded-full">
          <span
            className="cs-tj-link-flow absolute inset-y-0 -left-3 right-0"
            style={{
              background:
                'repeating-linear-gradient(90deg, rgba(124,79,240,0.55) 0 6px, rgba(124,79,240,0) 6px 12px)',
            }}
          />
        </span>
        <span className="cs-tj-link-packet absolute inset-0" style={{ '--d': delay } as React.CSSProperties}>
          <span
            className="absolute right-full top-1/2 h-[2px] w-10 -translate-y-1/2 rounded-full"
            style={{ background: 'linear-gradient(90deg, rgba(110,200,255,0), rgba(110,200,255,0.9))' }}
          />
          <span
            className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: 'radial-gradient(circle, #FFFFFF 0%, #6EC8FF 45%, #7C4FF0 100%)',
              boxShadow: '0 0 12px 3px rgba(110,200,255,0.55)',
            }}
          />
        </span>
        <span
          className="absolute left-0 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: '#FFFFFF', border: '1.5px solid rgba(124,79,240,0.6)' }}
        />
        <ChevronRight
          size={16}
          strokeWidth={2.25}
          className="absolute -right-2 top-1/2 -translate-y-1/2"
          style={{ color: '#7C4FF0' }}
        />
      </span>
    </div>
  );
}

function Station({ step }: { step: Step }): React.ReactElement {
  return (
    <div
      className="cs-tj-card relative flex h-full flex-col items-center text-center transition-[background-color,box-shadow] duration-500 hover:bg-white/80 hover:shadow-[0_24px_50px_-28px_rgba(60,30,150,0.35)]"
      style={{
        borderRadius: '24px',
        padding: `${STATION_PAD} clamp(16px, 1.8vw, 28px) clamp(24px, 2.4vw, 32px)`,
      }}
    >
      {step.destination ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[6%] aspect-square w-[78%] -translate-x-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, rgba(124,79,240,0.30) 0%, rgba(110,200,255,0.10) 55%, rgba(124,79,240,0) 100%)',
          }}
        />
      ) : null}

      <div
        className="relative flex w-full justify-center"
        style={{ height: ART_HEIGHT, filter: 'drop-shadow(0 16px 22px rgba(40,20,90,0.16))' }}
      >
        <TelecomJourneyArt variant={step.art} />
      </div>

      <h3
        className="relative"
        style={{
          marginTop: 'clamp(18px, 1.8vw, 26px)',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-h3)',
          fontWeight: 600,
          letterSpacing: '-0.035em',
          lineHeight: 1.2,
          color: '#111111',
        }}
      >
        {step.destination ? <span className="cs-text-gradient-impact">{step.title}</span> : step.title}
      </h3>
      <p
        className="relative"
        style={{
          marginTop: '10px',
          maxWidth: '30ch',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-body)',
          fontWeight: 400,
          letterSpacing: '-0.01em',
          lineHeight: 1.55,
          color: 'rgba(17,17,17,0.68)',
        }}
      >
        {step.body}
      </p>
    </div>
  );
}

export function TelecomJourney(): React.ReactElement {
  return (
    <Section data-section="TelecomJourney" className="bg-white">
      <Container>
        <Reveal header className="mx-auto max-w-[860px] text-center">
          <h2 style={{ ...H2_STYLE, color: '#111111' }}>
            Build Modern Networks on{' '}
            <span className="cs-text-gradient-impact">Verified Software</span>
          </h2>
        </Reveal>

        <div
          className="relative mx-auto max-w-[1180px]"
          style={{
            marginTop: 'clamp(40px, 4.4vw, 64px)',
            borderRadius: '32px',
            border: '1px solid rgba(154,81,255,0.14)',
            background: 'linear-gradient(180deg, #FCFBFF 0%, #F5F1FF 100%)',
            boxShadow: '0 30px 70px -45px rgba(60,30,150,0.35)',
            padding: 'clamp(10px, 1.2vw, 16px)',
          }}
        >
          {/* Dot field, fading out at the edges, and the destination's glow
              bleeding in from the Operate end. Only this layer clips: the
              stage itself must not, or the tiles dropping in from above the
              frame get cut off at its top edge. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{ borderRadius: 'inherit' }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(rgba(124,79,240,0.16) 1px, transparent 1.4px)',
                backgroundSize: '20px 20px',
                maskImage: 'radial-gradient(ellipse 70% 75% at 50% 45%, #000 30%, transparent 100%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 70% 75% at 50% 45%, #000 30%, transparent 100%)',
              }}
            />
            <div
              className="absolute -right-[10%] top-[-20%] hidden aspect-square w-[46%] rounded-full lg:block"
              style={{
                background:
                  'radial-gradient(closest-side, rgba(124,79,240,0.16) 0%, rgba(124,79,240,0) 100%)',
              }}
            />
          </div>

          <RevealStagger
            gap={0.12}
            className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_clamp(48px,5vw,80px)_minmax(0,1fr)_clamp(48px,5vw,80px)_minmax(0,1fr)]"
          >
            {STEPS.map((step, i) => (
              <Fragment key={step.title}>
                <RevealItem>
                  <Station step={step} />
                </RevealItem>
                {i < STEPS.length - 1 ? (
                  <RevealItem>
                    <FibreLink delay={i === 0 ? '0s' : '1.6s'} />
                  </RevealItem>
                ) : null}
              </Fragment>
            ))}
          </RevealStagger>
        </div>
      </Container>
    </Section>
  );
}
