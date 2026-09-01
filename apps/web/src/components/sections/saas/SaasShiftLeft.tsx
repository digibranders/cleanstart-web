import type React from 'react';
import { Container, Section } from '@/components/layout';
import { Reveal } from '@/components/ui/Reveal';
import { SaasVerifiedCore } from './SaasVerifiedCore';

const VERIFIED_FIRST_DESCRIPTION =
  'Verified Components, Code, Build, Test, Deploy, Security Review' as const;

export function SaasShiftLeft(): React.ReactElement {
  return (
    <Section
      padding="lg"
      data-section="SaasShiftLeft"
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)',
      }}
    >
      <CleanroomAtmosphere />
      <Container className="relative">
        <div className="mx-auto flex max-w-[900px] flex-col items-center gap-5 text-center">
          <Reveal header>
            <h2
              style={{
                margin: 0,
                color: '#FFFFFF',
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 'var(--fs-h2-weight)',
                letterSpacing: 'var(--fs-h2-ls)',
                lineHeight: 'var(--fs-h2-lh)',
              }}
            >
              Move Beyond{' '}
              {/* The shared utility, not an inline gradient. Inline, React
                  re-applies the `background` shorthand on update without
                  re-applying the clip properties beside it, so background-clip
                  falls back to border-box and the heading renders as a solid
                  gradient block with the letters knocked out of it. In a
                  stylesheet the shorthand cannot clobber its own longhands, and
                  every other H2 on the site already uses this class. */}
              <span className="cs-text-gradient-impact">Shift Left</span>
            </h2>
          </Reveal>

          <Reveal delay={0.08}>
            <p
              className="max-w-[760px]"
              style={{
                margin: 0,
                color: 'rgba(225,231,255,0.78)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead)',
                fontWeight: 400,
                lineHeight: 1.55,
              }}
            >
              Modern applications require security to be built into the software components
              developers use, not added after applications are created.
            </p>
          </Reveal>
        </div>

        <ol className="sr-only" aria-label={VERIFIED_FIRST_DESCRIPTION}>
          <li>Verified Components</li>
          <li>Code</li>
          <li>Build</li>
          <li>Test</li>
          <li>Deploy</li>
          <li>Security Review</li>
        </ol>

        <Reveal delay={0.14}>
          <div className="mt-10 lg:mt-14">
            <SaasVerifiedCore />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

function CleanroomAtmosphere(): React.ReactElement {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(133,189,255,0.28) 50%, transparent 100%)',
        }}
      />
      <div
        className="absolute left-1/2 top-[18%] aspect-square w-[min(980px,82vw)] -translate-x-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(42,102,188,0.12) 0%, rgba(42,102,188,0.035) 42%, transparent 72%)',
          filter: 'blur(22px)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(159,190,239,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(159,190,239,0.07) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage:
            'linear-gradient(180deg, transparent 3%, black 32%, black 86%, transparent 100%)',
        }}
      />
      <div
        className="absolute -left-24 bottom-[-180px] hidden aspect-square w-[420px] lg:block"
        style={{
          border: '1px solid rgba(98,142,221,0.1)',
          borderRadius: '32%',
          transform: 'rotate(22deg) skewX(-12deg)',
        }}
      />
      <div
        className="absolute -right-20 top-[30%] hidden h-[460px] w-[240px] -rotate-12 lg:block"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(78,184,220,0.025) 48%, rgba(86,240,211,0.07) 50%, rgba(78,184,220,0.025) 52%, transparent 100%)',
          filter: 'blur(2px)',
        }}
      />
    </div>
  );
}
