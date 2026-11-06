import type React from 'react';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { Container, Section } from '@/components/layout';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';
import { H2_STYLE } from './type';

/*
 * "Build Modern Networks on Verified Software": Discover, Standardize, Operate.
 *
 * Three panels whose tint deepens left to right, ending on the brand violet:
 * the sequence is a move from an unknown estate to a verified one, so the
 * colour carries the progression and no step numbers are needed. Chevron
 * chips sit in the gutters as the joins (rotated to point down when the
 * panels stack).
 *
 * Copy is the brief's, verbatim. "Gain visibility" is spelled correctly here;
 * the mock's "visibillty" is a typo, not copy.
 */

interface Step {
  image: string;
  imageAlt: string;
  title: string;
  body: string;
  surface: string;
  border: string;
  dark: boolean;
}

const STEPS: readonly [Step, Step, Step] = [
  {
    image: '/images/telecom/step-discover.webp',
    imageAlt: '3D magnifying glass resting on a violet platform',
    title: 'Discover',
    body: 'Gain visibility across clusters, registries, images and applications.',
    surface: 'linear-gradient(180deg, #FBFAFF 0%, #F3EFFF 100%)',
    border: 'rgba(154,81,255,0.16)',
    dark: false,
  },
  {
    image: '/images/telecom/step-standardize.webp',
    imageAlt: '3D stack of identical violet tiles on a platform',
    title: 'Standardize',
    body: 'Replace inconsistent public software with verified components.',
    surface: 'linear-gradient(180deg, #F3EEFF 0%, #E4DAFF 100%)',
    border: 'rgba(154,81,255,0.26)',
    dark: false,
  },
  {
    image: '/images/telecom/step-operate.webp',
    imageAlt: '3D gear standing on a violet platform',
    title: 'Operate',
    body: 'Maintain verified software foundations through continuous verification.',
    surface: 'linear-gradient(160deg, #6A3DF0 0%, #3A2BC4 100%)',
    border: 'rgba(255,255,255,0.14)',
    dark: true,
  },
];

function Join(): React.ReactElement {
  return (
    <span
      aria-hidden
      className="absolute bottom-[-30px] left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 rotate-90 items-center justify-center rounded-full lg:bottom-auto lg:left-auto lg:right-[-30px] lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0 lg:rotate-0"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(154,81,255,0.22)',
        boxShadow: '0 8px 20px -10px rgba(76,40,170,0.5)',
        color: '#7C4FF0',
      }}
    >
      <ChevronRight size={18} strokeWidth={2} />
    </span>
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

        <RevealStagger
          gap={0.14}
          className="mx-auto grid max-w-[1180px] grid-cols-1 lg:grid-cols-3"
          style={{ marginTop: 'clamp(40px, 4.4vw, 64px)', gap: '24px' }}
        >
          {STEPS.map((step, i) => (
            <RevealItem key={step.title} className="relative">
              <div
                className="group flex h-full flex-col items-center text-center lg:items-start lg:text-left"
                style={{
                  borderRadius: '24px',
                  background: step.surface,
                  border: `1px solid ${step.border}`,
                  boxShadow: step.dark
                    ? '0 30px 60px -30px rgba(58,43,196,0.65), inset 0 1px 0 rgba(255,255,255,0.18)'
                    : '0 20px 48px -32px rgba(40,30,90,0.25)',
                  padding: 'clamp(24px, 2.4vw, 36px)',
                }}
              >
                <div
                  className="relative w-full"
                  style={{ height: 'clamp(150px, 13vw, 190px)' }}
                >
                  <Image
                    src={step.image}
                    alt={step.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 260px, 60vw"
                    className="object-contain transition-transform duration-500 group-hover:-translate-y-1.5 lg:object-left"
                    style={{
                      filter: step.dark
                        ? 'drop-shadow(0 18px 24px rgba(10,6,40,0.45)) brightness(1.08)'
                        : 'drop-shadow(0 16px 22px rgba(40,20,90,0.16))',
                    }}
                  />
                </div>

                <h3
                  style={{
                    marginTop: 'clamp(20px, 2vw, 28px)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-h3)',
                    fontWeight: 600,
                    letterSpacing: '-0.035em',
                    lineHeight: 1.2,
                    color: step.dark ? '#FFFFFF' : '#111111',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    marginTop: '10px',
                    maxWidth: '32ch',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-body)',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.55,
                    color: step.dark ? 'rgba(255,255,255,0.82)' : 'rgba(17,17,17,0.68)',
                  }}
                >
                  {step.body}
                </p>
              </div>
              {i < STEPS.length - 1 ? <Join /> : null}
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
